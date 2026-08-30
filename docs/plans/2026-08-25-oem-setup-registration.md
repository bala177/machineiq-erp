# OEM Setup & Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace seed-script bootstrapping with a self-service one-time setup flow (OEM name, machine segment, first admin account), and close the existing unauthenticated `POST /auth/register` privilege-escalation hole.

**Architecture:** Two new public endpoints in the existing `AuthModule` (`GET /auth/setup/status`, `POST /auth/setup`), gated by "does any `User` document exist" — permanent, no config flag. `POST /auth/register` gets locked down to admin-only. The frontend gets a new `/setup` page (same branding as `/login`, extracted into a shared component) and a redirect check on `/login`.

**Tech Stack:** NestJS + Mongoose (backend), Next.js App Router + `class-validator` DTOs (frontend/backend), Jest (backend unit tests), Playwright (frontend e2e tests) — all existing, no new dependencies.

**Spec:** `docs/specs/2026-08-25-oem-setup-registration-design.md`

## Global Constraints

- Single-tenant only — no `Organization`/`Tenant` schema, no tenant-scoping. Confirmed with user during brainstorming.
- No auto-created departments during setup — admin creates their own via the existing Departments screen.
- Machine segment is free text, no enum.
- Setup gate is unfiltered `User.countDocuments({}) === 0` (includes soft-deleted) — identical check in both the status endpoint and the setup endpoint itself, no env var toggle.
- Local dev seeding (`run-seed.ts`, `seed-users-only.ts`, `./scripts/reset-db.sh`) is unchanged — this only affects production bootstrapping.
- Password rules for the new admin match `RegisterDto` exactly: min 10 / max 128 chars, at least one uppercase, one lowercase, one digit.
- Follow existing code conventions exactly: `camelCase` fields, `@nestjs/mongoose` schema patterns, `class-validator` DTOs, Jest mocking style from `discussion.service.spec.ts`.

---

### Task 1: Backend — `SetupDto` + `AuthService.setup()` / `getSetupStatus()`

**Files:**
- Modify: `backend/src/modules/auth/auth.dto.ts`
- Modify: `backend/src/modules/auth/auth.service.ts`
- Modify: `backend/src/modules/auth/auth.module.ts`
- Test: `backend/src/modules/auth/auth.dto.spec.ts` (add `SetupDto` cases)
- Test: `backend/src/modules/auth/auth.service.spec.ts` (new file)

**Interfaces:**
- Produces: `AuthService.setup(dto: SetupDto): Promise<{ access_token: string; user: { id, email, firstName, lastName, role } }>` — throws `ForbiddenException` if any user exists.
- Produces: `AuthService.getSetupStatus(): Promise<{ needsSetup: boolean }>`
- Produces: `SetupDto` class (exported from `auth.dto.ts`) with fields `organizationName: string`, `machineSegment?: string`, `email: string`, `password: string`, `firstName: string`, `lastName: string`. No `role` field exists on this DTO at all.
- Consumes: `SettingsService.get(key: string)` and `SettingsService.upsert(key: string, value: any)` from `backend/src/modules/settings/settings.service.ts` (already exist, unchanged).

- [ ] **Step 1: Add `SetupDto` to `auth.dto.ts`**

Add this class at the end of `backend/src/modules/auth/auth.dto.ts` (the file already imports `IsEmail, IsString, MinLength, MaxLength, IsOptional, IsEnum, Matches` from `class-validator` and `Role` from `../../common/enums` — no new imports needed):

```typescript
export class SetupDto {
  @IsString()
  @MaxLength(200)
  organizationName: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  machineSegment?: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(10, { message: 'Password must be at least 10 characters' })
  @MaxLength(128, { message: 'Password must be at most 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @IsString()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MaxLength(100)
  lastName: string;
}
```

- [ ] **Step 2: Add `SetupDto` validation tests to `auth.dto.spec.ts`**

Append to `backend/src/modules/auth/auth.dto.spec.ts` (add `SetupDto` to the existing import on line 4, so it reads `import { LoginDto, RegisterDto, ChangePasswordDto, SetupDto } from './auth.dto';`), then add this new `describe` block at the end of the file:

```typescript
describe('SetupDto', () => {
  function make(overrides: object = {}) {
    return plainToInstance(SetupDto, {
      organizationName: 'Acme Machine Works',
      machineSegment: 'Foundry automation',
      email: 'admin@acme.com',
      password: 'SecurePass1',
      firstName: 'Jane',
      lastName: 'Doe',
      ...overrides,
    });
  }

  it('accepts a valid setup payload', async () => {
    const errors = await validate(make());
    expect(errors).toHaveLength(0);
  });

  it('accepts a payload without machineSegment (optional)', async () => {
    const errors = await validate(make({ machineSegment: undefined }));
    expect(errors).toHaveLength(0);
  });

  it('requires organizationName', async () => {
    const errors = await validate(make({ organizationName: undefined }));
    expect(errors.some((e) => e.property === 'organizationName')).toBe(true);
  });

  it('rejects a password without a number (same rule as RegisterDto)', async () => {
    const errors = await validate(make({ password: 'NoNumbersHere' }));
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('has no role field to validate — role cannot be set via this DTO', () => {
    const instance = make({ role: 'admin' }) as any;
    expect(instance.role).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run the DTO tests to verify they fail (SetupDto doesn't exist as an export usage yet in test file... actually it now exists from Step 1)**

Run: `cd backend && npx jest auth.dto.spec.ts`
Expected: All tests PASS already (Step 1 already added the class) — this step is really just confirming Steps 1+2 are wired correctly. If `SetupDto` were missing, you'd see a TypeScript compile error, not a runtime failure.

- [ ] **Step 4: Wire `SettingsModule` into `AuthModule`**

In `backend/src/modules/auth/auth.module.ts`, add the import and add `SettingsModule` to the `imports` array:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { User, UserSchema } from '../../schemas/user.schema';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '8h'),
        },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    SettingsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
```

- [ ] **Step 5: Add `setup()` and `getSetupStatus()` to `AuthService`**

Note on ordering: Step 6 below writes `auth.service.spec.ts` *after* this
implementation, not before — a deliberate deviation from strict red-green
here. The behavior is small and declarative (a count check, hardcode a
role, delegate to two already-tested `SettingsService` methods), and every
existing spec file in this codebase (see `discussion.service.spec.ts`,
`auth.dto.spec.ts`) follows the same "implementation, then its spec" order
rather than literal TDD — matching that convention. If you'd rather do
true red-green, write Step 6's file first, run it, confirm it fails with
"service.setup is not a function" (it doesn't need `SetupDto` to exist to
fail that way), then come back and do this step.

Replace the full contents of `backend/src/modules/auth/auth.service.ts` with:

```typescript
import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../../schemas/user.schema';
import { Role } from '../../common/enums';
import { SettingsService } from '../settings/settings.service';
import { SetupDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private settingsService: SettingsService,
  ) {}

  async register(dto: { email: string; password: string; firstName: string; lastName: string; role?: string; departmentId?: string }) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.userModel.create({
      ...dto,
      password: hashedPassword,
    });

    const payload = { sub: user._id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email, deletedAt: null }).select('+password');
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user._id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userModel.findOne({ _id: userId, deletedAt: null });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userModel.findOne({ _id: userId, deletedAt: null }).select('+password');
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
  }

  // Unfiltered on purpose — a deployment that has ever had a user (even a
  // soft-deleted one) can never be re-bootstrapped. Both this and setup()
  // below use the identical check.
  async getSetupStatus(): Promise<{ needsSetup: boolean }> {
    const count = await this.userModel.countDocuments({});
    return { needsSetup: count === 0 };
  }

  async setup(dto: SetupDto) {
    const existingCount = await this.userModel.countDocuments({});
    if (existingCount > 0) {
      throw new ForbiddenException('Setup has already been completed for this deployment');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.userModel.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: Role.ADMIN,
    });

    const commercialPreferences = await this.settingsService.get('commercial_preferences');
    await this.settingsService.upsert('commercial_preferences', {
      ...commercialPreferences.value,
      organizationName: dto.organizationName,
      machineSegment: dto.machineSegment || '',
    });

    const payload = { sub: user._id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}
```

- [ ] **Step 6: Write `auth.service.spec.ts`**

Create `backend/src/modules/auth/auth.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SettingsService } from '../settings/settings.service';
import { User } from '../../schemas/user.schema';
import { Role } from '../../common/enums';

const mockModel = {
  countDocuments: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
};

const mockSettingsService = {
  get: jest.fn(),
  upsert: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: mockModel },
        { provide: JwtService, useValue: mockJwtService },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    mockJwtService.sign.mockReturnValue('mock-jwt-token');
  });

  describe('getSetupStatus', () => {
    it('returns needsSetup: true when no users exist', async () => {
      mockModel.countDocuments.mockResolvedValue(0);
      const result = await service.getSetupStatus();
      expect(result).toEqual({ needsSetup: true });
      expect(mockModel.countDocuments).toHaveBeenCalledWith({});
    });

    it('returns needsSetup: false when a user already exists', async () => {
      mockModel.countDocuments.mockResolvedValue(1);
      const result = await service.getSetupStatus();
      expect(result).toEqual({ needsSetup: false });
    });
  });

  describe('setup', () => {
    const setupDto = {
      organizationName: 'Acme Machine Works',
      machineSegment: 'Foundry automation',
      email: 'admin@acme.com',
      password: 'SecurePass1',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    it('creates the first user as admin when the database is empty', async () => {
      mockModel.countDocuments.mockResolvedValue(0);
      mockModel.create.mockResolvedValue({
        _id: 'user-1',
        email: setupDto.email,
        firstName: setupDto.firstName,
        lastName: setupDto.lastName,
        role: Role.ADMIN,
      });
      mockSettingsService.get.mockResolvedValue({ value: { organizationName: 'MachineIQ', organizationEmail: 'sales@machineiq.com' } });

      const result = await service.setup(setupDto as any);

      expect(mockModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: setupDto.email, role: Role.ADMIN }),
      );
      expect(result.user.role).toBe(Role.ADMIN);
      expect(result.access_token).toBe('mock-jwt-token');
    });

    it('never lets role be influenced by input — role is always admin regardless of what setup() is called with', async () => {
      mockModel.countDocuments.mockResolvedValue(0);
      mockModel.create.mockResolvedValue({ _id: 'user-1', email: setupDto.email, role: Role.ADMIN });
      mockSettingsService.get.mockResolvedValue({ value: {} });

      // setupDto has no `role` field at all — this asserts the created
      // document's role is hardcoded, not merely defaulted.
      await service.setup({ ...setupDto, role: 'sales' } as any);

      expect(mockModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: Role.ADMIN }),
      );
      const createCallArg = mockModel.create.mock.calls[0][0];
      expect(createCallArg.role).toBe(Role.ADMIN);
    });

    it('throws ForbiddenException when a user already exists', async () => {
      mockModel.countDocuments.mockResolvedValue(1);
      await expect(service.setup(setupDto as any)).rejects.toThrow(ForbiddenException);
      expect(mockModel.create).not.toHaveBeenCalled();
    });

    it('writes organizationName and machineSegment into commercial_preferences settings', async () => {
      mockModel.countDocuments.mockResolvedValue(0);
      mockModel.create.mockResolvedValue({ _id: 'user-1', email: setupDto.email, role: Role.ADMIN });
      mockSettingsService.get.mockResolvedValue({ value: { organizationEmail: 'sales@machineiq.com' } });

      await service.setup(setupDto as any);

      expect(mockSettingsService.upsert).toHaveBeenCalledWith(
        'commercial_preferences',
        expect.objectContaining({
          organizationName: 'Acme Machine Works',
          machineSegment: 'Foundry automation',
          organizationEmail: 'sales@machineiq.com',
        }),
      );
    });

    it('defaults machineSegment to an empty string when omitted', async () => {
      mockModel.countDocuments.mockResolvedValue(0);
      mockModel.create.mockResolvedValue({ _id: 'user-1', email: setupDto.email, role: Role.ADMIN });
      mockSettingsService.get.mockResolvedValue({ value: {} });

      const { machineSegment, ...withoutSegment } = setupDto;
      await service.setup(withoutSegment as any);

      expect(mockSettingsService.upsert).toHaveBeenCalledWith(
        'commercial_preferences',
        expect.objectContaining({ machineSegment: '' }),
      );
    });
  });
});
```

- [ ] **Step 7: Run the new backend tests**

Run: `cd backend && npx jest auth.service.spec.ts auth.dto.spec.ts`
Expected: All tests PASS (7 new tests in `auth.service.spec.ts`: 2 in `getSetupStatus`, 5 in `setup`; plus the existing `auth.dto.spec.ts` suite plus the 5 new `SetupDto` cases from Step 2).

- [ ] **Step 8: Commit**

```bash
git add backend/src/modules/auth/auth.dto.ts backend/src/modules/auth/auth.dto.spec.ts backend/src/modules/auth/auth.service.ts backend/src/modules/auth/auth.service.spec.ts backend/src/modules/auth/auth.module.ts
git commit -m "feat: add AuthService.setup() and getSetupStatus() for one-time OEM bootstrap"
```

---

### Task 2: Backend — controller endpoints + lock down `POST /auth/register`

**Files:**
- Modify: `backend/src/modules/auth/auth.controller.ts`

**Interfaces:**
- Consumes: `AuthService.setup()`, `AuthService.getSetupStatus()` from Task 1.
- Consumes: `RolesGuard` (`backend/src/guards/roles.guard.ts`) and `Roles` decorator (`backend/src/decorators/roles.decorator.ts`) — both already exist, unchanged, used exactly as `SettingsController` uses them.
- Produces: `GET /api/auth/setup/status` → `{ needsSetup: boolean }`, public.
- Produces: `POST /api/auth/setup` → `{ access_token, user }`, public.
- Produces: `POST /api/auth/register` now requires `AuthGuard('jwt')` + `Roles(Role.ADMIN)` — breaking change for any unauthenticated caller, no change for the existing authenticated "Add User" screen.

- [ ] **Step 1: Update `auth.controller.ts`**

Replace the full contents of `backend/src/modules/auth/auth.controller.ts` with:

```typescript
import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { Role } from '../../common/enums';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, ChangePasswordDto, SetupDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // 30 attempts per minute — still brute-force resistant, comfortable for active development
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  // Public and side-effect-free — safe to call on every page load to decide
  // whether to show the setup wizard or the login screen.
  @Get('setup/status')
  getSetupStatus() {
    return this.authService.getSetupStatus();
  }

  // Public by necessity (there's no admin to authenticate as yet), but
  // gated server-side in AuthService.setup() on "does any user exist" —
  // works exactly once per deployment, permanently, no config flag.
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @Post('setup')
  setup(@Body() dto: SetupDto) {
    return this.authService.setup(dto);
  }

  // Admin-only: this used to be public, which let any caller self-register
  // as admin (role came straight from the request body with no guard).
  // Only caller today is the authenticated "Add User" screen
  // (frontend/src/app/(app)/admin/users/page.tsx), which already sends an
  // admin JWT — this guard changes nothing for that screen.
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Post('change-password')
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(req.user.userId ?? req.user.sub, dto.currentPassword, dto.newPassword);
    return { message: 'Password updated successfully' };
  }
}
```

- [ ] **Step 2: Build the backend to catch any type errors**

Run: `cd backend && npm run build`
Expected: Build succeeds with no errors (this project has no controller-level unit tests — verified via `Glob backend/src/modules/**/*.controller.spec.ts` returning zero matches during planning — so a clean build plus the Task 1 service tests are what this task relies on; the guard itself gets exercised manually in Task 7).

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/auth/auth.controller.ts
git commit -m "feat: expose setup endpoints and lock POST /auth/register to admins"
```

---

### Task 3: Frontend — `setup()` in `auth-provider.tsx`

**Files:**
- Modify: `frontend/src/providers/auth-provider.tsx`

**Interfaces:**
- Consumes: `POST /auth/setup` (Task 2) via `api.post`.
- Produces: `useAuth().setup(data)` — same shape/behavior as the existing `login`/`register` methods (stores token + user, connects socket).

- [ ] **Step 1: Add `setup` to `AuthContextType` and the provider**

In `frontend/src/providers/auth-provider.tsx`, update the `AuthContextType` interface (add one line after the existing `register` line):

```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; role?: string }) => Promise<void>;
  setup: (data: { organizationName: string; machineSegment?: string; email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => void;
}
```

Add the `setup` function right after the existing `register` function body (before `const logout = ...`):

```typescript
  const setup = async (data: { organizationName: string; machineSegment?: string; email: string; password: string; firstName: string; lastName: string }) => {
    const res = await api.post<{ access_token: string; user: User }>('/auth/setup', data);
    localStorage.setItem('machineiq_token', res.access_token);
    localStorage.setItem('machineiq_user', JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
    getSocket(res.user.id);
  };
```

And add `setup` to the context value at the bottom of the component:

```typescript
  return <AuthContext.Provider value={{ user, token, isLoading, login, register, setup, logout }}>{children}</AuthContext.Provider>;
```

- [ ] **Step 2: Type-check the frontend**

Run: `cd frontend && npx tsc --noEmit`
Expected: No new type errors (there will likely be zero errors overall if the project was already clean).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/providers/auth-provider.tsx
git commit -m "feat: add setup() to AuthProvider"
```

---

### Task 4: Frontend — shared brand panel + new `/setup` page

**Files:**
- Create: `frontend/src/components/auth/auth-brand-panel.tsx`
- Modify: `frontend/src/app/login/page.tsx`
- Create: `frontend/src/app/setup/page.tsx`

**Interfaces:**
- Produces: `AuthBrandPanel` (default export) and `LogoIcon` (named export) from `frontend/src/components/auth/auth-brand-panel.tsx` — no props, renders the exact left-panel branding currently inline in `login/page.tsx`.
- Consumes: `useAuth().setup` from Task 3.
- Consumes: `api.get<{ needsSetup: boolean }>('/auth/setup/status')` from `frontend/src/lib/api.ts` (unchanged, already generic).

This task extracts ~140 lines of SVG/branding JSX that are currently duplicated-in-waiting (both `/login` and the new `/setup` page need identical left-panel branding) into one shared component, rather than copy-pasting it — this is a small, targeted refactor of code this task is already touching, not a scope-creeping rewrite.

- [ ] **Step 1: Create the shared brand panel component**

Create `frontend/src/components/auth/auth-brand-panel.tsx` with the `LogoIcon`, `MachineBg`, and the left-panel JSX exactly as they currently exist in `frontend/src/app/login/page.tsx` (lines 8-141 for the two helper components, lines 143 for `features`, and lines 169-229 for the panel markup itself), reassembled into one exported component:

```tsx
export function LogoIcon({ size = 24, color = '#5990ff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="7" height="9" rx="1" />
      <rect x="15" y="3" width="7" height="5" rx="1" />
      <rect x="15" y="12" width="7" height="9" rx="1" />
      <rect x="2" y="16" width="7" height="5" rx="1" />
      <line x1="9" y1="7" x2="15" y2="7" />
      <line x1="9" y1="19" x2="15" y2="19" />
    </svg>
  );
}

function MachineBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(89,144,255,0.22) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 520 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <g opacity="0.22" stroke="#4a7ae0" fill="none">
          <rect x="40" y="290" width="88" height="44" rx="5" strokeWidth="1.5" fill="rgba(26,79,255,0.05)" />
          <text x="84" y="317" textAnchor="middle" fill="#6b9dff" fontSize="9" fontFamily="monospace" opacity="0.7">
            OPPORTUNITY
          </text>

          <rect x="216" y="248" width="88" height="44" rx="5" strokeWidth="1.5" fill="rgba(26,79,255,0.05)" />
          <text x="260" y="275" textAnchor="middle" fill="#6b9dff" fontSize="9" fontFamily="monospace" opacity="0.7">
            ENGINEERING
          </text>

          <rect x="216" y="336" width="88" height="44" rx="5" strokeWidth="1.5" fill="rgba(26,79,255,0.05)" />
          <text x="260" y="363" textAnchor="middle" fill="#6b9dff" fontSize="9" fontFamily="monospace" opacity="0.7">
            TASKS
          </text>

          <rect x="392" y="290" width="88" height="44" rx="5" strokeWidth="1.5" fill="rgba(26,79,255,0.05)" />
          <text x="436" y="317" textAnchor="middle" fill="#6b9dff" fontSize="9" fontFamily="monospace" opacity="0.7">
            PROCUREMENT
          </text>

          <rect x="392" y="400" width="88" height="44" rx="5" strokeWidth="1.5" fill="rgba(26,79,255,0.05)" />
          <text x="436" y="427" textAnchor="middle" fill="#6b9dff" fontSize="9" fontFamily="monospace" opacity="0.7">
            BUILD
          </text>

          <line x1="128" y1="312" x2="216" y2="270" strokeWidth="1.2" />
          <line x1="128" y1="312" x2="216" y2="358" strokeWidth="1.2" />
          <line x1="304" y1="270" x2="392" y2="312" strokeWidth="1.2" />
          <line x1="304" y1="358" x2="392" y2="422" strokeWidth="1.2" />
          <line x1="480" y1="312" x2="520" y2="312" strokeWidth="1.2" />

          <polygon points="216,266 208,274 224,274" fill="#4a7ae0" opacity="0.5" />
          <polygon points="216,354 208,362 224,362" fill="#4a7ae0" opacity="0.5" />
          <polygon points="392,308 384,316 400,316" fill="#4a7ae0" opacity="0.5" />
          <polygon points="392,418 384,426 400,426" fill="#4a7ae0" opacity="0.5" />

          <circle cx="128" cy="312" r="4" fill="#4a7ae0" opacity="0.6" />
          <circle cx="304" cy="270" r="4" fill="#4a7ae0" opacity="0.6" />
          <circle cx="304" cy="358" r="4" fill="#4a7ae0" opacity="0.6" />
          <circle cx="480" cy="312" r="4" fill="#4a7ae0" opacity="0.6" />

          <line x1="260" y1="292" x2="260" y2="336" strokeWidth="1" strokeDasharray="4 3" />
        </g>

        <g opacity="0.28" stroke="#5990ff" strokeWidth="1.4" fill="none">
          <rect x="358" y="22" width="72" height="50" rx="4" fill="rgba(26,79,255,0.04)" />
          <rect x="442" y="22" width="44" height="28" rx="4" fill="rgba(26,79,255,0.04)" />
          <rect x="442" y="60" width="44" height="42" rx="4" fill="rgba(26,79,255,0.04)" />
          <rect x="358" y="82" width="72" height="28" rx="4" fill="rgba(26,79,255,0.04)" />
          <line x1="430" y1="43" x2="442" y2="43" />
          <line x1="430" y1="93" x2="442" y2="93" />
          <circle cx="430" cy="43" r="2.5" fill="#5990ff" />
          <circle cx="430" cy="93" r="2.5" fill="#5990ff" />
          <circle cx="442" cy="43" r="2.5" fill="#5990ff" />
          <circle cx="442" cy="93" r="2.5" fill="#5990ff" />
        </g>

        <g opacity="0.3" stroke="#4a7ae0" strokeWidth="1.2" fill="none">
          <path d="M0 800 L42 800 L42 748 L95 748 L95 698" />
          <path d="M0 750 L22 750 L22 700 L65 700" />
          <circle cx="42" cy="800" r="3" fill="#5990ff" />
          <circle cx="95" cy="748" r="3" fill="#5990ff" />
          <circle cx="22" cy="750" r="3" fill="#5990ff" />
          <circle cx="65" cy="700" r="3" fill="#5990ff" />
          <circle cx="95" cy="698" r="3" fill="#5990ff" />
        </g>

        <g opacity="0.2" stroke="#5990ff" strokeWidth="1">
          <line x1="500" y1="480" x2="520" y2="480" />
          <line x1="506" y1="494" x2="520" y2="494" />
          <line x1="510" y1="508" x2="520" y2="508" />
          <line x1="506" y1="522" x2="520" y2="522" />
          <line x1="500" y1="536" x2="520" y2="536" />
        </g>
      </svg>

      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(11,17,32,0.7) 0%, rgba(11,17,32,0.08) 22%, rgba(11,17,32,0.08) 78%, rgba(11,17,32,0.75) 100%)',
        }}
      />
    </div>
  );
}

const features = ['Sales handover to engineering — seamless', 'Real-time task execution across departments', 'Procurement readiness built into every project'];

export function AuthBrandPanel() {
  return (
    <div className="relative hidden lg:flex lg:w-[38%] xl:w-[36%] flex-shrink-0 flex-col bg-[#0b1120] border-r border-[#1a2744] overflow-hidden">
      <MachineBg />

      <div className="relative z-10 px-12 pt-12">
        <div className="flex items-center gap-3.5">
          <LogoIcon size={34} color="#5990ff" />
          <span className="text-[26px] font-semibold tracking-tight text-white">
            Machine<span className="font-bold text-brand-400">IQ</span>
          </span>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-center px-12 py-16">
        <p className="mb-5 text-[15px] font-bold uppercase tracking-[0.18em] text-brand-500">OEM Machine Execution Platform</p>

        <h2 className="text-[3.2rem] font-bold leading-[1.1] tracking-tight text-white">
          Engineering
          <br />
          execution,
          <br />
          end to end.
        </h2>

        <p className="mt-7 text-[17px] leading-relaxed text-slate-400">From sales handover to final build — one unified platform built for OEM machine builders.</p>

        <ul className="mt-9 space-y-5">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-3">
              <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />
              <span className="text-[16px] text-slate-300">{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex gap-10 border-t border-[#1a2744] pt-9">
          <div>
            <p className="text-[2rem] font-bold text-white">12+</p>
            <p className="mt-1 text-[16px] text-slate-500">Core Modules</p>
          </div>
          <div>
            <p className="text-[2rem] font-bold text-white">100%</p>
            <p className="mt-1 text-[16px] text-slate-500">Visibility</p>
          </div>
          <div>
            <p className="text-[2rem] font-bold text-white">Live</p>
            <p className="mt-1 text-[16px] text-slate-500">Collaboration</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-12 pb-8">
        <p className="text-[16px] text-slate-600">
          &copy; {new Date().getFullYear()} MachineIQ Platform
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `login/page.tsx` to use the shared component**

Replace the full contents of `frontend/src/app/login/page.tsx` with:

```tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { api } from '@/lib/api';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { AuthBrandPanel, LogoIcon } from '@/components/auth/auth-brand-panel';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    api.get<{ needsSetup: boolean }>('/auth/setup/status')
      .then((res) => {
        if (cancelled) return;
        if (res.needsSetup) {
          router.replace('/setup');
          return;
        }
        setChecking(false);
      })
      .catch(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f4f6fb]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600/30 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh">
      <AuthBrandPanel />

      {/* ── Right panel — form ── */}
      <div className="flex flex-1 min-w-0 items-center justify-center bg-[#f4f6fb] p-6">
        <div className="w-full max-w-[420px] animate-fade-in">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <LogoIcon size={22} color="#1a4fff" />
            <span className="text-[17px] font-semibold text-fg">
              Machine<span className="font-bold text-brand-600">IQ</span>
            </span>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-[#e2e6f0] bg-white px-8 py-10 shadow-elevated">
            <div className="mb-7">
              <h1 className="text-[1.6rem] font-bold tracking-tight text-slate-900">Welcome back</h1>
              <p className="mt-1.5 text-[16px] text-slate-500">Enter your credentials to access your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 animate-slide-up">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-2 block text-[15px] font-semibold text-slate-700">
                  Email address
                </label>
                <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field text-[16px]" placeholder="you@company.com" />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-[15px] font-semibold text-slate-700">
                  Password
                </label>
                <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field text-[16px]" placeholder="Enter your password" />
              </div>

              <button type="submit" disabled={loading} className="btn-primary mt-1 w-full py-3 text-[16px]">
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-[16px] text-slate-400">Protected by enterprise-grade security</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend/src/app/setup/page.tsx`**

```tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { api } from '@/lib/api';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { AuthBrandPanel, LogoIcon } from '@/components/auth/auth-brand-panel';

export default function SetupPage() {
  const [organizationName, setOrganizationName] = useState('');
  const [machineSegment, setMachineSegment] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { setup } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    api.get<{ needsSetup: boolean }>('/auth/setup/status')
      .then((res) => {
        if (cancelled) return;
        if (!res.needsSetup) {
          router.replace('/login');
          return;
        }
        setChecking(false);
      })
      .catch(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await setup({
        organizationName,
        machineSegment: machineSegment || undefined,
        email,
        password,
        firstName,
        lastName,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f4f6fb]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600/30 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh">
      <AuthBrandPanel />

      <div className="flex flex-1 min-w-0 items-center justify-center bg-[#f4f6fb] p-6 py-12">
        <div className="w-full max-w-[420px] animate-fade-in">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <LogoIcon size={22} color="#1a4fff" />
            <span className="text-[17px] font-semibold text-fg">
              Machine<span className="font-bold text-brand-600">IQ</span>
            </span>
          </div>

          <div className="rounded-2xl border border-[#e2e6f0] bg-white px-8 py-10 shadow-elevated">
            <div className="mb-7">
              <h1 className="text-[1.6rem] font-bold tracking-tight text-slate-900">Set up your workspace</h1>
              <p className="mt-1.5 text-[16px] text-slate-500">This runs once — create your company profile and the first admin account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 animate-slide-up">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="organizationName" className="mb-2 block text-[15px] font-semibold text-slate-700">
                  OEM company name
                </label>
                <input id="organizationName" type="text" required value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} className="input-field text-[16px]" placeholder="Acme Machine Works" />
              </div>

              <div>
                <label htmlFor="machineSegment" className="mb-2 block text-[15px] font-semibold text-slate-700">
                  Machine segment <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input id="machineSegment" type="text" value={machineSegment} onChange={(e) => setMachineSegment(e.target.value)} className="input-field text-[16px]" placeholder="e.g. Foundry automation, SPM & fixtures" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="mb-2 block text-[15px] font-semibold text-slate-700">
                    First name
                  </label>
                  <input id="firstName" type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input-field text-[16px]" placeholder="Jane" />
                </div>
                <div>
                  <label htmlFor="lastName" className="mb-2 block text-[15px] font-semibold text-slate-700">
                    Last name
                  </label>
                  <input id="lastName" type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="input-field text-[16px]" placeholder="Doe" />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-[15px] font-semibold text-slate-700">
                  Email address
                </label>
                <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field text-[16px]" placeholder="you@company.com" />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-[15px] font-semibold text-slate-700">
                  Password
                </label>
                <input id="password" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field text-[16px]" placeholder="At least 10 characters" />
                <p className="mt-1.5 text-[13px] text-slate-400">Must include an uppercase letter, a lowercase letter, and a number.</p>
              </div>

              <button type="submit" disabled={loading} className="btn-primary mt-1 w-full py-3 text-[16px]">
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    Create workspace
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-[16px] text-slate-400">This page only works once — it disables itself after the first admin account exists.</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Type-check and build the frontend**

Run: `cd frontend && npx tsc --noEmit && npm run build`
Expected: Both succeed with no errors. The build output should list `/setup` alongside `/login` in the route table.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/auth/auth-brand-panel.tsx frontend/src/app/login/page.tsx frontend/src/app/setup/page.tsx
git commit -m "feat: add /setup page and needs-setup redirect on /login"
```

---

### Task 5: Frontend — Playwright mocks + e2e tests for the setup flow

**Files:**
- Modify: `frontend/tests/fixtures/test-helpers.ts`
- Create: `frontend/tests/setup.spec.ts`

**Interfaces:**
- Consumes: `MockOptions` type and `installApiMocks` from `test-helpers.ts` — adds one new option, `needsSetup?: boolean` (defaults to `false` so all existing tests that don't pass it keep behaving exactly as before).

- [ ] **Step 1: Add `needsSetup` to `MockOptions` and mock the two new routes**

In `frontend/tests/fixtures/test-helpers.ts`, update the `MockOptions` type (add one field):

```typescript
type MockOptions = {
  loginFails?: boolean;
  forceUnauthorized?: boolean;
  needsSetup?: boolean;
  empty?: Partial<Record<'dashboard' | 'opportunities' | 'projects' | 'tasks' | 'machines' | 'procurement' | 'documents' | 'decisions' | 'notifications' | 'users' | 'components' | 'deliverables', boolean>>;
  formFailures?: Partial<Record<'opportunity' | 'project', string>>;
  detailNotFound?: Partial<Record<'opportunity' | 'project', boolean>>;
};
```

Add these two route handlers immediately after the existing `/auth/login` handler (right after its closing `}` at what is currently line 164, before the `/dashboard/executive` handler):

```typescript
    if (path === '/auth/setup/status' && method === 'GET') {
      await route.fulfill(jsonResponse({ needsSetup: options.needsSetup ?? false }));
      return;
    }

    if (path === '/auth/setup' && method === 'POST') {
      await route.fulfill(jsonResponse({ access_token: 'token-admin', user: adminUser }));
      return;
    }
```

- [ ] **Step 2: Create `frontend/tests/setup.spec.ts`**

```typescript
import { expect, test } from '@playwright/test';
import { installApiMocks } from './fixtures/test-helpers';

test('redirects to setup when no admin exists yet', async ({ page }) => {
  await installApiMocks(page, { needsSetup: true });
  await page.goto('/login');
  await expect(page).toHaveURL(/\/setup$/, { timeout: 10000 });
  await expect(page.getByRole('heading', { name: 'Set up your workspace' })).toBeVisible();
});

test('does not redirect to setup once an admin exists', async ({ page }) => {
  await installApiMocks(page, { needsSetup: false });
  await page.goto('/login');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});

test('redirects away from setup once an admin exists', async ({ page }) => {
  await installApiMocks(page, { needsSetup: false });
  await page.goto('/setup');
  await expect(page).toHaveURL(/\/login$/, { timeout: 10000 });
});

test('completes setup and lands on the dashboard', async ({ page }) => {
  await installApiMocks(page, { needsSetup: true });
  await page.goto('/setup');
  await expect(page.getByRole('heading', { name: 'Set up your workspace' })).toBeVisible();

  await page.getByLabel('OEM company name').fill('Acme Machine Works');
  await page.getByLabel(/Machine segment/).fill('Foundry automation');
  await page.getByLabel('First name').fill('Jane');
  await page.getByLabel('Last name').fill('Doe');
  await page.getByLabel('Email address').fill('jane@acme.com');
  await page.getByLabel('Password').fill('SecurePass1');
  await page.getByRole('button', { name: 'Create workspace' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
```

- [ ] **Step 3: Run the new and existing auth-related Playwright tests**

Run: `cd frontend && npx playwright test setup.spec.ts auth.spec.ts --reporter=list`
Expected: All tests PASS — the 4 new tests in `setup.spec.ts`, and all existing tests in `auth.spec.ts` unaffected (they don't pass `needsSetup`, which defaults to `false`, so `/login` never redirects away for them).

- [ ] **Step 4: Commit**

```bash
git add frontend/tests/fixtures/test-helpers.ts frontend/tests/setup.spec.ts
git commit -m "test: add e2e coverage for the setup flow and needs-setup redirect"
```

---

### Task 6: Full verification pass and push

**Files:** none (verification only)

- [ ] **Step 1: Run the full backend test suite**

Run: `cd backend && npm test`
Expected: All suites pass, including the new `auth.service.spec.ts`. Compare the total test count to the pre-change baseline (351 tests, per the most recent full run) — it should now be 351 + 7 (new `auth.service.spec.ts` tests) + 5 (new `SetupDto` cases in `auth.dto.spec.ts`) = 363.

- [ ] **Step 2: Run the full frontend Playwright suite**

Run: `cd frontend && npx playwright test --reporter=list`
Expected: All tests pass except the 4 pre-existing failures already documented in `CLAUDE.md` under "Known pre-existing failures" (project detail execution snapshot, machine breakdown tree, procurement mobile view, opportunity-to-project conversion) — those are unrelated to this change. Any *other* failure is a regression to fix before continuing.

- [ ] **Step 3: Manual end-to-end check against a genuinely empty local database**

```bash
cd backend
npx ts-node src/seeds/drop-db.ts
```

Then start the dev servers (`./scripts/dev.sh` from the repo root) and in a browser:
1. Visit `http://localhost:4050/login` → confirm it redirects to `/setup`.
2. Fill in the setup form (OEM name, machine segment, name, email, a valid password) and submit → confirm it lands on `/dashboard` and the sidebar shows the new user's initials.
3. Visit `/settings` (as admin) → confirm `organizationName` reflects what was entered during setup.
4. Log out, visit `/login` → confirm it does *not* redirect to `/setup` this time (an admin now exists).
5. Manually `POST` to `/api/auth/setup` again (e.g. via `curl` or the browser devtools network tab replay) → confirm it returns a 403 `ForbiddenException`, not a second admin.
6. As the new admin, open the "Add User" screen and create a second user → confirm this still works (validates the `RolesGuard` lockdown on `/auth/register` didn't break the existing authenticated flow).
7. In a private/incognito window (no auth token), try `curl -X POST http://localhost:4051/api/auth/register -H "Content-Type: application/json" -d '{"email":"attacker@test.com","password":"Whatever123","firstName":"A","lastName":"B","role":"admin"}'` → confirm it now returns 401 Unauthorized (previously this would have silently created an admin).

- [ ] **Step 4: Restore local dev data**

The drop in Step 3 wiped local dev data for this manual check. Restore it:

```bash
./scripts/reset-db.sh --demo
```

- [ ] **Step 5: Push**

```bash
git push origin master
```

- [ ] **Step 6: Verify against the production Atlas database**

Per the spec's verification plan: hit `GET https://machineiq-api.onrender.com/api/auth/setup/status` directly (after Render redeploys from the push in Step 5).
- `{"needsSetup": true}` → proceed to `https://www.machineiq.tech/setup` (or the onrender.com URL) and create the real production admin account.
- `{"needsSetup": false}` → a user already exists in production Atlas from an earlier attempt — stop and investigate what's actually in that `users` collection before doing anything else, rather than assuming.

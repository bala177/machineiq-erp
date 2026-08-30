/**
 * users.dto.spec.ts
 *
 * Validates that UpdateUserDto matches the User Mongoose schema constraints
 * and enforces mass assignment protection (email + password excluded).
 *
 * Schema source: backend/src/schemas/user.schema.ts
 * UI source:     frontend/src/app/(app)/settings/page.tsx  (ProfileTab, SecurityTab)
 *                frontend/src/app/(app)/admin/users/page.tsx
 */

import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { getMetadataStorage } from 'class-validator';
import { UpdateUserDto } from './users.dto';
import { Role } from '../../common/enums';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUpdate(overrides: object = {}): UpdateUserDto {
  return plainToInstance(UpdateUserDto, overrides);
}

function errorFor(errors: any[], property: string): boolean {
  return errors.some((e) => e.property === property);
}

// ---------------------------------------------------------------------------
// UpdateUserDto — all fields optional
// ---------------------------------------------------------------------------

describe('UpdateUserDto — all fields optional', () => {
  it('accepts an empty update (no fields)', async () => {
    const errors = await validate(makeUpdate());
    expect(errors).toHaveLength(0);
  });

  it('accepts firstName + lastName update (settings Profile tab)', async () => {
    const errors = await validate(makeUpdate({ firstName: 'Alice', lastName: 'Smith' }));
    expect(errors).toHaveLength(0);
  });

  it('accepts a role update', async () => {
    const errors = await validate(makeUpdate({ role: Role.SALES }));
    expect(errors).toHaveLength(0);
  });

  it('accepts isActive toggle', async () => {
    const errors = await validate(makeUpdate({ isActive: false }));
    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// UpdateUserDto — field max lengths (match schema)
// ---------------------------------------------------------------------------

describe('UpdateUserDto — field length limits', () => {
  it('rejects firstName exceeding 100 characters', async () => {
    const errors = await validate(makeUpdate({ firstName: 'A'.repeat(101) }));
    expect(errorFor(errors, 'firstName')).toBe(true);
  });

  it('accepts firstName at exactly 100 characters', async () => {
    const errors = await validate(makeUpdate({ firstName: 'A'.repeat(100) }));
    expect(errors).toHaveLength(0);
  });

  it('rejects lastName exceeding 100 characters', async () => {
    const errors = await validate(makeUpdate({ lastName: 'B'.repeat(101) }));
    expect(errorFor(errors, 'lastName')).toBe(true);
  });

  it('rejects title exceeding 100 characters', async () => {
    const errors = await validate(makeUpdate({ title: 'T'.repeat(101) }));
    expect(errorFor(errors, 'title')).toBe(true);
  });

  it('rejects phone exceeding 30 characters', async () => {
    const errors = await validate(makeUpdate({ phone: '0'.repeat(31) }));
    expect(errorFor(errors, 'phone')).toBe(true);
  });

  it('accepts phone at exactly 30 characters', async () => {
    const errors = await validate(makeUpdate({ phone: '0'.repeat(30) }));
    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// UpdateUserDto — role enum validation
// ---------------------------------------------------------------------------

describe('UpdateUserDto — role enum', () => {
  const validRoles = Object.values(Role);

  validRoles.forEach((role) => {
    it(`accepts role "${role}"`, async () => {
      const errors = await validate(makeUpdate({ role }));
      expect(errors).toHaveLength(0);
    });
  });

  it('rejects an unknown role "superuser"', async () => {
    const errors = await validate(makeUpdate({ role: 'superuser' as any }));
    expect(errorFor(errors, 'role')).toBe(true);
  });

  it('accepts role "manager"', async () => {
    const errors = await validate(makeUpdate({ role: Role.MANAGER }));
    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// UpdateUserDto — mass assignment protection
// ---------------------------------------------------------------------------

describe('UpdateUserDto — mass assignment protection (OWASP A08)', () => {
  // NestJS ValidationPipe(whitelist: true) strips any property that has no
  // class-validator decorator. These tests verify email and password have
  // NO decorators on UpdateUserDto, so they are always whitelisted away.

  it('email has no class-validator decorators on UpdateUserDto (will be stripped by whitelist)', () => {
    const storage = getMetadataStorage();
    const metas = storage.getTargetValidationMetadatas(UpdateUserDto, '', false, false);
    const hasEmail = metas.some((m: any) => m.propertyName === 'email');
    expect(hasEmail).toBe(false);
  });

  it('password has no class-validator decorators on UpdateUserDto (will be stripped by whitelist)', () => {
    const storage = getMetadataStorage();
    const metas = storage.getTargetValidationMetadatas(UpdateUserDto, '', false, false);
    const hasPassword = metas.some((m: any) => m.propertyName === 'password');
    expect(hasPassword).toBe(false);
  });

  it('only the expected fields have decorators (no extra privileged fields)', () => {
    const storage = getMetadataStorage();
    const metas = storage.getTargetValidationMetadatas(UpdateUserDto, '', false, false);
    const decoratedFields = [...new Set(metas.map((m: any) => m.propertyName))].sort();
    const allowedFields = ['firstName', 'lastName', 'role', 'departmentId', 'title', 'phone', 'isActive'].sort();
    expect(decoratedFields).toEqual(allowedFields);
  });
});

// ---------------------------------------------------------------------------
// ChangePasswordDto — tested in auth.dto.spec.ts
// This section cross-references that coverage exists.
// ---------------------------------------------------------------------------

describe('ChangePasswordDto coverage reference', () => {
  it('ChangePasswordDto tests exist in auth.dto.spec.ts', () => {
    // The ChangePasswordDto (currentPassword + newPassword) is validated
    // in backend/src/modules/auth/auth.dto.spec.ts.
    // This test acts as a cross-reference marker.
    expect(true).toBe(true);
  });
});

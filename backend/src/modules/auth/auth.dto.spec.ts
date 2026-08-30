import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto, RegisterDto, ChangePasswordDto, SetupDto } from './auth.dto';

describe('LoginDto', () => {
  function make(overrides: object = {}) {
    return plainToInstance(LoginDto, { email: 'user@example.com', password: 'ValidPass1', ...overrides });
  }

  it('accepts a valid login payload', async () => {
    const errors = await validate(make());
    expect(errors).toHaveLength(0);
  });

  it('rejects a missing email', async () => {
    const errors = await validate(make({ email: undefined }));
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('rejects an invalid email format', async () => {
    const errors = await validate(make({ email: 'not-an-email' }));
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('rejects a password over 128 characters (bcrypt DoS guard)', async () => {
    const errors = await validate(make({ password: 'A'.repeat(129) }));
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('accepts a password at the 128-character limit', async () => {
    const errors = await validate(make({ password: 'A'.repeat(128) }));
    expect(errors).toHaveLength(0);
  });
});

describe('RegisterDto', () => {
  function make(overrides: object = {}) {
    return plainToInstance(RegisterDto, {
      email: 'newuser@example.com',
      password: 'SecurePass1',
      firstName: 'Jane',
      lastName: 'Doe',
      ...overrides,
    });
  }

  it('accepts a valid registration payload', async () => {
    const errors = await validate(make());
    expect(errors).toHaveLength(0);
  });

  it('rejects a password shorter than 10 characters', async () => {
    const errors = await validate(make({ password: 'Short1' }));
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('rejects a password without an uppercase letter', async () => {
    const errors = await validate(make({ password: 'alllowercase1' }));
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('rejects a password without a lowercase letter', async () => {
    const errors = await validate(make({ password: 'ALLUPPERCASE1' }));
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('rejects a password without a number', async () => {
    const errors = await validate(make({ password: 'NoNumbersHere' }));
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('rejects a password over 128 characters', async () => {
    const errors = await validate(make({ password: 'Aa1' + 'x'.repeat(130) }));
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('rejects an invalid role enum value', async () => {
    const errors = await validate(make({ role: 'superuser' }));
    expect(errors.some((e) => e.property === 'role')).toBe(true);
  });

  it('accepts a valid role enum value', async () => {
    const errors = await validate(make({ role: 'admin' }));
    expect(errors).toHaveLength(0);
  });

  it('requires firstName', async () => {
    const errors = await validate(make({ firstName: undefined }));
    expect(errors.some((e) => e.property === 'firstName')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ChangePasswordDto
// ---------------------------------------------------------------------------

describe('ChangePasswordDto', () => {
  function make(overrides: object = {}) {
    return plainToInstance(ChangePasswordDto, {
      currentPassword: 'OldPass123',
      newPassword: 'NewPass123',
      ...overrides,
    });
  }

  it('accepts a valid change-password payload', async () => {
    const errors = await validate(make());
    expect(errors).toHaveLength(0);
  });

  it('rejects currentPassword over 128 characters (bcrypt DoS guard)', async () => {
    const errors = await validate(make({ currentPassword: 'A'.repeat(129) }));
    expect(errors.some((e) => e.property === 'currentPassword')).toBe(true);
  });

  it('accepts currentPassword at exactly 128 characters', async () => {
    const errors = await validate(make({ currentPassword: 'A'.repeat(128) }));
    expect(errors).toHaveLength(0);
  });

  it('rejects newPassword shorter than 10 characters', async () => {
    const errors = await validate(make({ newPassword: 'Short1' }));
    expect(errors.some((e) => e.property === 'newPassword')).toBe(true);
  });

  it('rejects newPassword over 128 characters', async () => {
    const errors = await validate(make({ newPassword: 'Aa1' + 'x'.repeat(130) }));
    expect(errors.some((e) => e.property === 'newPassword')).toBe(true);
  });

  it('rejects newPassword without an uppercase letter', async () => {
    const errors = await validate(make({ newPassword: 'alllowercase1' }));
    expect(errors.some((e) => e.property === 'newPassword')).toBe(true);
  });

  it('rejects newPassword without a lowercase letter', async () => {
    const errors = await validate(make({ newPassword: 'ALLUPPERCASE1' }));
    expect(errors.some((e) => e.property === 'newPassword')).toBe(true);
  });

  it('rejects newPassword without a digit', async () => {
    const errors = await validate(make({ newPassword: 'NoDigitsHere' }));
    expect(errors.some((e) => e.property === 'newPassword')).toBe(true);
  });

  it('accepts newPassword at exactly 10 characters (minimum)', async () => {
    const errors = await validate(make({ newPassword: 'ValidPas1!' }));
    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// SetupDto
// ---------------------------------------------------------------------------

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
});

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from '../modules/auth/auth.dto';
import { UpdateUserDto } from '../modules/users/users.dto';

const VALID_UUID = 'c40f899a-37f8-4bad-a886-7753d1561626';

const registerBody = (departmentId: unknown) => ({
  email: 'new.user@machineiq.com',
  password: 'SecurePass1',
  firstName: 'Bala',
  lastName: 'Bala',
  role: 'admin',
  departmentId,
});

describe('optional uuid foreign keys', () => {
  // The "No department" option in the Add/Edit User dropdowns submits '' —
  // this used to reach PostgreSQL and fail with
  // `invalid input syntax for type uuid: ""`, surfacing as an opaque 500.
  it('accepts the empty string the "No department" option submits', async () => {
    const dto = plainToInstance(RegisterDto, registerBody(''));

    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto.departmentId).toBeNull();
  });

  it('clears the department on update rather than leaving it unchanged', async () => {
    const dto = plainToInstance(UpdateUserDto, { departmentId: '   ' });

    await expect(validate(dto)).resolves.toEqual([]);
    // null, not undefined — TypeORM's merge skips undefined and would keep the
    // user's previous department.
    expect(dto.departmentId).toBeNull();
    expect(dto.departmentId).not.toBeUndefined();
  });

  it('keeps a real department id untouched', async () => {
    const dto = plainToInstance(RegisterDto, registerBody(VALID_UUID));

    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto.departmentId).toBe(VALID_UUID);
  });

  it('rejects a malformed id with a validation error instead of a 500', async () => {
    const dto = plainToInstance(RegisterDto, registerBody('not-a-uuid'));

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('departmentId');
    expect(Object.values(errors[0].constraints ?? {})).toContain('departmentId must be a valid department id');
  });

  it('leaves an omitted department absent', async () => {
    const { departmentId, ...body } = registerBody(undefined);
    const dto = plainToInstance(RegisterDto, body);

    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto.departmentId).toBeUndefined();
  });
});

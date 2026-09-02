import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateDepartmentDto, UpdateDepartmentDto } from './departments.dto';

describe('Department DTOs', () => {
  it('normalizes a valid create payload', async () => {
    const dto = plainToInstance(CreateDepartmentDto, { name: '  Controls  ', code: ' ctrl ' });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({ name: 'Controls', code: 'CTRL' });
  });

  it('requires a non-empty name', async () => {
    const dto = plainToInstance(CreateDepartmentDto, { name: '   ' });
    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('rejects unknown update value types', async () => {
    const dto = plainToInstance(UpdateDepartmentDto, { isActive: 'yes' });
    expect(await validate(dto)).not.toHaveLength(0);
  });
});

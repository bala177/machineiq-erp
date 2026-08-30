import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LocationType } from '../../schemas/organization.schema';
import { CreateBranchDto, CreateLocationDto } from './organization.dto';

describe('Organization DTOs', () => {
  it('normalizes branch codes', async () => {
    const dto = plainToInstance(CreateBranchDto, { code: ' blr-hq ', name: 'Head Office', companyId: '8ac46d21-62eb-4e41-96d6-d2d5e516fdd1' });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.code).toBe('BLR-HQ');
  });

  it('rejects unknown location types', async () => {
    const dto = plainToInstance(CreateLocationDto, {
      code: 'LOC-01', name: 'Test location', branchId: '8ac46d21-62eb-4e41-96d6-d2d5e516fdd1', type: 'yard',
    });
    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'type')).toBe(true);
  });

  it('accepts supported warehouse locations', async () => {
    const dto = plainToInstance(CreateLocationDto, {
      code: 'WH-01', name: 'Main warehouse', branchId: '8ac46d21-62eb-4e41-96d6-d2d5e516fdd1', type: LocationType.WAREHOUSE,
    });
    expect(await validate(dto)).toHaveLength(0);
  });
});

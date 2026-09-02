import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AuditLogQueryDto } from './audit-log.dto';

describe('AuditLogQueryDto', () => {
  it('transforms bounded pagination', async () => {
    const dto = plainToInstance(AuditLogQueryDto, { page: '2', limit: '25', order: 'ASC' });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({ page: 2, limit: 25, order: 'ASC' });
  });

  it('rejects excessive page sizes and invalid dates', async () => {
    const dto = plainToInstance(AuditLogQueryDto, { limit: '500', from: 'yesterday' });
    expect(await validate(dto)).not.toHaveLength(0);
  });
});

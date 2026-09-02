import { ConflictException } from '@nestjs/common';
import { DepartmentsService } from './departments.service';

describe('DepartmentsService', () => {
  const department = { _id: '22222222-2222-4222-a222-222222222222', name: 'Controls', code: 'CTRL', isActive: true };

  function setup(existing: unknown = null) {
    const query = { where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), innerJoin: jest.fn().mockReturnThis(), getOne: jest.fn().mockResolvedValue(existing), getCount: jest.fn().mockResolvedValue(0) };
    const repository = {
      createQueryBuilder: jest.fn().mockReturnValue(query),
      create: jest.fn((value) => value),
      save: jest.fn().mockResolvedValue(department),
      findOne: jest.fn().mockResolvedValue(department),
      merge: jest.fn((target, value) => Object.assign(target, value)),
      softDelete: jest.fn().mockResolvedValue({}),
    };
    const auditLogService = { log: jest.fn().mockResolvedValue({}) };
    return { service: new DepartmentsService(repository as any, auditLogService as any), repository, auditLogService };
  }

  it('audits department creation with the actor', async () => {
    const { service, auditLogService } = setup();
    await service.create({ name: 'Controls', code: 'CTRL' }, '11111111-1111-4111-a111-111111111111');
    expect(auditLogService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'create', entityType: 'Department', performedBy: '11111111-1111-4111-a111-111111111111' }));
  });

  it('rejects a duplicate active department name', async () => {
    const { service } = setup(department);
    await expect(service.create({ name: 'Controls' }, 'user-id')).rejects.toBeInstanceOf(ConflictException);
  });

  it('soft-deletes and audits a department', async () => {
    const { service, repository, auditLogService } = setup();
    await service.softDelete(department._id, '11111111-1111-4111-a111-111111111111');
    expect(repository.softDelete).toHaveBeenCalledWith(department._id);
    expect(auditLogService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'delete', entityType: 'Department' }));
  });

  it('blocks deletion while active users are assigned', async () => {
    const { service, repository } = setup();
    repository.createQueryBuilder().getCount.mockResolvedValue(1);
    await expect(service.softDelete(department._id, 'user-id')).rejects.toBeInstanceOf(ConflictException);
    expect(repository.softDelete).not.toHaveBeenCalled();
  });
});

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { UserEntity } from '../../database/entities/release1.entity';
import { UsersService } from './users.service';

const USER_ID = 'c40f899a-37f8-4bad-a886-7753d1561626';
const DEPARTMENT_ID = '663186c8-852a-441f-9290-da08e1648c14';

describe('UsersService PostgreSQL guards', () => {
  const repository = {
    find: jest.fn().mockResolvedValue([]), findOne: jest.fn(), merge: jest.fn(), save: jest.fn(), softDelete: jest.fn(),
  };
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    repository.find.mockResolvedValue([]);
    const module = await Test.createTestingModule({ providers: [
      UsersService,
      { provide: getRepositoryToken(UserEntity), useValue: repository },
    ] }).compile();
    service = module.get(UsersService);
  });

  it('ignores invalid roles and accepts known roles', async () => {
    await service.findAll({ role: '{ $ne: null }' });
    expect(repository.find.mock.calls[0][0].where.role).toBeUndefined();
    await service.findAll({ role: 'admin' });
    expect(repository.find.mock.calls[1][0].where.role).toBe('admin');
  });

  it('accepts only UUID department filters', async () => {
    await service.findAll({ departmentId: 'not-a-uuid' });
    expect(repository.find.mock.calls[0][0].where.departmentId).toBeUndefined();
    await service.findAll({ departmentId: DEPARTMENT_ID });
    expect(repository.find.mock.calls[1][0].where.departmentId).toBe(DEPARTMENT_ID);
  });

  it('rejects invalid record identifiers before querying PostgreSQL', async () => {
    await expect(service.findById('not-valid')).rejects.toThrow(NotFoundException);
    await expect(service.delete('not-valid')).rejects.toThrow(NotFoundException);
  });

  it('blocks administrator deletion', async () => {
    repository.findOne.mockResolvedValue({ _id: USER_ID, role: 'admin' });
    await expect(service.delete(USER_ID)).rejects.toThrow(BadRequestException);
    expect(repository.softDelete).not.toHaveBeenCalled();
  });

  it('soft-deletes non-admin users so ERP references remain auditable', async () => {
    const user = { _id: USER_ID, role: 'designer', isActive: true };
    repository.findOne.mockResolvedValue(user);
    repository.save.mockResolvedValue(user);
    await expect(service.delete(USER_ID)).resolves.toEqual({ message: 'User deleted' });
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
    expect(repository.softDelete).toHaveBeenCalledWith(USER_ID);
  });
});


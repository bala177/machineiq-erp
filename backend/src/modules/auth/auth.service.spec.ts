import { ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { Role } from '../../common/enums';
import { PermissionEntity, RolePermissionEntity, SystemSettingEntity, UserEntity } from '../../database/entities/release1.entity';
import { SettingsService } from '../settings/settings.service';
import { AuthService } from './auth.service';

describe('AuthService PostgreSQL setup', () => {
  const users = { count: jest.fn() };
  const transactionUsers = { count: jest.fn(), create: jest.fn(), save: jest.fn() };
  const transactionSettings = { upsert: jest.fn() };
  const transactionPermissions = { upsert: jest.fn(), find: jest.fn() };
  const transactionRolePermissions = { upsert: jest.fn() };
  const dataSource = {
    transaction: jest.fn(async (_level: string, work: (manager: any) => unknown) => work({
      getRepository: (entity: unknown) => {
        if (entity === UserEntity) return transactionUsers;
        if (entity === SystemSettingEntity) return transactionSettings;
        if (entity === PermissionEntity) return transactionPermissions;
        if (entity === RolePermissionEntity) return transactionRolePermissions;
        throw new Error('Unexpected repository');
      },
    })),
  };
  const jwt = { sign: jest.fn().mockReturnValue('token') };
  const settings = { get: jest.fn() };
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({ providers: [
      AuthService,
      { provide: getRepositoryToken(UserEntity), useValue: users },
      { provide: JwtService, useValue: jwt },
      { provide: SettingsService, useValue: settings },
      { provide: DataSource, useValue: dataSource },
    ] }).compile();
    service = module.get(AuthService);
  });

  it('reports that setup is required only for an empty database', async () => {
    users.count.mockResolvedValueOnce(0).mockResolvedValueOnce(1);
    await expect(service.getSetupStatus()).resolves.toEqual({ needsSetup: true });
    await expect(service.getSetupStatus()).resolves.toEqual({ needsSetup: false });
    expect(users.count).toHaveBeenCalledWith({ withDeleted: true });
  });

  it('creates the first administrator and organization settings atomically', async () => {
    const dto = { organizationName: 'Acme', machineSegment: 'SPM', email: ' ADMIN@ACME.COM ', password: 'SecurePass1', firstName: 'Jane', lastName: 'Doe' };
    transactionUsers.count.mockResolvedValue(0);
    transactionUsers.create.mockImplementation((value) => value);
    transactionUsers.save.mockImplementation(async (value) => ({ _id: 'c40f899a-37f8-4bad-a886-7753d1561626', ...value }));
    transactionPermissions.find.mockResolvedValue([
      { _id: 'eef56d5c-468e-4228-a521-8cf73c2185e5', code: 'items.manage' },
    ]);
    settings.get.mockResolvedValue({ value: { defaultCurrency: 'INR' } });

    const result = await service.setup(dto);

    expect(dataSource.transaction).toHaveBeenCalledWith('SERIALIZABLE', expect.any(Function));
    expect(transactionUsers.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'admin@acme.com', role: Role.ADMIN }));
    expect(transactionSettings.upsert).toHaveBeenCalledWith(expect.objectContaining({
      key: 'commercial_preferences', value: expect.objectContaining({ organizationName: 'Acme', machineSegment: 'SPM' }),
    }), { conflictPaths: ['key'] });
    expect(transactionPermissions.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ code: 'items.manage', isActive: true })]),
      { conflictPaths: ['code'] },
    );
    expect(transactionRolePermissions.upsert).toHaveBeenCalledWith([
      { role: Role.ADMIN, permissionId: 'eef56d5c-468e-4228-a521-8cf73c2185e5', allowed: true },
    ], { conflictPaths: ['role', 'permissionId'] });
    expect(result.user.role).toBe(Role.ADMIN);
  });

  it('rejects setup when any user already exists', async () => {
    transactionUsers.count.mockResolvedValue(1);
    settings.get.mockResolvedValue({ value: {} });
    await expect(service.setup({ organizationName: 'Acme', email: 'admin@acme.com', password: 'SecurePass1', firstName: 'Jane', lastName: 'Doe' }))
      .rejects.toThrow(ForbiddenException);
  });
});


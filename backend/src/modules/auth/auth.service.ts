import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuditLogEntity, PermissionEntity, RoleEntity, RolePermissionEntity, SystemSettingEntity, UserEntity } from '../../database/entities/release1.entity';
import { Role } from '../../common/enums';
import { ADMIN_PERMISSION_DEFINITIONS } from '../../common/admin-permissions';
import { SettingsService } from '../settings/settings.service';
import { SetupDto } from './auth.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private users: Repository<UserEntity>,
    @InjectRepository(RoleEntity) private roles: Repository<RoleEntity>,
    private jwtService: JwtService,
    private settingsService: SettingsService,
    private dataSource: DataSource,
    private auditLogService: AuditLogService,
  ) {}

  async register(dto: { email: string; password: string; firstName: string; lastName: string; role?: string; departmentId?: string | null }, performedBy: string) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const roleKey = dto.role ?? Role.DESIGNER;
    const role = await this.roles.findOne({ where: { key: roleKey, isActive: true, deletedAt: IsNull() } });
    if (!role) throw new BadRequestException('Select an active role');
    const user = await this.users.save(
      this.users.create({
        ...dto,
        email,
        role: role.key,
        roleId: role._id,
        departmentId: dto.departmentId ?? null,
        password: hashedPassword,
      }),
    );
    await this.auditLogService.log({
      action: 'create',
      entityType: 'User',
      entityId: user._id,
      performedBy,
      newValues: { email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, departmentId: user.departmentId },
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

  async login(email: string, password: string, ipAddress?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.users.createQueryBuilder('user').addSelect('user.password').where('user.email = :email', { email: normalizedEmail }).andWhere('user.deleted_at IS NULL').getOne();
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.auditLogService.log({
      action: 'login',
      entityType: 'Account',
      entityId: user._id,
      performedBy: user._id,
      ipAddress,
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

  async validateUser(userId: string): Promise<UserEntity | null> {
    return this.users.findOne({ where: { _id: userId, deletedAt: IsNull() } });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.users.createQueryBuilder('user').addSelect('user.password').where('user.id = :userId', { userId }).andWhere('user.deleted_at IS NULL').getOne();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }
    user.password = await bcrypt.hash(newPassword, 12);
    await this.users.save(user);
  }

  // Unfiltered on purpose — a deployment that has ever had a user (even a
  // soft-deleted one) can never be re-bootstrapped. Both this and setup()
  // below use the identical check.
  async getSetupStatus(): Promise<{ needsSetup: boolean }> {
    const count = await this.users.count({ withDeleted: true });
    return { needsSetup: count === 0 };
  }

  async setup(dto: SetupDto) {
    const commercialPreferences = await this.settingsService.get('commercial_preferences');
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      const userRepository = manager.getRepository(UserEntity);
      if (await userRepository.count({ withDeleted: true })) {
        throw new ForbiddenException('Setup has already been completed for this deployment');
      }
      const adminRole = await manager.getRepository(RoleEntity).findOne({ where: { key: Role.ADMIN, isActive: true, deletedAt: IsNull() } });
      if (!adminRole) throw new ForbiddenException('The administrator role is not configured');
      const created = await userRepository.save(
        userRepository.create({
          email: dto.email.trim().toLowerCase(),
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: Role.ADMIN,
          roleId: adminRole._id,
          departmentId: null,
          title: null,
          phone: null,
          isActive: true,
        }),
      );
      const settingRepository = manager.getRepository(SystemSettingEntity);
      await settingRepository.upsert(
        {
          key: 'commercial_preferences',
          value: { ...commercialPreferences.value, organizationName: dto.organizationName, machineSegment: dto.machineSegment || '' },
        },
        { conflictPaths: ['key'] },
      );
      const permissionRepository = manager.getRepository(PermissionEntity);
      await permissionRepository.upsert(
        ADMIN_PERMISSION_DEFINITIONS.map(([code, module, action]) => ({
          code,
          module,
          action,
          description: `${action} ${module}`,
          isActive: true,
        })),
        { conflictPaths: ['code'] },
      );
      const permissions = await permissionRepository.find({
        where: { code: In(ADMIN_PERMISSION_DEFINITIONS.map(([code]) => code)) },
      });
      await manager.getRepository(RolePermissionEntity).upsert(
        permissions.map((permission) => ({ roleId: adminRole._id, permissionId: permission._id, allowed: true })),
        { conflictPaths: ['roleId', 'permissionId'] },
      );
      await manager.getRepository(AuditLogEntity).save(
        manager.getRepository(AuditLogEntity).create({
          action: 'setup',
          entityType: 'Organization',
          entityId: created._id,
          performedBy: created._id,
          newValues: { organizationName: dto.organizationName, machineSegment: dto.machineSegment || '', firstAdminEmail: created.email },
        }),
      );
      return created;
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

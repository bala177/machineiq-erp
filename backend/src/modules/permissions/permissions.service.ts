import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { Role } from '../../common/enums';
import { PermissionEntity, RolePermissionEntity } from '../../database/entities/release1.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreatePermissionDto, SetRolePermissionsDto, UpdatePermissionDto } from './permissions.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(PermissionEntity) private permissions: Repository<PermissionEntity>,
    @InjectRepository(RolePermissionEntity) private rolePermissions: Repository<RolePermissionEntity>,
    private auditLogService: AuditLogService,
    private dataSource: DataSource,
  ) {}

  findAll() { return this.permissions.find({ where: { deletedAt: IsNull() }, order: { module: 'ASC', action: 'ASC' } }); }

  async create(dto: CreatePermissionDto, userId: string) {
    if (await this.permissions.exists({ where: { code: dto.code, deletedAt: IsNull() } })) throw new BadRequestException('Permission code already exists');
    const permission = await this.permissions.save(this.permissions.create(dto));
    await this.auditLogService.log({ action: 'create', entityType: 'Permission', entityId: permission._id, performedBy: userId, newValues: dto });
    return permission;
  }

  async update(id: string, dto: UpdatePermissionDto, userId: string) {
    if (!isUUID(id)) throw new NotFoundException('Permission not found');
    const existing = await this.permissions.findOne({ where: { _id: id, deletedAt: IsNull() } });
    if (!existing) throw new NotFoundException('Permission not found');
    const permission = await this.permissions.save(this.permissions.merge(existing, dto));
    await this.auditLogService.log({ action: 'update', entityType: 'Permission', entityId: id, performedBy: userId, previousValues: { ...existing }, newValues: dto });
    return permission;
  }

  async remove(id: string, userId: string) {
    if (!isUUID(id)) throw new NotFoundException('Permission not found');
    const permission = await this.permissions.findOne({ where: { _id: id, deletedAt: IsNull() } });
    if (!permission) throw new NotFoundException('Permission not found');
    await this.rolePermissions.delete({ permissionId: permission._id });
    permission.isActive = false;
    await this.permissions.save(permission);
    await this.permissions.softDelete(id);
    await this.auditLogService.log({ action: 'delete', entityType: 'Permission', entityId: id, performedBy: userId, previousValues: { ...permission } });
    return { message: 'Permission deleted' };
  }

  async matrix() {
    const [permissions, assignments] = await Promise.all([this.findAll(), this.rolePermissions.find({ where: { allowed: true } })]);
    return { permissions, assignments };
  }

  async setRolePermissions(role: Role, dto: SetRolePermissionsDto, userId: string) {
    if (!Object.values(Role).includes(role)) throw new BadRequestException('Invalid role');
    if (dto.permissionIds.some((id) => !isUUID(id))) throw new BadRequestException('One or more permissions are invalid');
    const validCount = await this.permissions.count({ where: { _id: In(dto.permissionIds), isActive: true, deletedAt: IsNull() } });
    if (validCount !== dto.permissionIds.length) throw new BadRequestException('One or more permissions are invalid');
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(RolePermissionEntity);
      await repository.delete({ role });
      if (dto.permissionIds.length) await repository.insert(dto.permissionIds.map((permissionId) => ({ role, permissionId, allowed: true })));
    });
    await this.auditLogService.log({ action: 'assign', entityType: 'RolePermission', entityId: role, performedBy: userId, newValues: dto });
    return this.matrix();
  }
}

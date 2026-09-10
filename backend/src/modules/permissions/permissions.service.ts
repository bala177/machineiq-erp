import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { PermissionEntity, RoleEntity, RolePermissionEntity } from '../../database/entities/release1.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreatePermissionDto, CreateRoleDto, SetRolePermissionsDto, UpdatePermissionDto, UpdateRoleDto } from './permissions.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(PermissionEntity) private permissions: Repository<PermissionEntity>,
    @InjectRepository(RolePermissionEntity) private rolePermissions: Repository<RolePermissionEntity>,
    @InjectRepository(RoleEntity) private roles: Repository<RoleEntity>,
    private auditLogService: AuditLogService,
    private dataSource: DataSource,
  ) {}

  findAll() { return this.permissions.find({ where: { deletedAt: IsNull() }, order: { module: 'ASC', action: 'ASC' } }); }
  findRoles() { return this.roles.find({ where: { deletedAt: IsNull() }, order: { isSystem: 'DESC', name: 'ASC' } }); }

  async createRole(dto: CreateRoleDto, userId: string) {
    if (await this.roles.exists({ where: { key: dto.key, deletedAt: IsNull() } })) throw new BadRequestException('Role key already exists');
    const role = await this.roles.save(this.roles.create({ ...dto, description: dto.description ?? null, isSystem: false, isActive: true }));
    await this.auditLogService.log({ action: 'create', entityType: 'Role', entityId: role._id, performedBy: userId, newValues: dto });
    return role;
  }

  async updateRole(key: string, dto: UpdateRoleDto, userId: string) {
    const role = await this.roles.findOne({ where: { key, deletedAt: IsNull() } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem && dto.isActive === false) throw new BadRequestException('System roles cannot be deactivated');
    const previous = { ...role };
    const saved = await this.roles.save(this.roles.merge(role, dto));
    await this.auditLogService.log({ action: 'update', entityType: 'Role', entityId: role._id, performedBy: userId, previousValues: previous, newValues: dto });
    return saved;
  }

  async removeRole(key: string, userId: string) {
    const role = await this.roles.findOne({ where: { key, deletedAt: IsNull() } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new BadRequestException('System roles cannot be deleted');
    const [{ count }] = await this.dataSource.query(`SELECT count(*)::int count FROM users WHERE role_id=$1 AND deleted_at IS NULL`, [role._id]);
    if (Number(count)) throw new BadRequestException('Reassign users before deleting this role');
    await this.rolePermissions.delete({ roleId: role._id });
    role.isActive = false; await this.roles.save(role); await this.roles.softDelete(role._id);
    await this.auditLogService.log({ action: 'delete', entityType: 'Role', entityId: role._id, performedBy: userId, previousValues: role });
    return { message: 'Role deleted' };
  }

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
    const [permissions, grants, roles] = await Promise.all([
      this.findAll(),
      this.rolePermissions.find({ where: { allowed: true } }),
      this.roles.find({ where: { deletedAt: IsNull() } }),
    ]);
    // Callers still identify a role by its key, so translate the stored id back.
    const keyById = new Map(roles.map((role) => [role._id, role.key]));
    const assignments = grants
      .filter((grant) => keyById.has(grant.roleId))
      .map((grant) => ({ role: keyById.get(grant.roleId)!, roleId: grant.roleId, permissionId: grant.permissionId, allowed: grant.allowed }));
    return { permissions, assignments, roles };
  }

  async setRolePermissions(role: string, dto: SetRolePermissionsDto, userId: string) {
    if (dto.permissionIds.some((id) => !isUUID(id))) throw new BadRequestException('One or more permissions are invalid');
    const validCount = await this.permissions.count({ where: { _id: In(dto.permissionIds), isActive: true, deletedAt: IsNull() } });
    if (validCount !== dto.permissionIds.length) throw new BadRequestException('One or more permissions are invalid');
    const target = await this.roles.findOne({ where: { key: role, isActive: true, deletedAt: IsNull() } });
    if (!target) throw new BadRequestException('Invalid role');
    const roleId = target._id;
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(RolePermissionEntity);
      await repository.delete({ roleId });
      if (dto.permissionIds.length) await repository.insert(dto.permissionIds.map((permissionId) => ({ roleId, permissionId, allowed: true })));
    });
    await this.auditLogService.log({ action: 'assign', entityType: 'RolePermission', entityId: role, performedBy: userId, newValues: dto });
    return this.matrix();
  }
}

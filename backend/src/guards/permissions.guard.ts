import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionEntity, RolePermissionEntity } from '../database/entities/release1.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(PermissionEntity) private permissions: Repository<PermissionEntity>,
    @InjectRepository(RolePermissionEntity) private rolePermissions: Repository<RolePermissionEntity>,
  ) {}

  async canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
    if (!required?.length) return true;
    const user = context.switchToHttp().getRequest().user;
    if (!user?.role) return false;
    const permissions = await this.permissions.find({ where: { code: In(required), isActive: true, deletedAt: IsNull() }, select: { _id: true } });
    if (permissions.length !== required.length) return false;
    const assigned = await this.rolePermissions.count({ where: { role: user.role, permissionId: In(permissions.map((permission) => permission._id)), allowed: true } });
    return assigned === required.length;
  }
}

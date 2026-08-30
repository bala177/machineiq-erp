import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionEntity, RolePermissionEntity } from '../../database/entities/release1.entity';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([PermissionEntity, RolePermissionEntity]), AuditLogModule],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionsGuard],
  exports: [PermissionsService, PermissionsGuard, TypeOrmModule],
})
export class PermissionsModule {}

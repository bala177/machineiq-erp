import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { Role } from '../../common/enums';
import { AuditLogService } from './audit-log.service';

@Controller('audit-logs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AuditLogController {
  constructor(private auditLogService: AuditLogService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.LEADERSHIP, Role.SALES, Role.DESIGNER)
  findByEntity(@Query('entityType') entityType: string, @Query('entityId') entityId: string) {
    return this.auditLogService.findByEntity(entityType, entityId);
  }

  @Get('project')
  @Roles(Role.ADMIN, Role.MANAGER, Role.LEADERSHIP)
  findByProject(@Query('projectId') projectId: string, @Query('limit') limit?: number) {
    return this.auditLogService.findByProject(projectId, { limit });
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { Role } from '../../common/enums';
import { ComponentsService } from './components.service';
import { LinkComponentItemDto } from './components.dto';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';

@Controller('components')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ComponentsController {
  constructor(private readonly componentsService: ComponentsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER)
  create(@Body() dto: any, @CurrentUser('userId') userId: string) {
    return this.componentsService.create(dto, userId);
  }

  @Get()
  findAll(
    @Query()
    query: {
      projectId?: string;
      machineId?: string;
      ownerId?: string;
      designStatus?: string;
      procurementStatus?: string;
      assemblyStatus?: string;
      discipline?: string;
      isDelayed?: string;
    },
  ) {
    return this.componentsService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.componentsService.findById(id);
  }

  @Patch(':id/item')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER)
  @UseGuards(PermissionsGuard)
  @RequirePermissions('components.link-item')
  linkItem(@Param('id') id: string, @Body() dto: LinkComponentItemDto, @CurrentUser('userId') userId: string) {
    return this.componentsService.linkItem(id, dto.itemId, userId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER)
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser('userId') userId: string) {
    return this.componentsService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER)
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.componentsService.softDelete(id, userId);
  }

  @Post('projects/:projectId/sync')
  @Roles(Role.ADMIN, Role.MANAGER, Role.LEADERSHIP)
  syncProjectState(@Param('projectId') projectId: string) {
    return this.componentsService.syncProjectState(projectId);
  }

  @Post('projects/:projectId/process-reminders')
  @Roles(Role.ADMIN, Role.MANAGER, Role.LEADERSHIP)
  processProjectReminders(@Param('projectId') projectId: string) {
    return this.componentsService.processReminders(projectId);
  }
}

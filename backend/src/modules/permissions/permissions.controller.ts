import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../../common/enums';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { CreatePermissionDto, CreateRoleDto, SetRolePermissionsDto, UpdatePermissionDto, UpdateRoleDto } from './permissions.dto';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}
  @Get() findAll() { return this.permissionsService.findAll(); }
  @Get('matrix') matrix() { return this.permissionsService.matrix(); }
  @Get('roles') roles() { return this.permissionsService.findRoles(); }
  @Post('roles') createRole(@Body() dto: CreateRoleDto, @CurrentUser('userId') userId: string) { return this.permissionsService.createRole(dto, userId); }
  @Patch('roles/:role') updateRole(@Param('role') role: string, @Body() dto: UpdateRoleDto, @CurrentUser('userId') userId: string) { return this.permissionsService.updateRole(role, dto, userId); }
  @Delete('roles/:role') removeRole(@Param('role') role: string, @CurrentUser('userId') userId: string) { return this.permissionsService.removeRole(role, userId); }
  @Post() create(@Body() dto: CreatePermissionDto, @CurrentUser('userId') userId: string) { return this.permissionsService.create(dto, userId); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdatePermissionDto, @CurrentUser('userId') userId: string) { return this.permissionsService.update(id, dto, userId); }
  @Delete(':id') remove(@Param('id') id: string, @CurrentUser('userId') userId: string) { return this.permissionsService.remove(id, userId); }
  @Put('roles/:role') assign(@Param('role') role: string, @Body() dto: SetRolePermissionsDto, @CurrentUser('userId') userId: string) { return this.permissionsService.setRolePermissions(role, dto, userId); }
}

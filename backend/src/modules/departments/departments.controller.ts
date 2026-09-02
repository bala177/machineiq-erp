import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../guards/roles.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { Roles } from '../../decorators/roles.decorator';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './departments.dto';

@Controller('departments')
@UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
export class DepartmentsController {
  constructor(private departmentsService: DepartmentsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @RequirePermissions('departments.manage')
  create(@Body() dto: CreateDepartmentDto, @CurrentUser('userId') userId: string) {
    return this.departmentsService.create(dto, userId);
  }

  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departmentsService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @RequirePermissions('departments.manage')
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto, @CurrentUser('userId') userId: string) {
    return this.departmentsService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @RequirePermissions('departments.manage')
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.departmentsService.softDelete(id, userId);
  }
}

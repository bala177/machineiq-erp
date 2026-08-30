import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../../common/enums';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import { CreateSupplierDto, UpdateSupplierDto } from './suppliers.dto';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
@UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
export class SuppliersController {
  constructor(private suppliersService: SuppliersService) {}

  @Get() @Roles(Role.ADMIN, Role.MANAGER, Role.LEADERSHIP)
  findAll(@Query() query: { search?: string; qualificationStatus?: string }) { return this.suppliersService.findAll(query); }

  @Post() @Roles(Role.ADMIN, Role.MANAGER)
  @RequirePermissions('suppliers.manage')
  create(@Body() dto: CreateSupplierDto, @CurrentUser('userId') userId: string) { return this.suppliersService.create(dto, userId); }

  @Patch(':id') @Roles(Role.ADMIN, Role.MANAGER)
  @RequirePermissions('suppliers.manage')
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto, @CurrentUser('userId') userId: string) { return this.suppliersService.update(id, dto, userId); }

  @Delete(':id') @Roles(Role.ADMIN)
  @RequirePermissions('suppliers.manage')
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) { return this.suppliersService.softDelete(id, userId); }
}

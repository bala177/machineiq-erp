import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../../common/enums';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import { CreateBranchDto, CreateLocationDto, UpdateBranchDto, UpdateCompanyDto, UpdateLocationDto } from './organization.dto';
import { OrganizationService } from './organization.service';

@Controller('organization')
@UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
export class OrganizationController {
  constructor(private organizationService: OrganizationService) {}

  @Get('company')
  getCompany() {
    return this.organizationService.getCompany();
  }

  @Patch('company')
  @Roles(Role.ADMIN)
  @RequirePermissions('organization.manage')
  updateCompany(@Body() dto: UpdateCompanyDto, @CurrentUser('userId') userId: string) {
    return this.organizationService.upsertCompany(dto, userId);
  }

  @Get('branches')
  findBranches(@Query('search') search?: string) {
    return this.organizationService.findBranches(search);
  }

  @Post('branches')
  @Roles(Role.ADMIN)
  @RequirePermissions('organization.manage')
  createBranch(@Body() dto: CreateBranchDto, @CurrentUser('userId') userId: string) {
    return this.organizationService.createBranch(dto, userId);
  }

  @Patch('branches/:id')
  @Roles(Role.ADMIN)
  @RequirePermissions('organization.manage')
  updateBranch(@Param('id') id: string, @Body() dto: UpdateBranchDto, @CurrentUser('userId') userId: string) {
    return this.organizationService.updateBranch(id, dto, userId);
  }

  @Delete('branches/:id')
  @Roles(Role.ADMIN)
  @RequirePermissions('organization.manage')
  deleteBranch(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.organizationService.deleteBranch(id, userId);
  }

  @Get('locations')
  findLocations(@Query('search') search?: string, @Query('branchId') branchId?: string) {
    return this.organizationService.findLocations({ search, branchId });
  }

  @Post('locations')
  @Roles(Role.ADMIN)
  @RequirePermissions('organization.manage')
  createLocation(@Body() dto: CreateLocationDto, @CurrentUser('userId') userId: string) {
    return this.organizationService.createLocation(dto, userId);
  }

  @Patch('locations/:id')
  @Roles(Role.ADMIN)
  @RequirePermissions('organization.manage')
  updateLocation(@Param('id') id: string, @Body() dto: UpdateLocationDto, @CurrentUser('userId') userId: string) {
    return this.organizationService.updateLocation(id, dto, userId);
  }

  @Delete('locations/:id')
  @Roles(Role.ADMIN)
  @RequirePermissions('organization.manage')
  deleteLocation(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.organizationService.deleteLocation(id, userId);
  }
}
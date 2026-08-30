import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('executive')
  @Roles(Role.ADMIN, Role.MANAGER, Role.LEADERSHIP)
  getExecutive(@Query('scope') scope: string, @CurrentUser('userId') userId: string) {
    const scopeUserId = scope === 'mine' ? userId : undefined;
    return this.dashboardService.getExecutiveDashboard(scopeUserId);
  }

  @Get('project')
  getProject(@Query('projectId') projectId: string) {
    return this.dashboardService.getProjectDashboard(projectId);
  }

  @Get('department')
  getDepartment(@Query('departmentId') departmentId: string) {
    return this.dashboardService.getDepartmentDashboard(departmentId);
  }

  @Get('procurement')
  @Roles(Role.ADMIN, Role.MANAGER, Role.LEADERSHIP)
  getProcurement() {
    return this.dashboardService.getProcurementDashboard();
  }

  @Get('machines')
  getMachines() {
    return this.dashboardService.getMachinesDashboard();
  }

  @Get('project-components')
  getProjectComponents(@Query('projectId') projectId: string) {
    return this.dashboardService.getProjectComponentDashboard(projectId);
  }
}

import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER)
  create(@Body() dto: any, @CurrentUser('userId') userId: string) {
    return this.tasksService.create(dto, userId);
  }

  @Get()
  findAll(@Query() query: { projectId?: string; status?: string; ownerId?: string; departmentId?: string; priority?: string }) {
    return this.tasksService.findAll(query);
  }

  @Get('overdue')
  getOverdue(@Query('projectId') projectId?: string) {
    return this.tasksService.getOverdueTasks(projectId);
  }

  @Get('blocked')
  getBlocked(@Query('projectId') projectId?: string) {
    return this.tasksService.getBlockedTasks(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser('userId') userId: string) {
    return this.tasksService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.tasksService.softDelete(id, userId);
  }
}

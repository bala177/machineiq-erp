import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { ProjectsService } from './projects.service';
import { AddMilestoneDto, CreateProjectDto, UpdateKickoffDto, UpdateProjectDto } from './projects.dto';

@Controller('projects')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  create(@Body() dto: CreateProjectDto, @CurrentUser('userId') userId: string) {
    return this.projectsService.create(dto, userId);
  }

  @Get()
  findAll(@Query() query: { stage?: string; health?: string; projectManagerId?: string; customerId?: string }) {
    return this.projectsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto, @CurrentUser('userId') userId: string) {
    return this.projectsService.update(id, dto, userId);
  }

  @Patch(':id/kickoff')
  @Roles(Role.ADMIN, Role.MANAGER)
  updateKickoff(@Param('id') id: string, @Body() dto: UpdateKickoffDto, @CurrentUser('userId') userId: string) {
    return this.projectsService.updateKickoff(id, dto, userId);
  }

  @Post(':id/milestones')
  @Roles(Role.ADMIN, Role.MANAGER)
  addMilestone(@Param('id') id: string, @Body() dto: AddMilestoneDto, @CurrentUser('userId') userId: string) {
    return this.projectsService.addMilestone(id, dto, userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.projectsService.softDelete(id, userId);
  }
}

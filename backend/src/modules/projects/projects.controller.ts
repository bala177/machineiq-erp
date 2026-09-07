import { BadRequestException, ForbiddenException, NotFoundException, Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { ProjectsService } from './projects.service';
import { AddMilestoneDto, CreateProjectDto, UpdateKickoffDto, UpdateProjectDto } from './projects.dto';
import { SalesActor, SalesService } from '../sales/sales.service';

@Controller('projects')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService, private sales: SalesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  create(@Body() dto: CreateProjectDto, @CurrentUser('userId') userId: string) {
    throw new BadRequestException('Create the machine project from an approved sales order in Sales & Projects.');
  }

  @Get()
  async findAll(@Query() query: { stage?: string; health?: string; projectManagerId?: string; customerId?: string },@CurrentUser() actor:SalesActor) {
    const rows=await this.projectsService.findAll(query);
    const visible=[];
    for(const row of rows){try{await this.sales.assertProjectAccess(String(row._id),actor);visible.push(row);}catch(e){if(!(e instanceof NotFoundException)&&!(e instanceof ForbiddenException))throw e;}}
    return visible;
  }

  @Get(':id')
  async findOne(@Param('id') id: string,@CurrentUser() actor:SalesActor) {
    await this.sales.assertProjectAccess(id,actor);
    return this.projectsService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  async update(@Param('id') id: string, @Body() dto: UpdateProjectDto, @CurrentUser('userId') userId: string) {
    await this.sales.assertProjectAccess(id,{userId});
    return this.projectsService.update(id, dto, userId);
  }

  @Patch(':id/kickoff')
  @Roles(Role.ADMIN, Role.MANAGER)
  async updateKickoff(@Param('id') id: string, @Body() dto: UpdateKickoffDto, @CurrentUser('userId') userId: string) {
    await this.sales.assertProjectAccess(id,{userId});
    return this.projectsService.updateKickoff(id, dto, userId);
  }

  @Post(':id/milestones')
  @Roles(Role.ADMIN, Role.MANAGER)
  async addMilestone(@Param('id') id: string, @Body() dto: AddMilestoneDto, @CurrentUser('userId') userId: string) {
    await this.sales.assertProjectAccess(id,{userId});
    return this.projectsService.addMilestone(id, dto, userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  async remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    await this.sales.assertProjectAccess(id,{userId});
    return this.projectsService.softDelete(id, userId);
  }
}

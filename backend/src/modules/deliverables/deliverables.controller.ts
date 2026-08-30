import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { DeliverablesService } from './deliverables.service';

@Controller('deliverables')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DeliverablesController {
  constructor(private deliverablesService: DeliverablesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER)
  create(@Body() dto: any, @CurrentUser('userId') userId: string) {
    return this.deliverablesService.create(dto, userId);
  }

  @Get()
  findAll(@Query() query: { projectId?: string; status?: string; procurementStatus?: string; ownerId?: string }) {
    return this.deliverablesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deliverablesService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser('userId') userId: string) {
    return this.deliverablesService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.deliverablesService.softDelete(id, userId);
  }
}

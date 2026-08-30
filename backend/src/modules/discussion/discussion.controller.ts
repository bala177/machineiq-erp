import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, Request,
  UseGuards, NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { Role } from '../../common/enums';
import { DatabaseId } from '../../database/postgres-document.types';
import { DiscussionService } from './discussion.service';
import { CreateDiscussionEntryDto, UpdateDiscussionEntryDto } from './discussion.dto';

@Controller('opportunities/:opportunityId/discussion')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER, Role.SALES, Role.DESIGNER, Role.LEADERSHIP)
export class DiscussionController {
  constructor(private readonly discussionService: DiscussionService) {}

  @Post()
  create(
    @Param('opportunityId') opportunityId: string,
    @Body() dto: CreateDiscussionEntryDto,
    @Request() req: any,
  ) {
    if (!DatabaseId.isValid(opportunityId)) throw new NotFoundException();
    return this.discussionService.create(opportunityId, req.user.userId, dto);
  }

  @Get()
  findAll(
    @Param('opportunityId') opportunityId: string,
    @Query('openOnly') openOnly?: string,
  ) {
    if (!DatabaseId.isValid(opportunityId)) throw new NotFoundException();
    return this.discussionService.findAll(opportunityId, openOnly === 'true');
  }

  @Patch(':id')
  update(
    @Param('opportunityId') opportunityId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDiscussionEntryDto,
    @Request() req: any,
  ) {
    if (!DatabaseId.isValid(opportunityId)) throw new NotFoundException();
    if (!DatabaseId.isValid(id)) throw new NotFoundException();
    return this.discussionService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  remove(
    @Param('opportunityId') opportunityId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    if (!DatabaseId.isValid(opportunityId)) throw new NotFoundException();
    if (!DatabaseId.isValid(id)) throw new NotFoundException();
    return this.discussionService.remove(id, req.user.userId);
  }
}

import { Body, Controller, Get, Patch, Post, Query, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../../common/enums';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { CreateFeedbackDto, FeedbackQueryDto, UpdateFeedbackDto } from './feedback.dto';
import { FeedbackService } from './feedback.service';

@Controller('feedback')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class FeedbackController {
  constructor(private readonly service: FeedbackService) {}

  @Get('config')
  config() { return { enabled: this.service.isEnabled() }; }

  @Post()
  create(@Body() dto: CreateFeedbackDto, @CurrentUser('userId') userId: string) { return this.service.create(dto, userId); }

  @Get('mine')
  mine(@CurrentUser('userId') userId: string) { return this.service.mine(userId); }

  @Get('admin/count') @Roles(Role.ADMIN)
  count() { return this.service.count(); }

  @Get('admin') @Roles(Role.ADMIN)
  admin(@Query() query: FeedbackQueryDto) { return this.service.adminList(query); }

  @Patch(':id') @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateFeedbackDto, @CurrentUser('userId') userId: string) { return this.service.update(id, dto, userId); }
}

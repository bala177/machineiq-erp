import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { ConvertQuoteToProjectDto, CreateQuoteDto, UpdateQuoteDto, UpdateQuoteStatusDto } from './quotes.dto';
import { QuotesService } from './quotes.service';

@Controller('quotes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class QuotesController {
  constructor(private quotesService: QuotesService) {}

  @Post()
  @Roles(Role.SALES, Role.ADMIN)
  create(@Body() dto: CreateQuoteDto, @CurrentUser('userId') userId: string) {
    return this.quotesService.create(dto, userId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.SALES, Role.LEADERSHIP)
  findAll(
    @Query()
    query: {
      customerId?: string;
      opportunityId?: string;
      status?: string;
      search?: string;
      limit?: string;
      skip?: string;
    },
  ) {
    return this.quotesService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.SALES, Role.LEADERSHIP)
  findOne(@Param('id') id: string) {
    return this.quotesService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.SALES, Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateQuoteDto, @CurrentUser('userId') userId: string) {
    return this.quotesService.update(id, dto, userId);
  }

  @Patch(':id/status')
  @Roles(Role.SALES, Role.ADMIN, Role.MANAGER)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateQuoteStatusDto, @CurrentUser() currentUser: { userId: string; role: string }) {
    return this.quotesService.updateStatus(id, dto, currentUser);
  }

  @Post(':id/duplicate')
  @Roles(Role.SALES, Role.ADMIN)
  duplicate(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.quotesService.duplicate(id, userId);
  }

  @Post(':id/convert-to-project')
  @Roles(Role.ADMIN, Role.MANAGER, Role.SALES)
  convertToProject(@Param('id') id: string, @Body() dto: ConvertQuoteToProjectDto, @CurrentUser('userId') userId: string) {
    return this.quotesService.convertToProject(id, dto, userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.quotesService.softDelete(id, userId);
  }
}

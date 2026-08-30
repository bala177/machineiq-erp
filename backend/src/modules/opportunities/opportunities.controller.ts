import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { OpportunitiesService } from './opportunities.service';
import {
  ConvertOpportunityDto,
  CreateOpportunityDto,
  CreateOpportunityFromTemplateDto,
  CreateOpportunityWithCustomerDto,
  ReferencePhotoDto,
  UpdateOpportunityIntakeDto,
  UpdateOpportunityReviewDto,
  UpdateOpportunityStatusDto,
} from './opportunities.dto';

@Controller('opportunities')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class OpportunitiesController {
  constructor(private opportunitiesService: OpportunitiesService) {}

  @Post()
  @Roles(Role.SALES, Role.ADMIN)
  create(@Body() dto: CreateOpportunityDto, @CurrentUser('userId') userId: string) {
    return this.opportunitiesService.create(dto, userId);
  }

  @Post('from-template/:templateId')
  @Roles(Role.SALES, Role.ADMIN)
  createFromTemplate(
    @Param('templateId') templateId: string,
    @Body() dto: CreateOpportunityFromTemplateDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.opportunitiesService.createFromTemplate(templateId, dto, userId);
  }

  @Post('with-customer')
  @Roles(Role.SALES, Role.ADMIN)
  createWithCustomer(@Body() dto: CreateOpportunityWithCustomerDto, @CurrentUser('userId') userId: string) {
    return this.opportunitiesService.createWithCustomer(dto, userId);
  }

  @Get()
  findAll(@Query() query: { status?: string; customerId?: string; createdBy?: string; limit?: string; skip?: string }) {
    return this.opportunitiesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.opportunitiesService.findById(id);
  }

  @Patch(':id/intake')
  @Roles(Role.SALES, Role.ADMIN)
  updateIntake(@Param('id') id: string, @Body() dto: UpdateOpportunityIntakeDto, @CurrentUser() currentUser: { userId: string; role: string }) {
    return this.opportunitiesService.updateIntake(id, dto, currentUser);
  }

  @Patch(':id/review')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER)
  updateReview(@Param('id') id: string, @Body() dto: UpdateOpportunityReviewDto, @CurrentUser() currentUser: { userId: string; role: string }) {
    return this.opportunitiesService.updateReview(id, dto, currentUser);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DESIGNER, Role.SALES)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOpportunityStatusDto, @CurrentUser() currentUser: { userId: string; role: string }) {
    return this.opportunitiesService.updateStatus(id, dto, currentUser);
  }

  @Post(':id/convert')
  @Roles(Role.ADMIN, Role.MANAGER)
  convert(@Param('id') id: string, @Body() dto: ConvertOpportunityDto, @CurrentUser() currentUser: { userId: string; role: string }) {
    return this.opportunitiesService.convertToProject(id, dto, currentUser);
  }

  @Post(':id/photos')
  @Roles(Role.SALES, Role.ADMIN, Role.DESIGNER)
  addPhoto(@Param('id') id: string, @Body() dto: ReferencePhotoDto, @CurrentUser() currentUser: { userId: string; role: string }) {
    return this.opportunitiesService.addPhoto(id, dto, currentUser);
  }

  @Delete(':id/photos')
  @Roles(Role.SALES, Role.ADMIN)
  removePhoto(
    @Param('id') id: string,
    @Query('url') url: string,
    @CurrentUser() currentUser: { userId: string; role: string },
  ) {
    return this.opportunitiesService.removePhoto(id, url, currentUser);
  }

  @Patch(':id')
  @Roles(Role.SALES, Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateOpportunityIntakeDto, @CurrentUser() currentUser: { userId: string; role: string }) {
    return this.opportunitiesService.updateIntake(id, dto, currentUser);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.opportunitiesService.softDelete(id, userId);
  }
}

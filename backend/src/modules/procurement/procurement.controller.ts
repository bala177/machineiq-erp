import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { ProcurementService } from './procurement.service';

@Controller('procurement')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProcurementController {
  constructor(private procurementService: ProcurementService) {}

  @Post('items')
  @Roles(Role.ADMIN)
  createItem(@Body() dto: any, @CurrentUser('userId') userId: string) {
    return this.procurementService.createItem(dto, userId);
  }

  @Get('items')
  findAllItems(@Query() query: { projectId?: string; status?: string; isLongLead?: string }) {
    return this.procurementService.findAllItems(query);
  }

  @Patch('items/:id')
  @Roles(Role.ADMIN)
  updateItem(@Param('id') id: string, @Body() dto: any, @CurrentUser('userId') userId: string) {
    return this.procurementService.updateItem(id, dto, userId);
  }

  @Post('suppliers')
  @Roles(Role.ADMIN)
  createSupplier(@Body() dto: any) {
    return this.procurementService.createSupplier(dto);
  }

  @Get('suppliers')
  findAllSuppliers() {
    return this.procurementService.findAllSuppliers();
  }

  @Patch('suppliers/:id')
  @Roles(Role.ADMIN)
  updateSupplier(@Param('id') id: string, @Body() dto: any) {
    return this.procurementService.updateSupplier(id, dto);
  }
}

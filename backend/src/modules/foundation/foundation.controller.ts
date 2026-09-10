import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { CurrencyDto, EmployeeDto, ReferenceStatusDto, TaxRateDto, WarehouseDto } from './foundation.dto';
import { FoundationService } from './foundation.service';

@Controller('foundation')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class FoundationController {
  constructor(private foundation: FoundationService) {}
  @Get('warehouses') warehouses() { return this.foundation.listWarehouses(); }
  @Get('employees') employees() { return this.foundation.listEmployees(); }
  @Get('currencies') currencies() { return this.foundation.listCurrencies(); }
  @Get('tax-rates') taxes() { return this.foundation.listTaxRates(); }
  @Get('statuses') statuses() { return this.foundation.listStatuses(); }

  @Post('warehouses') @RequirePermissions('foundation.manage') createWarehouse(@Body() dto: WarehouseDto, @CurrentUser('userId') userId: string) { return this.foundation.saveWarehouse(dto, userId); }
  @Patch('warehouses/:id') @RequirePermissions('foundation.manage') updateWarehouse(@Param('id') id: string, @Body() dto: WarehouseDto, @CurrentUser('userId') userId: string) { return this.foundation.saveWarehouse(dto, userId, id); }
  @Post('employees') @RequirePermissions('foundation.manage') createEmployee(@Body() dto: EmployeeDto, @CurrentUser('userId') userId: string) { return this.foundation.saveEmployee(dto, userId); }
  @Patch('employees/:id') @RequirePermissions('foundation.manage') updateEmployee(@Param('id') id: string, @Body() dto: EmployeeDto, @CurrentUser('userId') userId: string) { return this.foundation.saveEmployee(dto, userId, id); }
  @Post('currencies') @RequirePermissions('foundation.manage') createCurrency(@Body() dto: CurrencyDto, @CurrentUser('userId') userId: string) { return this.foundation.saveCurrency(dto, userId); }
  @Patch('currencies/:id') @RequirePermissions('foundation.manage') updateCurrency(@Param('id') id: string, @Body() dto: CurrencyDto, @CurrentUser('userId') userId: string) { return this.foundation.saveCurrency(dto, userId, id); }
  @Post('tax-rates') @RequirePermissions('foundation.manage') createTax(@Body() dto: TaxRateDto, @CurrentUser('userId') userId: string) { return this.foundation.saveTaxRate(dto, userId); }
  @Patch('tax-rates/:id') @RequirePermissions('foundation.manage') updateTax(@Param('id') id: string, @Body() dto: TaxRateDto, @CurrentUser('userId') userId: string) { return this.foundation.saveTaxRate(dto, userId, id); }
  @Post('statuses') @RequirePermissions('foundation.manage') createStatus(@Body() dto: ReferenceStatusDto, @CurrentUser('userId') userId: string) { return this.foundation.saveStatus(dto, userId); }
  @Patch('statuses/:id') @RequirePermissions('foundation.manage') updateStatus(@Param('id') id: string, @Body() dto: ReferenceStatusDto, @CurrentUser('userId') userId: string) { return this.foundation.saveStatus(dto, userId, id); }
  @Delete(':kind/:id') @RequirePermissions('foundation.manage') remove(@Param('kind') kind: 'warehouse'|'employee'|'currency'|'tax-rate'|'status', @Param('id') id: string, @CurrentUser('userId') userId: string) { return this.foundation.remove(kind, id, userId); }
}

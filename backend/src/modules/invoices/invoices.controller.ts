import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { Role } from '../../common/enums';
import { RolesGuard } from '../../guards/roles.guard';
import { CreateInvoiceFromQuoteDto, RecordInvoicePaymentDto, UpdateInvoiceStatusDto } from './invoices.dto';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Post('from-quote/:quoteId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.SALES)
  createFromQuote(@Param('quoteId') quoteId: string, @Body() dto: CreateInvoiceFromQuoteDto, @CurrentUser('userId') userId: string) {
    return this.invoicesService.createFromQuote(quoteId, dto, userId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.SALES, Role.LEADERSHIP)
  findAll(@Query() query: { customerId?: string; sourceQuoteId?: string; projectId?: string; status?: string; limit?: string; skip?: string }) {
    return this.invoicesService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.SALES, Role.LEADERSHIP)
  findOne(@Param('id') id: string) {
    return this.invoicesService.findById(id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.MANAGER, Role.SALES)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateInvoiceStatusDto, @CurrentUser('userId') userId: string) {
    return this.invoicesService.updateStatus(id, dto.status, userId);
  }

  @Post(':id/payments')
  @Roles(Role.ADMIN, Role.MANAGER)
  recordPayment(@Param('id') id: string, @Body() dto: RecordInvoicePaymentDto, @CurrentUser('userId') userId: string) {
    return this.invoicesService.recordPayment(id, dto.amount, userId);
  }
}

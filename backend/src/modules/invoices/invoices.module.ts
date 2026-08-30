import { Module } from '@nestjs/common';
import { PgDocumentModule } from '../../database/postgres-document.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { Invoice, InvoiceSchema } from '../../schemas/invoice.schema';
import { Project, ProjectSchema } from '../../schemas/project.schema';
import { Quote, QuoteSchema } from '../../schemas/quote.schema';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [
    PgDocumentModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Quote.name, schema: QuoteSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    AuditLogModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}

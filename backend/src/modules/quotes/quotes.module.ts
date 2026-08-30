import { Module } from '@nestjs/common';
import { PgDocumentModule } from '../../database/postgres-document.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { SettingsModule } from '../settings/settings.module';
import { Customer, CustomerSchema } from '../../schemas/customer.schema';
import { Opportunity, OpportunitySchema } from '../../schemas/opportunity.schema';
import { Project, ProjectSchema } from '../../schemas/project.schema';
import { Quote, QuoteSchema } from '../../schemas/quote.schema';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [
    PgDocumentModule.forFeature([
      { name: Quote.name, schema: QuoteSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Opportunity.name, schema: OpportunitySchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    AuditLogModule,
    SettingsModule,
  ],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}

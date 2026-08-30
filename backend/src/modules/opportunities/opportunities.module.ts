import { Module } from '@nestjs/common';
import { PgDocumentModule } from '../../database/postgres-document.module';
import { OpportunitiesService } from './opportunities.service';
import { OpportunitiesController } from './opportunities.controller';
import { Opportunity, OpportunitySchema } from '../../schemas/opportunity.schema';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { Customer, CustomerSchema } from '../../schemas/customer.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Project, ProjectSchema } from '../../schemas/project.schema';
import { Quote, QuoteSchema } from '../../schemas/quote.schema';
import { MachineTemplatesModule } from '../machine-templates/machine-templates.module';

@Module({
  imports: [
    PgDocumentModule.forFeature([
      { name: Opportunity.name, schema: OpportunitySchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Quote.name, schema: QuoteSchema },
    ]),
    AuditLogModule,
    MachineTemplatesModule,
  ],
  controllers: [OpportunitiesController],
  providers: [OpportunitiesService],
  exports: [OpportunitiesService],
})
export class OpportunitiesModule {}

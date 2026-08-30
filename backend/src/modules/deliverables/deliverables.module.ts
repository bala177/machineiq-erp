import { Module } from '@nestjs/common';
import { PgDocumentModule } from '../../database/postgres-document.module';
import { DeliverablesService } from './deliverables.service';
import { DeliverablesController } from './deliverables.controller';
import { Deliverable, DeliverableSchema } from '../../schemas/deliverable.schema';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [PgDocumentModule.forFeature([{ name: Deliverable.name, schema: DeliverableSchema }]), AuditLogModule],
  controllers: [DeliverablesController],
  providers: [DeliverablesService],
  exports: [DeliverablesService],
})
export class DeliverablesModule {}

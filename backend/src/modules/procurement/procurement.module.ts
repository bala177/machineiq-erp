import { Module } from '@nestjs/common';
import { PgDocumentModule } from '../../database/postgres-document.module';
import { ProcurementService } from './procurement.service';
import { ProcurementController } from './procurement.controller';
import { ProcurementItem, ProcurementItemSchema, Supplier, SupplierSchema } from '../../schemas/procurement.schema';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    PgDocumentModule.forFeature([
      { name: ProcurementItem.name, schema: ProcurementItemSchema },
      { name: Supplier.name, schema: SupplierSchema },
    ]),
    AuditLogModule,
  ],
  controllers: [ProcurementController],
  providers: [ProcurementService],
  exports: [ProcurementService],
})
export class ProcurementModule {}

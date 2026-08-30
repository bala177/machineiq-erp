import { Module } from '@nestjs/common';
import { PgDocumentModule } from '../../database/postgres-document.module';
import { Supplier, SupplierSchema } from '../../schemas/procurement.schema';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';

@Module({
  imports: [PgDocumentModule.forFeature([{ name: Supplier.name, schema: SupplierSchema }]), AuditLogModule],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
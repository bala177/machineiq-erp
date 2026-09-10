import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyEntity, EmployeeEntity, ReferenceStatusEntity, TaxRateEntity, WarehouseEntity } from '../../database/entities/release1.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { FoundationController } from './foundation.controller';
import { FoundationService } from './foundation.service';

@Module({
  imports: [TypeOrmModule.forFeature([WarehouseEntity, EmployeeEntity, CurrencyEntity, TaxRateEntity, ReferenceStatusEntity]), AuditLogModule],
  controllers: [FoundationController], providers: [FoundationService], exports: [FoundationService],
})
export class FoundationModule {}

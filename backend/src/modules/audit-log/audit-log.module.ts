import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { AuditLogEntity } from '../../database/entities/release1.entity';
import { MutationAuditInterceptor } from './mutation-audit.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  controllers: [AuditLogController],
  providers: [AuditLogService, { provide: APP_INTERCEPTOR, useClass: MutationAuditInterceptor }],
  exports: [AuditLogService],
})
export class AuditLogModule {}

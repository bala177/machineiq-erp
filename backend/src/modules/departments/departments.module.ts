import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { DepartmentEntity } from '../../database/entities/release1.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([DepartmentEntity]), AuditLogModule],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}

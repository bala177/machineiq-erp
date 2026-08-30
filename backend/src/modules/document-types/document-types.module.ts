import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentTypeEntity } from '../../database/entities/release1.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { DocumentTypesController } from './document-types.controller';
import { DocumentTypesService } from './document-types.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([DocumentTypeEntity]), AuditLogModule],
  controllers: [DocumentTypesController],
  providers: [DocumentTypesService],
  exports: [DocumentTypesService],
})
export class DocumentTypesModule {}

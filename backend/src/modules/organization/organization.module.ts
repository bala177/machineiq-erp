import { Module } from '@nestjs/common';
import { PgDocumentModule } from '../../database/postgres-document.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { Branch, BranchSchema, Company, CompanySchema, Location, LocationSchema } from '../../schemas/organization.schema';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';

@Module({
  imports: [
    PgDocumentModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Location.name, schema: LocationSchema },
    ]),
    AuditLogModule,
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
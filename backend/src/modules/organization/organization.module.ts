import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyDirectorEntity, CompanyDocumentEntity } from '../../database/entities/company-profile.entity';
import { CompanyEntity } from '../../database/entities/release1.entity';
import { PgDocumentModule } from '../../database/postgres-document.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { Branch, BranchSchema, Company, CompanySchema, Location, LocationSchema } from '../../schemas/organization.schema';
import { CompanyProfileService } from './company-profile.service';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';

@Module({
  imports: [
    PgDocumentModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Location.name, schema: LocationSchema },
    ]),
    TypeOrmModule.forFeature([CompanyEntity, CompanyDirectorEntity, CompanyDocumentEntity]),
    AuditLogModule,
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService, CompanyProfileService],
  exports: [OrganizationService, CompanyProfileService],
})
export class OrganizationModule {}
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { COMPANY_PROFILE_ENTITIES } from './entities/company-profile.entity';
import { RELEASE1_ENTITIES } from './entities/release1.entity';
import { RuntimeDocumentEntity } from './entities/runtime-document.entity';
import { Release1PostgresFoundation2026082800001 } from './migrations/202608280001-Release1PostgresFoundation';
import { ImmutableAuditLogs2026090100001 } from './migrations/2026090100001-ImmutableAuditLogs';
import { DepartmentManagementPermission2026090100002 } from './migrations/2026090100002-DepartmentManagementPermission';
import { ZohoParityMasterData2026090400001 } from './migrations/202609040001-ZohoParityMasterData';
import { FeedbackSystem2026090600001 } from './migrations/202609060001-FeedbackSystem';
import { Release2Sales2026090700001 } from './migrations/202609070001-Release2Sales';
import { AdminPermissionsBackfill2026090700002 } from './migrations/202609070002-AdminPermissionsBackfill';
import { CompanyStatutoryProfile2026090800001 } from './migrations/202609080001-CompanyStatutoryProfile';
import { ConfigurableRoles2026090900001 } from './migrations/202609090001-ConfigurableRoles';
import { Release1Completion2026091000001 } from './migrations/202609100001-Release1Completion';

export function postgresOptions(databaseUrl = process.env.DATABASE_URL): TypeOrmModuleOptions {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for the PostgreSQL-backed MachineIQ runtime');
  }

  return {
    type: 'postgres',
    url: databaseUrl,
    autoLoadEntities: true,
    entities: [...RELEASE1_ENTITIES, ...COMPANY_PROFILE_ENTITIES, RuntimeDocumentEntity],
    migrations: [Release1PostgresFoundation2026082800001, ImmutableAuditLogs2026090100001, DepartmentManagementPermission2026090100002, ZohoParityMasterData2026090400001, FeedbackSystem2026090600001, Release2Sales2026090700001, AdminPermissionsBackfill2026090700002, CompanyStatutoryProfile2026090800001, ConfigurableRoles2026090900001, Release1Completion2026091000001],
    synchronize: false,
    // Client/local installations do not have Render's pre-deploy hook. Keep
    // their schema aligned with the application instead of starting an API
    // that returns 500s for every newly added column.
    migrationsRun: process.env.RUN_MIGRATIONS_ON_STARTUP !== 'false',
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false,
    retryAttempts: 10,
    retryDelay: 3000,
  };
}

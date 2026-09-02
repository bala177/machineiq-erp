import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { RELEASE1_ENTITIES } from './entities/release1.entity';
import { RuntimeDocumentEntity } from './entities/runtime-document.entity';
import { Release1PostgresFoundation2026082800001 } from './migrations/202608280001-Release1PostgresFoundation';
import { ImmutableAuditLogs2026090100001 } from './migrations/2026090100001-ImmutableAuditLogs';
import { DepartmentManagementPermission2026090100002 } from './migrations/2026090100002-DepartmentManagementPermission';

export function postgresOptions(databaseUrl = process.env.DATABASE_URL): TypeOrmModuleOptions {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for the PostgreSQL-backed MachineIQ runtime');
  }

  return {
    type: 'postgres',
    url: databaseUrl,
    autoLoadEntities: true,
    entities: [...RELEASE1_ENTITIES, RuntimeDocumentEntity],
    migrations: [Release1PostgresFoundation2026082800001, ImmutableAuditLogs2026090100001, DepartmentManagementPermission2026090100002],
    synchronize: false,
    migrationsRun: false,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false,
    retryAttempts: 10,
    retryDelay: 3000,
  };
}

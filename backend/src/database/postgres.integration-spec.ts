import { join } from 'path';
import { DataSource } from 'typeorm';
import { Release1PostgresFoundation2026082800001 } from './migrations/202608280001-Release1PostgresFoundation';
import { ImmutableAuditLogs2026090100001 } from './migrations/2026090100001-ImmutableAuditLogs';
import { DepartmentManagementPermission2026090100002 } from './migrations/2026090100002-DepartmentManagementPermission';
import { ZohoParityMasterData2026090400001 } from './migrations/202609040001-ZohoParityMasterData';
import { AdminPermissionsBackfill2026090700002 } from './migrations/202609070002-AdminPermissionsBackfill';
import { FeedbackSystem2026090600001 } from './migrations/202609060001-FeedbackSystem';
import { Release2Sales2026090700001 } from './migrations/202609070001-Release2Sales';
import { CompanyStatutoryProfile2026090800001 } from './migrations/202609080001-CompanyStatutoryProfile';
import { ConfigurableRoles2026090900001 } from './migrations/202609090001-ConfigurableRoles';
import { Release1Completion2026091000001 } from './migrations/202609100001-Release1Completion';

const testDatabaseUrl = process.env.POSTGRES_TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error('POSTGRES_TEST_DATABASE_URL is required and must point to a disposable PostgreSQL database');
}

describe('Release 1 PostgreSQL migration', () => {
  const dataSource = new DataSource({
    type: 'postgres',
    url: testDatabaseUrl,
    synchronize: false,
    migrationsRun: false,
    entities: [join(__dirname, 'entities', '*.entity.{ts,js}')],
    migrations: [Release1PostgresFoundation2026082800001, ImmutableAuditLogs2026090100001, DepartmentManagementPermission2026090100002, ZohoParityMasterData2026090400001, FeedbackSystem2026090600001, Release2Sales2026090700001, AdminPermissionsBackfill2026090700002, CompanyStatutoryProfile2026090800001, ConfigurableRoles2026090900001, Release1Completion2026091000001],
  });

  beforeAll(async () => {
    await dataSource.initialize();
    await dataSource.dropDatabase();
  });

  afterAll(async () => {
    if (dataSource.isInitialized) await dataSource.destroy();
  });

  it('applies the baseline and creates every Release 1 persistence table', async () => {
    await dataSource.runMigrations({ transaction: 'all' });

    const rows: Array<{ table_name: string }> = await dataSource.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    const tables = rows.map(({ table_name }) => table_name);

    expect(tables).toEqual(expect.arrayContaining(['migrations', 'departments', 'roles', 'users', 'permissions', 'role_permissions', 'companies', 'branches', 'locations', 'warehouses', 'employees', 'currencies', 'tax_rates', 'reference_statuses', 'customers', 'suppliers', 'item_categories', 'uoms', 'items', 'document_types', 'sequences', 'system_settings', 'audit_logs', 'runtime_documents']));
    const adminPermissions = await dataSource.query(`
      SELECT p."code"
      FROM "permissions" p
      INNER JOIN "role_permissions" rp ON rp."permission_id" = p."id"
      INNER JOIN "roles" r ON r."id" = rp."role_id"
      WHERE r."key" = 'admin' AND rp."allowed" = true
    `);
    expect(adminPermissions.map(({ code }: { code: string }) => code)).toEqual(expect.arrayContaining([
      'items.manage',
      'customers.manage',
      'suppliers.manage',
      'organization.manage',
      'departments.manage',
      'audit-logs.view',
      'permissions.manage',
      'document-types.manage',
      'components.link-item',
      'foundation.manage',
    ]));
    await expect(dataSource.showMigrations()).resolves.toBe(false);
  });

  it('reverts cleanly and can apply the baseline again', async () => {
    for (let index = 0; index < 10; index += 1) await dataSource.undoLastMigration({ transaction: 'all' });
    const afterRevert: Array<{ table_name: string }> = await dataSource.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'runtime_documents'
    `);
    expect(afterRevert).toHaveLength(0);
    await expect(dataSource.showMigrations()).resolves.toBe(true);

    await dataSource.runMigrations({ transaction: 'all' });
    await expect(dataSource.showMigrations()).resolves.toBe(false);
  });

  it('prevents audit records from being updated or deleted', async () => {
    const [user] = await dataSource.query(`SELECT "id" FROM "users" LIMIT 1`);
    if (!user) {
      await dataSource.query(`INSERT INTO "users" ("first_name", "last_name", "email", "password_hash", "role", "role_id") SELECT 'Audit', 'Tester', 'audit-test@machineiq.local', 'not-used', "key", "id" FROM "roles" WHERE "key"='admin'`);
    }
    const [actor] = await dataSource.query(`SELECT "id" FROM "users" LIMIT 1`);
    const [entry] = await dataSource.query(`INSERT INTO "audit_logs" ("action", "entity_type", "entity_id", "performed_by") VALUES ('create', 'Test', gen_random_uuid(), $1) RETURNING "id"`, [actor.id]);
    await expect(dataSource.query(`UPDATE "audit_logs" SET "action" = 'changed' WHERE "id" = $1`, [entry.id])).rejects.toThrow('audit_logs are immutable');
    await expect(dataSource.query(`DELETE FROM "audit_logs" WHERE "id" = $1`, [entry.id])).rejects.toThrow('audit_logs are immutable');
  });
});

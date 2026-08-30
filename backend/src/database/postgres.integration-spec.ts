import { join } from 'path';
import { DataSource } from 'typeorm';
import { Release1PostgresFoundation2026082800001 } from './migrations/202608280001-Release1PostgresFoundation';

const testDatabaseUrl = process.env.POSTGRES_TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    'POSTGRES_TEST_DATABASE_URL is required and must point to a disposable PostgreSQL database',
  );
}

describe('Release 1 PostgreSQL migration', () => {
  const dataSource = new DataSource({
    type: 'postgres',
    url: testDatabaseUrl,
    synchronize: false,
    migrationsRun: false,
    entities: [join(__dirname, 'entities', '*.entity.{ts,js}')],
    migrations: [Release1PostgresFoundation2026082800001],
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

    expect(tables).toEqual(expect.arrayContaining([
      'migrations', 'departments', 'users', 'permissions', 'role_permissions',
      'companies', 'branches', 'locations', 'customers', 'suppliers',
      'item_categories', 'uoms', 'items', 'document_types', 'sequences',
      'system_settings', 'audit_logs', 'runtime_documents',
    ]));
    await expect(dataSource.showMigrations()).resolves.toBe(false);
  });

  it('reverts cleanly and can apply the baseline again', async () => {
    await dataSource.undoLastMigration({ transaction: 'all' });
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
});

import { postgresOptions } from './database.config';
import { ZohoParityMasterData2026090400001 } from './migrations/202609040001-ZohoParityMasterData';

describe('postgresOptions', () => {
  const originalMigrationSetting = process.env.RUN_MIGRATIONS_ON_STARTUP;

  afterEach(() => {
    if (originalMigrationSetting === undefined) delete process.env.RUN_MIGRATIONS_ON_STARTUP;
    else process.env.RUN_MIGRATIONS_ON_STARTUP = originalMigrationSetting;
  });

  it('requires an explicit PostgreSQL connection URL', () => {
    expect(() => postgresOptions(undefined)).toThrow('DATABASE_URL is required');
  });

  it('never enables schema synchronization', () => {
    delete process.env.RUN_MIGRATIONS_ON_STARTUP;
    const options = postgresOptions('postgresql://machineiq:machineiq@localhost:5432/machineiq');
    expect(options.type).toBe('postgres');
    expect(options.synchronize).toBe(false);
    expect(options.migrationsRun).toBe(true);
  });

  it('allows a dedicated release job to manage migrations', () => {
    process.env.RUN_MIGRATIONS_ON_STARTUP = 'false';
    const options = postgresOptions('postgresql://machineiq:machineiq@localhost:5432/machineiq');
    expect(options.migrationsRun).toBe(false);
  });

  it('registers the latest production migration', () => {
    const options = postgresOptions('postgresql://machineiq:machineiq@localhost:5432/machineiq');
    expect(options.migrations).toContain(ZohoParityMasterData2026090400001);
  });
});

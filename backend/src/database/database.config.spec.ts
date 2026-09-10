import { postgresOptions } from './database.config';
import { ZohoParityMasterData2026090400001 } from './migrations/202609040001-ZohoParityMasterData';
import { FeedbackSystem2026090600001 } from './migrations/202609060001-FeedbackSystem';
import { Release2Sales2026090700001 } from './migrations/202609070001-Release2Sales';
import { AdminPermissionsBackfill2026090700002 } from './migrations/202609070002-AdminPermissionsBackfill';
import { ConfigurableRoles2026090900001 } from './migrations/202609090001-ConfigurableRoles';
import { Release1Completion2026091000001 } from './migrations/202609100001-Release1Completion';

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
    expect(options.migrations).toContain(FeedbackSystem2026090600001);
    expect(options.migrations).toContain(Release2Sales2026090700001);
    expect(options.migrations).toContain(AdminPermissionsBackfill2026090700002);
    expect(options.migrations).toContain(ConfigurableRoles2026090900001);
    expect(options.migrations).toContain(Release1Completion2026091000001);
  });
});

import { postgresOptions } from './database.config';
import { ZohoParityMasterData2026090400001 } from './migrations/202609040001-ZohoParityMasterData';

describe('postgresOptions', () => {
  it('requires an explicit PostgreSQL connection URL', () => {
    expect(() => postgresOptions(undefined)).toThrow('DATABASE_URL is required');
  });

  it('never enables schema synchronization', () => {
    const options = postgresOptions('postgresql://machineiq:machineiq@localhost:5432/machineiq');
    expect(options.type).toBe('postgres');
    expect(options.synchronize).toBe(false);
    expect(options.migrationsRun).toBe(false);
  });

  it('registers the latest production migration', () => {
    const options = postgresOptions('postgresql://machineiq:machineiq@localhost:5432/machineiq');
    expect(options.migrations).toContain(ZohoParityMasterData2026090400001);
  });
});

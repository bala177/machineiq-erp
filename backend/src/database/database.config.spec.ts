import { postgresOptions } from './database.config';

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
});


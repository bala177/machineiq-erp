import { HealthController } from './health.controller';

const packageMetadata = require('../package.json') as { version: string };

describe('HealthController', () => {
  const dataSource = {
    query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    showMigrations: jest.fn().mockResolvedValue(false),
  };

  beforeEach(() => jest.clearAllMocks());

  it('reports PostgreSQL readiness and the backend package version', async () => {
    const response = await new HealthController(dataSource as any).check();

    expect(response.status).toBe('ok');
    expect(response.version).toBe(packageMetadata.version);
    expect(response.commit).toBeTruthy();
    expect(response.database).toBe('ready');
    expect(response.migrations).toBe('current');
  });

  it('rejects readiness when migrations are pending', async () => {
    dataSource.showMigrations.mockResolvedValueOnce(true);
    await expect(new HealthController(dataSource as any).check()).rejects.toThrow('PostgreSQL migrations are pending');
  });

  it('rejects readiness when PostgreSQL cannot be queried', async () => {
    dataSource.query.mockRejectedValueOnce(new Error('connection refused'));
    await expect(new HealthController(dataSource as any).check()).rejects.toThrow('PostgreSQL is unavailable');
  });
});

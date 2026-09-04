import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';

const packageMetadata = require('../package.json') as { version: string };

/**
 * Lightweight liveness probe used by Render's health check and uptime
 * monitors. Exposed at `/api/health` (the global prefix is set in main.ts).
 * Intentionally unauthenticated — no business data is returned.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  async check() {
    try {
      await this.dataSource.query('SELECT 1');
      const migrationsPending = await this.dataSource.showMigrations();
      if (migrationsPending) {
        throw new ServiceUnavailableException('PostgreSQL migrations are pending');
      }

      return {
        status: 'ok',
        service: 'machineiq-api',
        version: packageMetadata.version,
        commit: process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'local',
        database: 'ready',
        migrations: 'current',
        timestamp: new Date().toISOString(),
        uptimeSec: Math.round(process.uptime()),
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException('PostgreSQL is unavailable');
    }
  }
}

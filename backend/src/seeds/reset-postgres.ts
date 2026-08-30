import dataSource from '../database/data-source';

async function reset() {
  await dataSource.initialize();
  await dataSource.dropDatabase();
  await dataSource.runMigrations({ transaction: 'all' });
  console.log('PostgreSQL database recreated from versioned migrations.');
  await dataSource.destroy();
}

reset().catch(async (error) => {
  console.error(error);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exit(1);
});

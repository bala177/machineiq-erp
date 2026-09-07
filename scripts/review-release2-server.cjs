// Review only: point the built API at an isolated schema produced by test-release2.
const path = require('node:path');
const { Client } = require('../backend/node_modules/pg');
const bcrypt = require('../backend/node_modules/bcrypt');
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env'), quiet: true });
const schema = process.argv[2];
if (!/^machineiq_r2_test_\d+$/.test(schema || '')) throw new Error('Pass an isolated R2 test schema');
async function start() {
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set('options', `-c search_path=${schema}`);
  const client = new Client({ connectionString: url.toString() });
  await client.connect();
  try {
    const check = await client.query("SELECT name FROM companies WHERE code='R2'");
    if (check.rows[0]?.name !== 'R2 Test Organization') throw new Error('Not an R2 fixture');
    await client.query("UPDATE users SET password_hash=$1 WHERE email IN ('admin-r2@test.local','manager-r2@test.local','seller-r2@test.local','outsider-r2@test.local')", [await bcrypt.hash('R2Review123!', 10)]);
  } finally {
    await client.end();
  }
  process.env.DATABASE_URL = url.toString();
  process.env.RUN_MIGRATIONS_ON_STARTUP = 'false';
  const port=process.argv[3] || '4051';
  if(!/^\d+$/.test(port)||Number(port)<1024||Number(port)>65535)throw new Error('Invalid review port');
  process.env.PORT = port;
  process.env.CORS_ORIGIN = 'http://localhost:4050';
  require('../backend/dist/main.js');
}
start().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

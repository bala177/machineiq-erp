// Reuses local PostgreSQL credentials without printing them. A new isolated
// schema is created for each run; no existing tables/data are reset or deleted.
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
require(path.join(root,'backend/node_modules/dotenv')).config({path:path.join(root,'backend/.env'),quiet:true});
if(!process.env.DATABASE_URL)throw new Error('Configure the local Release 1 DATABASE_URL first');
const schema='machineiq_r2_test_'+Date.now();
console.log('R2 test schema: '+schema);
const result=spawnSync(process.execPath,[path.join(root,'backend/node_modules/jest/bin/jest.js'),'--runInBand','--testRegex=.*sales.integration-spec.ts$'],{cwd:path.join(root,'backend'),env:{...process.env,R2_TEST_DATABASE_URL:process.env.DATABASE_URL,R2_TEST_SCHEMA:schema},stdio:'inherit'});
process.exitCode=result.status??1;

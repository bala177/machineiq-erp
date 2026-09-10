const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const candidateInput = process.argv[2] || 'working-tree';
const candidate = candidateInput.replace(/[^A-Za-z0-9._-]+/g, '-');
const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const reportDir = path.join(root, 'logs', 'release-checks', `${timestamp}-${candidate}`);
const npmCli = process.env.npm_execpath || path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
fs.mkdirSync(reportDir, { recursive: true });

const checks = [];
let failed = false;
const add = (name, result) => { checks.push([name, result]); if (result.startsWith('FAIL')) failed = true; };
const hash = (file) => fs.existsSync(file) ? crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') : 'MISSING';
const command = (program, args, options = {}) => spawnSync(program, args, { cwd: root, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024, ...options });
const run = (name, logName, args, env = process.env) => {
  process.stdout.write(`Running ${name}...\n`);
  const result = command(process.execPath, [npmCli, ...args], { env });
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  fs.writeFileSync(path.join(reportDir, logName), output);
  add(name, result.status === 0 ? 'PASS' : `FAIL (exit ${result.status ?? 'spawn error'})`);
  return output;
};

const sourceHash = hash(path.join(root, 'docs', 'specs', 'Dashboard.docx'));
const productHash = hash(path.join(root, 'docs', 'specs', 'MachineIQ_ERP_Product_Specification_v1.0.pdf'));
const expectedSource = '3acddd37fca8a16622147664f8cfe52ee6a5a66c5877bc70c867b196577a8df2';
const expectedProduct = '2b21f1ce379f43aa234fed79d3556d40e67e5014899692660dd7afec14b40c80';
const backendVersion = require(path.join(root, 'backend', 'package.json')).version;
const frontendVersion = require(path.join(root, 'frontend', 'package.json')).version;
const rootVersion = require(path.join(root, 'package.json')).version;
const head = fs.readFileSync(path.join(root, '.git', 'HEAD'), 'utf8').trim();
let revision = head;
if (head.startsWith('ref: ')) {
  const reference = head.slice(5);
  const looseRef = path.join(root, '.git', ...reference.split('/'));
  if (fs.existsSync(looseRef)) revision = fs.readFileSync(looseRef, 'utf8').trim();
  else {
    const packed = fs.existsSync(path.join(root, '.git', 'packed-refs')) ? fs.readFileSync(path.join(root, '.git', 'packed-refs'), 'utf8') : '';
    revision = packed.split(/\r?\n/).find((line) => line.endsWith(` ${reference}`))?.split(' ')[0] || 'NO_COMMIT';
  }
}

add('Original client specification hash', sourceHash === expectedSource ? 'PASS' : 'FAIL');
add('Revised product specification hash', productHash === expectedProduct ? 'PASS' : 'FAIL');
add('Root/frontend/backend version alignment', rootVersion === backendVersion && backendVersion === frontendVersion ? 'PASS' : 'FAIL');
if (candidateInput === 'working-tree') add('Candidate/package version match', 'SKIPPED (no candidate version supplied)');
else add('Candidate/package version match', rootVersion === candidateInput.replace(/^v/, '') && backendVersion === rootVersion && frontendVersion === rootVersion ? 'PASS' : `FAIL (expected ${candidateInput.replace(/^v/, '')})`);

run('Backend production build', 'backend-build.log', ['--prefix', 'backend', 'run', 'build']);
run('Backend unit tests', 'backend-tests.log', ['--prefix', 'backend', 'test', '--', '--runInBand']);
if (process.env.POSTGRES_TEST_DATABASE_URL) run('PostgreSQL migration integration', 'postgres-integration.log', ['--prefix', 'backend', 'run', 'test:postgres'], process.env);
else add('PostgreSQL migration integration', 'SKIPPED (set POSTGRES_TEST_DATABASE_URL to a disposable database)');
const frontendOutput = run('Frontend production build', 'frontend-build.log', ['--prefix', 'frontend', 'run', 'build']);
if (/ERR_INVALID_URL|Failed to parse URL|Failed to compile|Build error occurred/.test(frontendOutput)) {
  const index = checks.findIndex(([name]) => name === 'Frontend production build'); checks[index][1] = 'FAIL (fatal diagnostic found)'; failed = true;
}
if (process.env.RUN_E2E === '1') run('Frontend Playwright E2E', 'frontend-e2e.log', ['--prefix', 'frontend', 'run', 'test:e2e', '--', '--workers=1']);
else add('Frontend Playwright E2E', 'SKIPPED (set RUN_E2E=1)');

const rows = checks.map(([name, result]) => `| ${name} | ${result} |`).join('\n');
const summary = `# MachineIQ release check\n\n| Field | Value |\n|---|---|\n| Timestamp | ${timestamp} |\n| Candidate | ${candidateInput} |\n| Source revision | ${revision} |\n| Root version | ${rootVersion} |\n| Backend version | ${backendVersion} |\n| Frontend version | ${frontendVersion} |\n| Original client specification hash | ${sourceHash} |\n| Revised product specification hash | ${productHash} |\n\n| Check | Result |\n|---|---|\n${rows}\n\n${failed ? 'Automated build checks failed. This candidate is not releasable.' : 'Automated build checks passed. Release approval still requires the target checklist and required E2E checks in docs/release-spec-tracker.md.'}\n`;
const summaryPath = path.join(reportDir, 'summary.md');
fs.writeFileSync(summaryPath, summary);
process.stdout.write(`${summary}\nEvidence: ${summaryPath}\n`);
process.exitCode = failed ? 1 : 0;

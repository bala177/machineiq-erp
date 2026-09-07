// Requires the isolated review API and frontend on the project-standard ports.
const { chromium, devices } = require('../frontend/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const root = 'http://localhost:4050';
const api = process.argv[2] || 'http://localhost:4051/api';
if(!/^http:\/\/localhost:\d+\/api$/.test(api))throw new Error('Browser verification requires a local review API');
const password = 'R2Review123!';
const output = require('node:path').join(__dirname, '../test-results/release2');
fs.mkdirSync(output, { recursive: true });
async function request(path, token, method = 'GET', body) {
  const res = await fetch(api + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await res.json();
  assert.ok(res.ok, `${method} ${path}: ${JSON.stringify(data)}`);
  return data;
}
async function action(page, name, fields = {}) {
  await page.getByRole('button', { name, exact: true }).click();
  const modal = page.getByRole('dialog');
  for (const [label, val] of Object.entries(fields)) {
    const input = modal.getByLabel(label, { exact: true });
    if (await input.evaluate((e) => e.tagName === 'SELECT')) await input.selectOption(val);
    else await input.fill(val);
  }
  const response = page.waitForResponse((r) => r.url().endsWith('/actions') && r.request().method() === 'POST');
  await modal.getByRole('button', { name: 'Confirm', exact: true }).click();
  const res = await response;
  const data = await res.json();
  assert.ok(res.ok(), `${name}: ${JSON.stringify(data)}`);
  await modal.waitFor({ state: 'hidden' });
  await page.waitForURL(`**/sales/${data.id}`);
  return data;
}
async function loginPage(page, email, mode) {
  await page.goto(root + '/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('**/dashboard');
  await page.goto(root + '/sales');
  await page.getByRole('button', { name: 'New enquiry', exact: true }).waitFor();
  const sidebar = page.locator('aside nav');
  const expectedSalesLinks = [
    ['Enquiries', '/sales?kind=enquiry'],
    ['Quotations', '/sales?kind=quote'],
    ['Sales Orders', '/sales?kind=order'],
    ['Machine Projects', '/sales?kind=project'],
    ['Sales Reports', '/sales?tab=reports'],
    ['Sales Alerts', '/sales?tab=alerts'],
  ];
  for (const [label, href] of expectedSalesLinks) assert.equal(await sidebar.getByRole('link', { name: label, exact: true }).getAttribute('href'), href);
  assert.match(await sidebar.getByRole('link', { name: 'Enquiries', exact: true }).getAttribute('class'), /bg-brand-50/);
  if (mode === 'mobile') assert.deepEqual(await page.locator('nav.fixed a').allTextContents(), ['Dashboard', 'Sales', 'Customers']);
}
async function run(browser, mode, viewport) {
  const context = await browser.newContext(viewport);
  if(api!=='http://localhost:4051/api')await context.route('http://localhost:4051/api/**',route=>route.continue({url:api+route.request().url().slice('http://localhost:4051/api'.length)}));
  context.setDefaultTimeout(20000);
  context.setDefaultNavigationTimeout(30000);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await loginPage(page, 'seller-r2@test.local', mode);
    const token = await page.evaluate(() => localStorage.getItem('machineiq_token'));
    const config = await request('/sales/config', token);
    assert.equal(config.company.name, 'R2 Test Organization', 'Browser tests require the isolated R2 fixture');
    const manager = await request('/auth/login', null, 'POST', { email: 'manager-r2@test.local', password });
    const managerContext = await browser.newContext(viewport);
    if(api!=='http://localhost:4051/api')await managerContext.route('http://localhost:4051/api/**',route=>route.continue({url:api+route.request().url().slice('http://localhost:4051/api'.length)}));
    await managerContext.addInitScript((session) => {
      localStorage.setItem('machineiq_token', session.access_token);
      localStorage.setItem('machineiq_user', JSON.stringify(session.user));
    }, manager);
    const managerPage = await managerContext.newPage();
    const title = `Browser ${mode} machine ${Date.now()}`;
    await page.getByRole('button', { name: 'New enquiry', exact: true }).click();
    const form = page.getByRole('dialog');
    await form.getByLabel('Title', { exact: true }).fill(title);
    await form.getByLabel('Customer', { exact: true }).selectOption(config.customers[0].id);
    await form.getByLabel('Customer site').selectOption(config.sites[0].id);
    await form.getByLabel('Machine category', { exact: true }).fill('Testing');
    await form.getByLabel('Machine quantity', { exact: true }).fill('1.25');
    await form.getByLabel('Delivery date', { exact: true }).fill('2099-12-31');
    await form.getByLabel('Enquiry source', { exact: true }).fill('Customer RFQ');
    await form.getByRole('tab',{name:/Requirements/}).click();
    for (const label of ['Intended use', 'Capacity / performance', 'Interfaces', 'Utilities', 'Constraints', 'Standards', 'Customer-provided items']) await form.getByLabel(label, { exact: true }).fill('Customer agreed ' + label);
    await form.getByRole('tab',{name:/Commercial scope/}).click();
    for (const label of ['Scope', 'Exclusions', 'Warranty', 'Terms']) await form.getByLabel(label, { exact: true }).fill('Agreed ' + label);
    await form.getByLabel('Customer PO reference', { exact: true }).fill('PO-BROWSER');
    await form.getByRole('tab',{name:/Quotation lines/}).click();
    await form.getByRole('button', { name: 'Add line', exact: true }).click();
    await form.getByLabel('Line 1 description', { exact: true }).fill('Machine scope');
    await form.getByLabel('Quantity 1', { exact: true }).fill('1.25');
    await form.getByLabel('Unit price 1', { exact: true }).fill('100.50');
    await form.getByLabel('Tax % 1', { exact: true }).selectOption('18');
    await form.getByRole('tab',{name:/Milestones/}).click();
    await form.getByRole('button', { name: 'Add payment milestone', exact: true }).click();
    await form.getByLabel('Milestone 1 Label', { exact: true }).fill('Order advance');
    await form.getByLabel('Milestone 1 Trigger', { exact: true }).fill('Order confirmation');
    await form.getByLabel('Milestone 1 Amount', { exact: true }).fill('148.24');
    await form.getByRole('button', { name: 'Save draft', exact: true }).click();
    console.log(`${mode}: draft submitted`);
    await page.waitForURL(/\/sales\/[0-9a-f-]+$/);
    await action(page, 'Qualify');
    let quote = await action(page, 'Create quotation');
    assert.equal(quote.gross, '148.2400');
    quote = await action(page, 'Submit for approval');
    console.log(`${mode}: quote in review`);
    await managerPage.goto(root + '/sales/' + quote.id);
    await action(managerPage, 'Approve');
    await page.reload();
    await action(page, 'Mark as sent');
    await action(page, 'Record customer acceptance', { 'Customer acceptance evidence / reference': 'Signed PO-BROWSER' });
    let order = await action(page, 'Create sales order');
    console.log(`${mode}: order created`);
    await page.getByRole('button', { name: 'Edit draft', exact: true }).click();
    await page.getByRole('dialog').getByRole('tab',{name:/Commercial scope/}).click();
    await page.getByRole('dialog').getByLabel('Terms', { exact: true }).fill('Order terms confirmed');
    await page.getByRole('dialog').getByRole('button', { name: 'Save draft', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    order = await action(page, 'Submit for approval');
    assert.ok(order.lines[0].source_line_id, 'Order edit retains source line');
    await managerPage.goto(root + '/sales/' + order.id);
    await action(managerPage, 'Approve & confirm');
    const project = await action(managerPage, 'Create machine project', { 'Project name': title + ' project', 'Project manager': manager.user.id, 'Start date': '2026-09-08', 'Delivery date': '2099-12-31' });
    assert.equal(project.snapshot.baseline.sourceOrderId, order.id);
    await page.goto(root + '/sales/' + project.id);
    await page.getByLabel('Comment or communication note', { exact: true }).fill('Customer kickoff date agreed');
    await page.getByRole('button', { name: 'Add to activity', exact: true }).click();
    await page.getByText('Customer kickoff date agreed', { exact: true }).waitFor();
    const uploaded = page.waitForResponse((r) => r.url().endsWith('/attachments') && r.request().method() === 'POST');
    await page.getByLabel('Upload evidence', { exact: false }).setInputFiles({ name: 'PO-browser.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 browser evidence') });
    const uploadResponse = await uploaded;
    assert.ok(uploadResponse.ok(), `Upload: ${await uploadResponse.text()}`);
    await page.getByRole('button', { name: /PO-browser.pdf/ }).waitFor();
    await page.screenshot({ path: `${output}/${mode}-project.png`, fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'No page overflow');
    const outsider = await request('/auth/login', null, 'POST', { email: 'outsider-r2@test.local', password });
    const denied = await fetch(api + '/sales/records/' + project.id, { headers: { Authorization: `Bearer ${outsider.access_token}` } });
    assert.equal(denied.status, 404);
    const runtimeDenied = await fetch(api + '/projects/' + project.runtime_id, { headers: { Authorization: `Bearer ${outsider.access_token}` } });
    assert.equal(runtimeDenied.status, 404);
    await page.goto(root + '/sales?tab=reports');
    for (const report of ['pipeline', 'conversion', 'quotations', 'orders', 'pending', 'milestones', 'intake']) {
      const response = page.waitForResponse((r) => r.url().includes('/sales/reports/' + report) && r.request().method() === 'GET');
      if (report === 'pipeline') await page.reload();
      else await page.getByLabel('Report', { exact: true }).selectOption(report);
      assert.ok((await response).ok());
    }
    const csv = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export CSV', exact: true }).click();
    assert.equal((await csv).suggestedFilename(), 'intake.csv');
    const xlsx = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export Excel', exact: true }).click();
    assert.equal((await xlsx).suggestedFilename(), 'intake.xlsx');
    await page.screenshot({ path: `${output}/${mode}-reports.png`, fullPage: true });
    assert.deepEqual(errors, []);
    await managerContext.close();
    console.log(`PASS ${mode}: enquiry → quote approval → customer acceptance → order approval → project; evidence, reports, exports and scope`);
  } catch (error) {
    await page.screenshot({ path: `${output}/${mode}-failure.png`, fullPage: true });
    throw error;
  } finally {
    await context.close();
  }
}
(async () => {
  const browser = await chromium.launch({ headless: true, chromiumSandbox: true });
  try {
    await run(browser, 'desktop', { viewport: { width: 1440, height: 1000 } });
    await run(browser, 'mobile', devices['Pixel 7']);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

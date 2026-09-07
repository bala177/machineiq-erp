/* Generate the client release-plan PDF and its editable HTML companion.
 * Run from the repository root: node scripts/generate-erp-release-plan.cjs
 * Uses the existing frontend Playwright installation; no external assets.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../frontend/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const directory = path.join(root, 'docs/specs');
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(path.join(directory, file))).digest('hex');
const sources = {
  customer: hash('Dashboard.docx'),
  specification: hash('MachineIQ_ERP_Product_Specification_v1.0.pdf'),
};
const baseline = require('../docs/release-baseline.json');
const { releases } = baseline;
for (const source of baseline.sources) {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, source.path))).digest('hex');
  if (actual !== source.sha256) throw new Error('Source baseline changed; reconcile scope before regenerating: ' + source.path);
}

const list = (items) => `<ul>${items.map((item) => `<li>${escape(item)}</li>`).join('')}</ul>`;
const table = (headers, rows) => `<table><thead><tr>${headers.map((h) => `<th>${escape(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escape(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const block = (r, i) => `<article class="release"><div class="release-heading"><span class="badge">R${i + 1}</span><div><h2>${escape(r.title)}</h2><p class="outcome">${escape(r.outcome)}</p></div></div>${list(r.scope)}<p><b>Reports</b> · ${escape(r.reports)}</p><p class="accept"><b>Acceptance</b> · ${escape(r.accept)}</p><p class="dependency"><b>Sequence / boundary</b> · ${escape(r.dependency)} <span class="source">Spec §${i + 6}, p.${r.page}.</span></p></article>`;
const pages = [];
pages.push(`<div class="eyebrow">QUORIN TECH · FOR MACPROAUTOMATION</div><h1>MachineIQ ERP<br>Release Plan</h1><p class="subtitle">Revised delivery sequence · 07 September 2026</p><div class="anchor"><strong>The Machine Project is the central business record.</strong><p>Enquiry → Quotation → Sales Order → Machine Project → Engineering → BOM → Availability → Purchase → Assembly → Quality → FAT → Delivery → SAT / Commissioning → Invoice → Warranty → Service</p></div><h2>Release sequence</h2>${table(['Release', 'Name', 'Business outcome'], releases.map((r, i) => [`R${i + 1}`, r.title, r.outcome]))}<div class="note"><b>Source hierarchy.</b> <a href="Dashboard.docx">Dashboard.docx</a> is the original customer-provided requirements document. <a href="MachineIQ_ERP_Product_Specification_v1.0.pdf">Product Specification v1.0</a> (07 September 2026) defines the revised workflows, release boundaries and acceptance criteria. This plan summarizes that specification; it does not replace the original requirements.</div><p class="small">Plan revision 2 · Replaces the earlier inventory-first release sequence. R1–R10 are product release identifiers, not software version numbers or delivery dates. This document is a plan, not a completion certificate.</p>`);
for (let i = 0; i < releases.length; i += 2) pages.push(`<div class="eyebrow">RELEASE SCOPE & ACCEPTANCE</div>${block(releases[i], i)}${block(releases[i + 1], i + 1)}`);
pages.push(`<div class="eyebrow">CUSTOMER REQUIREMENT PRESERVATION</div><h1 class="compact">Original scope, revised order</h1><p>Dashboard.docx remains the customer source. Its substantive requirements are retained below; the revised specification reorganizes delivery around the machine-project lifecycle.</p>${table(['Dashboard.docx requirement', 'Revised delivery'], [
  ['Company, branches, locations, departments; users, roles, permissions and credentials', 'R1; employee identity in R1, workforce depth in R9'],
  ['Customer, supplier, item, UOM, cost and selling-price masters', 'R1; selectable consistently by downstream modules'],
  ['Enquiry → quotation → sales order → delivery note → invoice → receipt', 'R2 commercial initiation; R8 delivery; R9 invoicing, receipts and partial payments'],
  ['Purchase request → RFQ → supplier quote → PO → GRN → supplier invoice → payment', 'R6 purchasing, GRN, invoice matching and AP handoff; R9 payment processing'],
  ['Warehouse, stock in/out, transfer, adjustment, cycle count and balance', 'Warehouse master in R1; transactional inventory in R5'],
  ['BOM → production planning → work order → material issue → assembly → finished goods', 'R4 controlled BOM/material planning; R7 production and output'],
  ['Incoming, in-process and final inspections; NCR and CAPA', 'R7; FAT/SAT and customer acceptance expand in R8'],
  ['Employee, attendance, leave, overtime and payroll', 'R1 identity; R9 workforce/payroll, subject to localization'],
  ['AR, AP, GL, cash, bank and assets', 'R9; full statutory finance only where approved'],
  ['Relational database; master, transaction and reference tables', 'R1 foundation, extended each release; PostgreSQL remains the repository’s accepted system of record'],
  ['Workflow master, steps/history, approval levels and document types', 'R1 reference foundation; basic module approvals at launch; advanced configurable workflow in R10'],
  ['Email, dashboard, mobile and WhatsApp notifications', 'Module dashboard alerts progressively; enterprise/provider-dependent channels in R10; WhatsApp subject to approval'],
  ['Sales by customer/month; pending orders', 'R2; reporting behavior also governed by specification §18'],
  ['Supplier performance and open PO; stock valuation, ABC and slow-moving', 'R6 purchase reports; R5 inventory reports'],
  ['Work-order status, material consumption and productivity', 'R7 production reports'],
  ['Trial balance, profit and loss, balance sheet', 'R9 where full finance is enabled'],
  ['PO approval, minimum-stock, maintenance-due and leave-request alerts', 'R6 purchase, R5 stock, R9 service/workforce; channels extended in R10'],
])}<p class="small">The original suggested build sequence is superseded by the revised specification’s R1–R10 order. “Plain Text” and “Show more lines” are document artefacts; “3GL” means GL. Appendix A’s “R18” report references are interpreted as <b>Section 18</b>, not an additional release.</p>`);
pages.push(`<div class="eyebrow">DELIVERY GOVERNANCE</div><h1 class="compact">Controls across every release</h1><div class="anchor"><strong>Integration is progressive.</strong><p>Each module connects to existing source records when introduced. Security, validation, basic approvals, auditability, backup and recovery begin with the foundation and expand continuously.</p></div><h2>Shared delivery rules</h2>${list([
  'Preserve project/machine and source-document references. Transactions are entered once and referenced downstream; no free-text matching for operational traceability.',
  'Enforce server-side role and record access, controlled status transitions, active master references, numbering, precision/rounding and source quantity/value limits.',
  'Approved documents change through revisions/amendments. Cancellation records actor, time, reason and downstream impact; posted records use linked reversals or controlled closure.',
  'Provide permission-controlled attachments, comments/activity, print/export, role-aware drill-down reports and deduplicated actionable notifications.',
  'Apply transactional posting, database constraints, concurrency and retry/idempotency controls; maintain append-only audit and visible integration failures.',
])}<h2>Acceptance gate for each release</h2>${table(['Gate', 'Required evidence'], [
  ['Scope & function', 'Stories match the specification; happy paths, exceptions, partial processing, permissions and status transitions pass.'],
  ['Data & quality', 'Validation, migrations/imports, constraints, audit and report totals reconcile; automated tests and manual regression pass; no critical defect remains.'],
  ['Security & operations', 'Sensitive-data/access checks pass; findings are resolved or formally accepted; monitoring, deployment, backup/restore and rollback are documented and tested as applicable.'],
  ['Business acceptance', 'Demo completed, evidence retained and authorized business owner signs off. Performance/load and recovery targets are agreed before production acceptance.'],
])}<h2>Boundary clarifications to retain in implementation</h2><p>R2 payment milestones describe agreed schedules, not payment receipts. R2 order delivery states must be backed by controlled fulfillment introduced in R8. Clarify order “Approved” versus “Confirmed” in the detailed workflow. R4 material planning connects to live R5 stock and R6 orders progressively. Finance depth, payroll localization, tax rules, CAD formats, notification providers and deployment/recovery objectives follow the specification’s explicit decisions.</p><h2>Document control</h2><p class="small">Original customer source: <b>docs/specs/Dashboard.docx</b><br>SHA-256: <span class="hash">${sources.customer}</span><br>Revised scope source: <b>MachineIQ_ERP_Product_Specification_v1.0.pdf</b><br>SHA-256: <span class="hash">${sources.specification}</span></p><p class="small">This plan follows the <a href="../specification-baseline.md">two-source baseline and decision register</a>. Formal specification sign-off and unresolved business rules remain separate from document alignment. Detailed R2 work is in <a href="../plans/2026-09-07-release2-sales-project-initiation.md">the R2 implementation plan</a>.</p>`);

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>MachineIQ ERP — Release Plan, Revision 2</title><style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; } body { margin: 0; background: #e9edf1; color: #203342; font: 12px/1.45 Arial, sans-serif; }
.page { width: 210mm; height: 297mm; padding: 13mm 15mm 14mm; background: white; margin: 16px auto; position: relative; break-after: page; }
.page:last-child { break-after: auto; } header { display: flex; justify-content: space-between; border-bottom: 1px solid #cbd8df; padding-bottom: 9px; margin-bottom: 20px; font-size: 10px; color: #607482; }
footer { position: absolute; bottom: 8mm; left: 15mm; right: 15mm; display:flex; justify-content:space-between; border-top:1px solid #cbd8df; padding-top:8px; color:#607482; font-size:9px; }
h1 { font-size: 36px; line-height: 1.08; margin: 12px 0; color: #143448; letter-spacing: -.8px; } h1.compact { font-size: 28px; margin-bottom: 16px; }
h2 { font-size: 17px; line-height: 1.22; margin: 17px 0 10px; color: #143448; } p { margin: 8px 0; } .subtitle { font-size:14px; color:#637985; margin-bottom:18px; }
.eyebrow { color:#0c7b7f; font-size:10px; font-weight:bold; letter-spacing:1.5px; } .anchor { background:#143448; color:#fff; padding:15px 18px; border-radius:5px; margin:16px 0; } .anchor strong { font-size:15px; } .anchor p { color:#d6e8ed; margin-bottom:0; }
table { width:100%; border-collapse:collapse; margin:10px 0 14px; font-size:11px; line-height:1.35; } th { background:#e8f1f3; color:#143448; text-align:left; padding:8px; } td { padding:7px 8px; vertical-align:top; border-bottom:1px solid #e2e8ed; } tr:nth-child(even) td { background:#f7f9fa; } th:first-child { width:26%; }
.page:nth-child(7) th:first-child { width:52%; } .page:nth-child(7) table { font-size:10.5px; } .page:nth-child(7) td { padding:6px 8px; }
.note { background:#eff6f6; border-left:3px solid #0c7b7f; padding:12px; margin-top:15px; } .small { font-size:10px; color:#526772; line-height:1.5; } .hash { font:9px/1.5 monospace; overflow-wrap:anywhere; }
.release { margin-top:20px; padding-bottom:16px; border-bottom:1px solid #cbd8df; } .release:last-child { border-bottom:0; } .release-heading { display:flex; gap:12px; align-items:flex-start; } .badge { background:#0c7b7f; color:white; font-size:15px; font-weight:bold; border-radius:4px; padding:8px 10px; } .release-heading h2 { margin:0 0 4px; font-size:20px; } .outcome { margin:0; color:#607482; }
ul { padding-left:18px; margin:12px 0; } li { padding-left:3px; margin:5px 0; } .accept { background:#eff6f6; padding:10px 12px; } .dependency { font-size:10.5px; color:#526772; } .source { white-space:nowrap; } a { color:#08757c; text-decoration:none; }
@media print { body { background:white; } .page { margin:0; } }
</style></head><body>${pages.map((body, i) => `<section class="page"><header><b>MachineIQ ERP · Release Plan</b><span>Revision 2 · 07 September 2026</span></header><main>${body}</main><footer><span>Quorin Tech / MacProAutomation · Confidential</span><span>${i + 1} / ${pages.length}</span></footer></section>`).join('')}</body></html>`;

(async () => {
  const htmlPath = path.join(directory, 'MachineIQ-ERP-Release-Plan.html');
  const pdfPath = path.join(directory, 'MachineIQ-ERP-Release-Plan.pdf');
  fs.writeFileSync(htmlPath, html);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 1300 }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(htmlPath).href);
    await page.emulateMedia({ media: 'print' });
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.locator('.page').evaluateAll((elements) => elements.map((element, i) => {
      const main = element.querySelector('main').getBoundingClientRect();
      const footer = element.querySelector('footer').getBoundingClientRect();
      return { page: i + 1, remainingSpace: Math.round(footer.top - main.bottom), overflow: element.scrollHeight > element.clientHeight };
    }));
    if (layout.some((p) => p.remainingSpace < 12 || p.overflow)) throw new Error(`Page overflow: ${JSON.stringify(layout)}`);
    await page.pdf({ path: pdfPath, printBackground: true, preferCSSPageSize: true, tagged: true, outline: true });
    const evidence = path.join(root, 'logs/release-plan-review');
    fs.mkdirSync(evidence, { recursive: true });
    for (let i = 0; i < pages.length; i++) await page.locator('.page').nth(i).screenshot({ path: path.join(evidence, `page-${i + 1}.png`) });
    fs.writeFileSync(path.join(evidence, 'layout.json'), JSON.stringify({ sources, layout }, null, 2));
    console.log(JSON.stringify({ pdf: pdfPath, pages: pages.length, layout }, null, 2));
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });

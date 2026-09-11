import packageMetadata from '../../package.json';

/**
 * Product metadata shared by About, Help, Settings, and release notes.
 * The version is imported directly from frontend/package.json so the UI and
 * deployed package cannot silently drift apart.
 */

export const APP_NAME = 'MachineIQ';
export const APP_TAGLINE = 'Built for the way OEM machine builders actually work.';
export const APP_BY = 'Quorin Tech';
export const APP_WEBSITE = 'https://www.quorintech.com';

/** Copyright holder for MachineIQ. Resolved at call time so the year cannot go stale. */
export const COPYRIGHT_HOLDER = APP_BY;
export const copyright = () => `© ${new Date().getFullYear()} ${COPYRIGHT_HOLDER}`;
export const copyrightLong = () => `${copyright()}. All rights reserved.`;

export const APP_VERSION = packageMetadata.version;
export const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME || '';
export const GIT_COMMIT = process.env.NEXT_PUBLIC_GIT_COMMIT || 'local';
export const SHORT_GIT_COMMIT = GIT_COMMIT === 'local' ? 'local' : GIT_COMMIT.slice(0, 7);
export const RELEASE_CHANNEL = APP_VERSION.includes('beta')
  ? 'Beta'
  : APP_VERSION.includes('alpha')
    ? 'Alpha'
    : APP_VERSION.includes('rc')
      ? 'Release candidate'
      : 'Stable';
export const VERSION_LABEL = `${RELEASE_CHANNEL} · v${APP_VERSION}`;
export const DEPLOYMENT_LABEL = `v${APP_VERSION} · ${SHORT_GIT_COMMIT}`;

export const SUPPORT_EMAIL = 'support@machineiq.tech';

export type ChangeType = 'feature' | 'improvement' | 'fix' | 'security';

export interface Release {
  version: string;
  channel: typeof RELEASE_CHANNEL;
  date: string;
  entries: { type: ChangeType; text: string }[];
}

export const RELEASES: Release[] = [
  {
    version: APP_VERSION,
    channel: RELEASE_CHANNEL,
    date: '2026-09-07',
    entries: [
      { type: 'feature', text: 'Release 2 — Sales & Machine Project Initiation: enquiry, technical-commercial quotation, sales order, and machine project in one connected flow.' },
      { type: 'feature', text: 'Quotation revisions with side-by-side comparison, internal approval, customer acceptance or rejection, and a visible conversion trail between documents.' },
      { type: 'feature', text: 'Requirement summary, commercial scope, quotation lines, and contractual payment milestones captured against the gross contract value.' },
      { type: 'feature', text: 'Seven sales reports — pipeline, quotation conversion, quotations by customer, orders by month and customer, pending orders, payment milestone schedule, and project intake — with CSV, Excel, and print export.' },
      { type: 'feature', text: 'Sales settings for document prefixes, currencies, tax rates, and an optional rule requiring a different approver.' },
      { type: 'improvement', text: 'Sales documents open on a stage flow showing where each record sits between enquiry and machine project.' },
      { type: 'improvement', text: 'Enquiry and quotation entry split into tabbed sections with progress indicators, so long forms no longer scroll as one page.' },
      { type: 'improvement', text: 'Review & Feedback lists every section to review, with a direct link that opens the feedback form on the right screen.' },
      { type: 'feature', text: 'In-app customer feedback with safe diagnostic context, screenshot support, personal tracking, and an administrator triage inbox.' },
      { type: 'improvement', text: 'A single role-aware Feedback Center now separates tracking from the Report issue or idea action, with enforced target-release and customer-response closure rules.' },
      { type: 'improvement', text: 'Feedback Center now updates as it happens: new reports, triage changes, and team replies appear without reloading the page, and edits in progress are never overwritten.' },
      { type: 'improvement', text: 'Feedback triage states what each status needs before saving — a target release, or a reply to the reporter — and reports problems beside the field instead of at the top of the page.' },
      { type: 'improvement', text: 'Every feedback status now explains its meaning in plain language, for both the reporter and the administrator.' },
      { type: 'fix', text: 'Feedback inbox counters now report all open work instead of only the rows left by the current filter, and blocking work stays counted once review has started.' },
      { type: 'fix', text: 'The target release filter on the feedback inbox no longer prints its caption over the input, and the triage panel keeps its heading and Save action in view while scrolling.' },
      { type: 'feature', text: 'Clear item creation sections for identity, sales and purchasing, inventory, units of measure, tax, costing, and planning.' },
      { type: 'feature', text: 'Organization setup can be exported to Excel, reviewed offline, validated in a preview, and explicitly applied across company, directors, branches, locations, and departments.' },
      { type: 'fix', text: 'New operating branches and physical locations now return correctly after saving, and their dependency steps explain exactly what must be completed first.' },
      { type: 'fix', text: 'Empty installations now route directly to first-time workspace setup.' },
      { type: 'fix', text: 'Modal overlays cover the complete application shell without clipping the top navigation.' },
      { type: 'feature', text: 'End-to-end flow from customer and machine inquiry intake through projects, tasks, machines, and procurement.' },
      { type: 'feature', text: 'Five role-aware workspaces: Admin, Manager, Sales, Designer, and Leadership.' },
      { type: 'feature', text: 'Structured machine inquiry review, feasibility, approval, rejection, and project conversion.' },
      { type: 'feature', text: 'Project workspaces with machine breakdown, tasks, components, documents, decisions, and milestones.' },
      { type: 'improvement', text: 'Reworked Help & FAQ as compact guided flows with a searchable terminology glossary, role-based starting paths, R2-to-R3 handover, and an always-visible Help shortcut.' },
      { type: 'improvement', text: 'Responsive navigation, accessible light and dark themes, notifications, and live updates.' },
      { type: 'security', text: 'JWT authentication, role checks, password hashing, rate limiting, and mutation audit history.' },
    ],
  },
];

export const CURRENT_VERSION = RELEASES[0].version;

export interface FaqItem { q: string; a: string }
export interface FaqGroup { id: string; label: string; items: FaqItem[] }

export const FAQ: FaqGroup[] = [
  {
    id: 'scope',
    label: 'What is live today',
    items: [
      { q: 'Which parts of MachineIQ can I use now?', a: 'Two releases are live. Release 1 covers organization, departments, employees, warehouses, currencies, tax rates, reference statuses, users, configurable roles and permissions, customers, suppliers, item master, and numbering. Release 2 adds enquiries, controlled quotation revisions and approval, sales orders, sales reports, and machine projects created from confirmed orders.' },
      { q: 'What should we configure first?', a: 'Follow Getting Started in dependency order: company, branches, locations and departments; foundation masters; roles, permissions and users; numbering; partners; categories, UOMs and items; then Sales settings. Validate the result with one enquiry-to-project flow.' },
      { q: 'Which ERP transactions are still to come?', a: 'Engineering planning and document control, BOM and material planning, inventory and warehousing, purchasing and goods receipt, production and quality, FAT and delivery, and finance, payroll, and after-sales service are assigned to later releases.' },
      { q: 'What does R3 receive from R2?', a: 'R3 begins with the machine project and its immutable commercial baseline: source order, customer and site, machine category, scope, dates, value, milestones and owner. Engineering adds plans, deliverables, documents, revisions, review and release control without replacing that accepted baseline.' },
      { q: 'Which database does MachineIQ use?', a: 'PostgreSQL 16 is the only system of record. You do not need to choose or synchronize a database in the application.' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales & machine projects',
    items: [
      { q: 'How does an enquiry become a machine project?', a: 'Qualify the enquiry, then quote it. The quotation is submitted for approval, approved, and sent, and is marked accepted when the customer confirms. An accepted quotation creates the sales order without re-entry, and a confirmed order creates the machine project with its baseline and source references.' },
      { q: 'Why can I no longer edit a quotation?', a: 'Only drafts are editable. Once a document is submitted, approved, or sent it is locked so the approved version stays the operational one. Use New revision to make changes: the earlier revision stays visible and the two can be compared.' },
      { q: 'Where do I set enquiry, quotation, and order number prefixes?', a: 'In Sales settings, opened from the Sales workspace. Settings > Document Types covers master-data documents and does not control sales numbering. Sales settings also holds currencies, tax rates, and the option to require a different approver.' },
      { q: 'Why was my approval refused?', a: 'If Sales settings requires a separate approver, whoever submitted a document cannot approve it. Ask another user with approval rights, or change that rule in Sales settings.' },
      { q: 'What are payment milestones for?', a: 'They record the contractual payment schedule against the gross contract value, and they carry into the machine project. Invoicing and payment allocation arrive in a later release.' },
    ],
  },
  {
    id: 'master-data',
    label: 'Master data',
    items: [
      { q: 'Why must I create a company before a branch?', a: 'Every branch belongs to the legal company. Physical locations then belong to a branch, so configure Organization in company, branch, location order.' },
      { q: 'Can I prepare organization setup in Excel?', a: 'Yes. On Organization, select Export / template, fill or review the Company, Directors, Branches, Locations, and Departments sheets, then select Import / preview. Nothing is saved until validation passes and you explicitly select Apply.' },
      { q: 'Where do I configure employees, warehouses, currencies, tax rates, and statuses?', a: 'Open Settings > Foundation masters. Warehouses require a physical location. Employees can optionally link to a login user, department and manager. Currency, tax and status records are reusable controlled references.' },
      { q: 'Are customer and supplier codes entered manually?', a: 'MachineIQ generates sequential customer and supplier codes. Complete the required business, contact, tax, and commercial fields; do not invent a parallel code.' },
      { q: 'What must exist before I create an item?', a: 'Create the required item category and unit of measure first. Then create the item with its code, description, category, UOM, cost, selling price, and applicable planning defaults.' },
      { q: 'What is an item master record?', a: 'It is the shared definition of a purchased, manufactured, or otherwise tracked item. Engineering components and quotation lines reference it; it does not create stock balances or movements.' },
    ],
  },
  {
    id: 'administration',
    label: 'Permissions and numbering',
    items: [
      { q: 'Why can’t a user see or change a record?', a: 'Access depends on both the user role and its assigned permissions. An Admin should check Users first, then Settings > Permissions. Permission checks are enforced by the server.' },
      { q: 'Can we create a customer-specific role?', a: 'Yes. Create it in Settings > Roles, assign only the required permissions, then assign users to it. System roles remain protected. Always verify a custom role with a representative user before wider access is granted.' },
      { q: 'How do I change permissions safely?', a: 'In Settings > Permissions, review one role at a time, change only the capabilities that role needs, save that role, and verify the result with a user assigned to it.' },
      { q: 'What are document types used for?', a: 'Document types define controlled numbering rules such as prefixes and sequence behavior for master-data documents. Configure them in Settings > Document Types before relying on generated references. Sales documents are numbered separately: set those prefixes in Sales settings.' },
    ],
  },
  {
    id: 'support',
    label: 'Validation and support',
    items: [
      { q: 'How do I know setup is complete?', a: 'Use the admin dashboard readiness checklist. It verifies organization, foundation masters, roles and permissions, numbering, item references and active users. Then test representative roles and carry one enquiry through approval to a machine project.' },
      { q: 'Can I delete master data that has already been used?', a: 'Production records are soft-deleted or deactivated to preserve references and audit history. Prefer correcting or deactivating a record instead of trying to remove its history.' },
      { q: 'What should I include when reporting a problem?', a: 'Use the Feedback button in the bottom-right corner of the screen where it happened: it records the page, version, and browser for you. Add the record code, your role, what you expected, what happened instead, and a screenshot without passwords, tokens, or database URLs. Review & Feedback lists every section to review and tracks the replies you get.' },
    ],
  },
];

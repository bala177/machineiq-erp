import packageMetadata from '../../package.json';

/**
 * Product metadata shared by About, Help, Settings, and release notes.
 * The version is imported directly from frontend/package.json so the UI and
 * deployed package cannot silently drift apart.
 */

export const APP_NAME = 'MachineIQ';
export const APP_TAGLINE = 'Built for the way OEM machine builders actually work.';
export const APP_BY = 'Quorin Tech';

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
    date: '2026-09-04',
    entries: [
      { type: 'feature', text: 'Clear item creation sections for identity, sales and purchasing, inventory, units of measure, tax, costing, and planning.' },
      { type: 'fix', text: 'Empty installations now route directly to first-time workspace setup.' },
      { type: 'fix', text: 'Modal overlays cover the complete application shell without clipping the top navigation.' },
      { type: 'feature', text: 'End-to-end flow from customer and machine inquiry intake through projects, tasks, machines, and procurement.' },
      { type: 'feature', text: 'Five role-aware workspaces: Admin, Manager, Sales, Designer, and Leadership.' },
      { type: 'feature', text: 'Structured machine inquiry review, feasibility, approval, rejection, and project conversion.' },
      { type: 'feature', text: 'Project workspaces with machine breakdown, tasks, components, documents, decisions, and milestones.' },
      { type: 'improvement', text: 'Reworked Help & FAQ with task-based guidance, real product screenshots, and current permissions.' },
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
    id: 'release1',
    label: 'Release 1 scope',
    items: [
      { q: 'What should we configure first in Release 1?', a: 'Configure the company, then branches and locations. Next review permissions and document types, followed by customers, suppliers, item categories, units of measure, and items.' },
      { q: 'Which database does Release 1 use?', a: 'PostgreSQL 16 is the only released system of record. Users do not need to choose or synchronize a database in the application.' },
      { q: 'Which ERP transactions are not part of Release 1?', a: 'Sales orders, delivery notes, customer payments, inventory transactions, purchase orders, goods receipts, production work orders, payroll, and general-ledger accounting are assigned to later releases.' },
    ],
  },
  {
    id: 'master-data',
    label: 'Master data',
    items: [
      { q: 'Why must I create a company before a branch?', a: 'Every branch belongs to the legal company. Physical locations then belong to a branch, so configure Organization in company, branch, location order.' },
      { q: 'Are customer and supplier codes entered manually?', a: 'MachineIQ generates sequential customer and supplier codes. Complete the required business, contact, tax, and commercial fields; do not invent a parallel code.' },
      { q: 'What must exist before I create an item?', a: 'Create the required item category and unit of measure first. Then create the item with its code, description, category, UOM, cost, selling price, and applicable planning defaults.' },
      { q: 'What is an item master record?', a: 'It is the shared definition of a purchased, manufactured, or otherwise tracked item. Release 1 can link engineering components to this record; it does not create stock balances or movements.' },
    ],
  },
  {
    id: 'administration',
    label: 'Permissions and numbering',
    items: [
      { q: 'Why can’t a user see or change a record?', a: 'Access depends on both the user role and its assigned permissions. An Admin should check Users first, then Settings > Permissions. Permission checks are enforced by the server.' },
      { q: 'How do I change permissions safely?', a: 'In Settings > Permissions, review one role at a time, change only the capabilities that role needs, save that role, and verify the result with a user assigned to it.' },
      { q: 'What are document types used for?', a: 'Document types define controlled numbering rules such as prefixes and sequence behavior for supported business documents. Configure them in Settings > Document Types before relying on generated references.' },
    ],
  },
  {
    id: 'support',
    label: 'Validation and support',
    items: [
      { q: 'How do I know Release 1 setup is complete?', a: 'Confirm the organization hierarchy, role permissions, document types, customers, suppliers, categories, UOMs, and items can all be opened and used by the intended roles without duplicate codes or missing references.' },
      { q: 'Can I delete master data that has already been used?', a: 'Production records are soft-deleted or deactivated to preserve references and audit history. Prefer correcting or deactivating a record instead of trying to remove its history.' },
      { q: 'What should I include when reporting a problem?', a: 'Include the page name, record code, your role, the action attempted, expected result, actual message, and a screenshot without passwords, tokens, or database URLs.' },
    ],
  },
];

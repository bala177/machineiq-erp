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
export const RELEASE_CHANNEL = APP_VERSION.includes('beta')
  ? 'Beta'
  : APP_VERSION.includes('alpha')
    ? 'Alpha'
    : APP_VERSION.includes('rc')
      ? 'Release candidate'
      : 'Stable';
export const VERSION_LABEL = `${RELEASE_CHANNEL} · v${APP_VERSION}`;

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
    date: '2026-08-25',
    entries: [
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
    id: 'account',
    label: 'Account and access',
    items: [
      { q: 'How do I update my profile or theme?', a: 'Open your profile menu in the top-right. Choose My Profile or Account Settings; Light and Dark appearance controls are in the same menu.' },
      { q: 'Why can’t I see or edit a module?', a: 'Navigation and actions follow your assigned role. Ask an administrator to verify your role if your responsibilities have changed.' },
      { q: 'When does my session end?', a: 'The default token lifetime is eight hours. Signing out ends the local session immediately.' },
    ],
  },
  {
    id: 'opportunities',
    label: 'Machine Inquiries',
    items: [
      { q: 'Who can create or edit a machine inquiry?', a: 'Sales and Admin can create and edit intake data until conversion. Manager and Admin control review assignment, approval, rejection, and project conversion.' },
      { q: 'Why can’t the machine inquiry enter review?', a: 'A Manager or Admin must assign a reviewer before moving a New machine inquiry to Under Review.' },
      { q: 'Why is approval disabled?', a: 'Feasibility, complexity, and risk notes must all be completed. Approval is then available to a Manager or Admin.' },
      { q: 'Can a rejected machine inquiry be reopened?', a: 'Yes. A Manager or Admin can return it to Under Review, where review work continues.' },
    ],
  },
  {
    id: 'projects',
    label: 'Projects and delivery',
    items: [
      { q: 'Who can convert an approved machine inquiry?', a: 'A Manager or Admin can convert it, select the project manager, and confirm project dates and priority.' },
      { q: 'What remains linked after conversion?', a: 'The machine inquiry becomes read-only and retains its REQ number and a link to the new PRJ record for traceability.' },
      { q: 'Where should engineering work be tracked?', a: 'Use the project workspace for machine structure, tasks, components, deliverables, documents, decisions, milestones, and procurement readiness.' },
    ],
  },
  {
    id: 'data',
    label: 'Data and traceability',
    items: [
      { q: 'Are REQ and PRJ numbers editable?', a: 'No. MachineIQ generates sequential yearly reference numbers and preserves them for traceability.' },
      { q: 'Where can I see who changed something?', a: 'Open the record’s Activity view. Status changes, review updates, and other important mutations are recorded in the audit history.' },
      { q: 'How should discussions be used?', a: 'Record concise calls, meetings, emails, internal notes, open questions, and decisions. Capture outcomes and owners instead of pasting an entire email thread.' },
    ],
  },
];

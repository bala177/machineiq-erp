'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Search } from 'lucide-react';

type SettingsEntry = {
  title: string;
  description: string;
  /** A destination outside the administration settings tabs. */
  href?: string;
  /** A tab within the administration settings page. */
  tab?: string;
  /** The section of `href` to open, so the reader lands on the setting rather than the page. */
  section?: string;
  /** The field within that section to scroll to and mark. */
  focus?: string;
};

type SettingsGroup = { title: string; description: string; entries: SettingsEntry[] };

/** Where an entry that points at another page should land. */
function entryHref(entry: SettingsEntry) {
  const params = new URLSearchParams();
  if (entry.section) params.set('section', entry.section);
  if (entry.focus) params.set('focus', entry.focus);
  const query = params.toString();
  return `${entry.href}${query ? `?${query}` : ''}`;
}

const groups: SettingsGroup[] = [
  { title: 'Organization & people', description: 'Your business identity, structure, and team.', entries: [
    { title: 'Organization profile', description: 'Company details, base currency, timezone, branches, locations, and departments.', href: '/organization', section: 'company' },
    { title: 'Users', description: 'Manage team members, roles, and account status.', href: '/admin/users' },
    { title: 'Roles & permissions', description: 'Review role responsibilities and configure access to modules.', tab: 'permissions' },
    { title: 'Foundation masters', description: 'Employees, warehouses, currencies, tax rates, and reusable reference statuses.', tab: 'foundation' },
  ] },
  { title: 'Module preferences', description: 'Set defaults, validation requirements, and policies for each module.', entries: [
    { title: 'Sales configuration', description: 'Approval policy, currencies, tax rates, and numbering for enquiries, quotations, orders, and projects.', tab: 'sales' },
    { title: 'Item preferences', description: 'Defaults for sales and purchase information, stock classification, tax rate, and required HSN / SAC codes.', tab: 'items' },
    { title: 'Document types', description: 'Master document definitions and sequences. Current sales numbering is configured in Sales configuration.', tab: 'documentTypes' },
  ] },
  { title: 'Notifications & administration', description: 'Control alerts and review changes.', entries: [
    { title: 'Notifications', description: 'Organization-wide task and component alerts. Personal preferences can further reduce these alerts.', tab: 'notifications' },
    { title: 'Personal settings', description: 'Your profile, appearance, password, and notification preferences.', href: '/settings' },
    { title: 'Platform', description: 'Installed application version and build information.', tab: 'platform' },
  ] },
  { title: 'Earlier quote workflow', description: 'Configuration retained for the earlier quotation module.', entries: [
    { title: 'Commercial', description: 'Earlier quote defaults, print details, taxes, and catalog. Does not configure the current Sales workspace.', tab: 'commercial' },
  ] },
];

export function SettingsOverview({ onSelect }: { onSelect: (tab: string) => void }) {
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const filtered = groups.map(group => ({ ...group, entries: group.entries.filter(entry => `${group.title} ${entry.title} ${entry.description}`.toLowerCase().includes(query)) })).filter(group => group.entries.length);
  return <div className="space-y-6">
    <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-5 dark:border-brand-900 dark:bg-brand-950/20"><h2 className="text-lg font-semibold text-fg">Set up your workspace</h2><p className="mt-1 text-sm text-fg-secondary">Configure organization details, module defaults, required fields, access, and notifications. These preferences control how MachineIQ works; create and manage business records in their modules.</p></div>
    <label className="relative block"><Search className="absolute left-3 top-3 h-4 w-4 text-fg-muted" aria-hidden="true" /><span className="sr-only">Search settings</span><input type="search" className="input-field pl-10" placeholder="Search settings, e.g. taxes, numbering, users…" value={search} onChange={e => setSearch(e.target.value)} /></label>
    {filtered.length === 0 && <p role="status" className="card p-5 text-sm text-fg-muted">No settings match “{search}”. Try another term.</p>}
    {filtered.map(group => <section key={group.title} aria-label={group.title} className="space-y-3"><div><h3 className="font-semibold text-fg">{group.title}</h3><p className="text-sm text-fg-muted">{group.description}</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{group.entries.map(entry => {
      const content = <><div className="flex items-center justify-between gap-2"><span className="font-semibold text-fg">{entry.title}</span><ChevronRight className="h-4 w-4 shrink-0 text-fg-muted" /></div><p className="mt-2 text-xs leading-relaxed text-fg-muted">{entry.description}</p></>;
      const style = 'card block p-4 text-left text-sm transition hover:border-brand-500 hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500';
      return entry.href ? <Link key={entry.title} href={entryHref(entry)} className={style}>{content}</Link> : <a key={entry.title} href={`/admin/settings?tab=${entry.tab}`} className={style} onClick={event => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onSelect(entry.tab!); } }}>{content}</a>;
    })}</div></section>)}
  </div>;
}

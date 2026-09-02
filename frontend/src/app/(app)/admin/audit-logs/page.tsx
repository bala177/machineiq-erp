'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, ChevronDown, ChevronLeft, ChevronRight, FileClock, PencilLine, PlusCircle, RefreshCw, RotateCcw, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { api } from '@/lib/api';

type AuditEntry = {
  _id: string;
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  performer?: { firstName?: string; lastName?: string; email?: string };
  previousValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
};

type AuditResponse = { items: AuditEntry[]; total: number; page: number; limit: number; pages: number };
type Change = { field: string; before: unknown; after: unknown };

const businessAreas = ['Organization', 'Department', 'User', 'Customer', 'Supplier', 'Item', 'Project', 'Opportunity', 'Task', 'Document Type', 'Permission'];
const ignoredFields = new Set(['_id', 'id', 'createdAt', 'updatedAt', 'deletedAt', 'password', 'passwordHash', 'path', 'params']);
const fieldLabels: Record<string, string> = {
  firstAdminEmail: 'Initial administrator', organizationName: 'Organization name', machineSegment: 'Machine segment',
  isActive: 'Active', departmentId: 'Department', projectId: 'Project', entityId: 'Record',
};
const entityLabels: Record<string, string> = {
  Auth: 'Account', Departments: 'Department', DocumentTypes: 'Document Type', Items: 'Item',
  Organization: 'Organization', Permissions: 'Permission', Users: 'User',
};

function actorName(entry: AuditEntry) {
  const name = `${entry.performer?.firstName ?? ''} ${entry.performer?.lastName ?? ''}`.trim();
  return name || entry.performer?.email || 'MachineIQ system';
}

function normalizedAction(action: string) {
  if (action === 'post') return 'create';
  if (action === 'patch' || action === 'put') return 'update';
  return action;
}

function entityLabel(entityType: string) {
  return (entityLabels[entityType] ?? entityType).replace(/([a-z])([A-Z])/g, '$1 $2');
}

function dataSnapshot(values?: Record<string, unknown> | null) {
  if (!values) return {};
  if (values.body && typeof values.body === 'object' && !Array.isArray(values.body)) return values.body as Record<string, unknown>;
  return values;
}

function recordLabel(entry: AuditEntry) {
  const after = dataSnapshot(entry.newValues);
  const before = dataSnapshot(entry.previousValues);
  for (const key of ['name', 'title', 'code', 'organizationName', 'projectNo', 'requestNo', 'quoteNo', 'invoiceNo', 'email']) {
    const value = after[key] ?? before[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function activityTitle(entry: AuditEntry) {
  const action = normalizedAction(entry.action);
  const entity = entityLabel(entry.entityType);
  const label = recordLabel(entry);
  const subject = label ? `${entity} “${label}”` : entity.toLowerCase();
  if (action === 'setup') return 'Completed initial organization setup';
  if (action === 'create') return `Created ${subject}`;
  if (action === 'update') return `Updated ${subject}`;
  if (action === 'delete') return `Deleted ${subject}`;
  if (action === 'status_change') return `Changed the status of ${subject}`;
  return `Recorded activity for ${subject}`;
}

function fieldLabel(field: string) {
  return fieldLabels[field] ?? field.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase());
}

function changesFor(entry: AuditEntry): Change[] {
  const before = dataSnapshot(entry.previousValues);
  const after = dataSnapshot(entry.newValues);
  return Array.from(new Set([...Object.keys(before), ...Object.keys(after)]))
    .filter((field) => !ignoredFields.has(field) && JSON.stringify(before[field] ?? null) !== JSON.stringify(after[field] ?? null))
    .map((field) => ({ field, before: before[field], after: after[field] }));
}

function displayValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return 'Not set';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length ? value.map(displayValue).join(', ') : 'None';
  if (typeof value === 'object') {
    const object = value as Record<string, unknown>;
    const friendlyValue = object.name ?? object.title ?? object.code ?? object.email;
    return friendlyValue ? String(friendlyValue) : 'Updated';
  }
  return String(value).replaceAll('_', ' ');
}

function actionStyle(action: string) {
  const normalized = normalizedAction(action);
  if (normalized === 'create' || normalized === 'setup') return { label: normalized === 'setup' ? 'Setup' : 'Created', badge: 'badge-green', icon: PlusCircle, iconStyle: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' };
  if (normalized === 'delete') return { label: 'Deleted', badge: 'badge-red', icon: Trash2, iconStyle: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300' };
  if (normalized === 'status_change') return { label: 'Status changed', badge: 'badge-blue', icon: RefreshCw, iconStyle: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' };
  return { label: 'Updated', badge: 'badge-amber', icon: PencilLine, iconStyle: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' };
}

function ChangeDetails({ entry }: { entry: AuditEntry }) {
  const [open, setOpen] = useState(false);
  const changes = useMemo(() => changesFor(entry), [entry]);

  return (
    <div className="mt-4 border-t border-border pt-3">
      <button className="flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        {changes.length ? `Review ${changes.length} ${changes.length === 1 ? 'change' : 'changes'}` : 'View activity details'}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-3">
          {changes.length ? (
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="hidden grid-cols-[minmax(140px,.7fr)_1fr_1fr] bg-surface-secondary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-fg-muted sm:grid">
                <span>Field</span><span>Previous value</span><span>New value</span>
              </div>
              <div className="divide-y divide-border">
                {changes.map((change) => (
                  <div key={change.field} className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[minmax(140px,.7fr)_1fr_1fr] sm:gap-4">
                    <p className="font-medium text-fg">{fieldLabel(change.field)}</p>
                    <div><span className="mb-0.5 block text-[11px] font-semibold uppercase text-fg-muted sm:hidden">Previous</span><p className="break-words text-fg-tertiary">{displayValue(change.before)}</p></div>
                    <div><span className="mb-0.5 block text-[11px] font-semibold uppercase text-fg-muted sm:hidden">New</span><p className="break-words font-medium text-fg">{displayValue(change.after)}</p></div>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="rounded-lg bg-surface-secondary px-4 py-3 text-sm text-fg-tertiary">This activity was recorded successfully. No business fields were changed.</p>}
          <details className="mt-3 text-xs text-fg-muted">
            <summary className="cursor-pointer hover:text-fg-secondary">Technical reference</summary>
            <p className="mt-2 break-all font-mono">Record ID: {entry.entityId}</p>
            {entry.ipAddress && <p className="mt-1">Source: {entry.ipAddress}</p>}
          </details>
        </div>
      )}
    </div>
  );
}

export default function AuditLogsPage() {
  const [data, setData] = useState<AuditResponse>({ items: [], total: 0, page: 1, limit: 25, pages: 0 });
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const query = new URLSearchParams({ page: String(page), limit: '25' });
    if (entityType) query.set('entityType', entityType);
    if (action) query.set('action', action);
    if (from) query.set('from', new Date(`${from}T00:00:00`).toISOString());
    if (to) query.set('to', new Date(`${to}T23:59:59.999`).toISOString());
    setLoading(true);
    api.get<AuditResponse>(`/audit-logs/all?${query}`)
      .then((response) => { setData(response); setError(''); })
      .catch((requestError) => setError(requestError.message || 'We could not load the activity history. Please try again.'))
      .finally(() => setLoading(false));
  }, [action, entityType, from, page, refreshKey, to]);

  function updateFilter(setter: (value: string) => void, value: string) { setter(value); setPage(1); }
  function clearFilters() { setEntityType(''); setAction(''); setFrom(''); setTo(''); setPage(1); }
  const filtersActive = Boolean(entityType || action || from || to);

  return (
    <>
      <PageHeader title="Activity History" description="See who changed business information, what changed, and when it happened." actions={<button className="btn-secondary" onClick={() => setRefreshKey((key) => key + 1)}><RefreshCw className="h-4 w-4" /> Refresh</button>} />

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="card flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300"><FileClock className="h-5 w-5" /></div><div><p className="text-2xl font-bold tabular-nums text-fg">{data.total}</p><p className="text-xs text-fg-muted">Recorded activities</p></div></div>
        <div className="card flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"><ShieldCheck className="h-5 w-5" /></div><div><p className="font-semibold text-fg">Protected history</p><p className="text-xs text-fg-muted">Activity records cannot be edited or deleted</p></div></div>
      </div>

      <section className="card mb-6 p-4" aria-label="Filter activity history">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_170px_170px_auto] xl:items-end">
          <label className="text-xs font-semibold text-fg-secondary"><span className="mb-1.5 block">Business area</span><select aria-label="Business area" className="input-field" value={entityType} onChange={(event) => updateFilter(setEntityType, event.target.value)}><option value="">All business areas</option>{businessAreas.map((area) => <option key={area} value={area}>{area}</option>)}</select></label>
          <label className="text-xs font-semibold text-fg-secondary"><span className="mb-1.5 block">Activity</span><select aria-label="Activity" className="input-field" value={action} onChange={(event) => updateFilter(setAction, event.target.value)}><option value="">All activities</option><option value="setup">Initial setup</option><option value="create">Created</option><option value="update">Updated</option><option value="status_change">Status changed</option><option value="delete">Deleted</option></select></label>
          <label className="text-xs font-semibold text-fg-secondary"><span className="mb-1.5 block">From date</span><input aria-label="From date" type="date" className="input-field" value={from} onChange={(event) => updateFilter(setFrom, event.target.value)} /></label>
          <label className="text-xs font-semibold text-fg-secondary"><span className="mb-1.5 block">To date</span><input aria-label="To date" type="date" className="input-field" value={to} onChange={(event) => updateFilter(setTo, event.target.value)} /></label>
          <button className="btn-secondary" onClick={clearFilters} disabled={!filtersActive}><RotateCcw className="h-4 w-4" /> Clear</button>
        </div>
      </section>

      {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
      {loading ? <LoadingSpinner /> : data.items.length === 0 ? (
        <div className="card flex min-h-72 flex-col items-center justify-center p-6 text-center"><FileClock className="mb-3 h-10 w-10 text-fg-muted" /><p className="font-semibold text-fg">No matching activity</p><p className="mt-1 max-w-md text-sm text-fg-muted">Try a different business area or date range. New changes will appear here automatically.</p>{filtersActive && <button className="btn-secondary mt-4" onClick={clearFilters}>Clear filters</button>}</div>
      ) : (
        <div className="space-y-3">
          {data.items.map((entry) => {
            const style = actionStyle(entry.action);
            const Icon = normalizedAction(entry.action) === 'setup' ? Building2 : style.icon;
            return (
              <article key={entry._id} className="card p-4 sm:p-5">
                <div className="flex gap-3 sm:gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${style.iconStyle}`}><Icon className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-fg">{activityTitle(entry)}</h2><span className={style.badge}>{style.label}</span></div><p className="mt-1 text-sm text-fg-muted">{entityLabel(entry.entityType)}</p></div>
                      <time className="shrink-0 text-xs text-fg-muted" dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</time>
                    </div>
                    <div className="mt-3 flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-tertiary text-fg-secondary"><UserRound className="h-4 w-4" /></div><div><p className="text-sm font-medium text-fg">{actorName(entry)}</p>{entry.performer?.email && <p className="text-xs text-fg-muted">{entry.performer.email}</p>}</div></div>
                    <ChangeDetails entry={entry} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {data.pages > 1 && <div className="mt-5 flex items-center justify-between"><p className="text-sm text-fg-muted">Page {data.page} of {data.pages}</p><div className="flex gap-2"><button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="h-4 w-4" /> Previous</button><button className="btn-secondary" disabled={page >= data.pages} onClick={() => setPage((value) => value + 1)}>Next <ChevronRight className="h-4 w-4" /></button></div></div>}
    </>
  );
}

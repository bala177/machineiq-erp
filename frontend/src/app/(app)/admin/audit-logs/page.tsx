'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, FileClock, RefreshCw, RotateCcw, ShieldCheck } from 'lucide-react';
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

const businessAreas = ['Account', 'Organization', 'Department', 'User', 'Customer', 'Supplier', 'Item', 'Project', 'Opportunity', 'Task', 'Document Type', 'Permission'];
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
  if (action === 'login') return 'Signed in';
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
  if (normalized === 'create' || normalized === 'setup') return { label: normalized === 'setup' ? 'Setup' : 'Created', badge: 'badge-green' };
  if (normalized === 'login') return { label: 'Signed in', badge: 'badge-blue' };
  if (normalized === 'delete') return { label: 'Deleted', badge: 'badge-red' };
  if (normalized === 'status_change') return { label: 'Status changed', badge: 'badge-blue' };
  return { label: 'Updated', badge: 'badge-amber' };
}

function AuditTableRow({ entry }: { entry: AuditEntry }) {
  const [open, setOpen] = useState(false);
  const changes = useMemo(() => changesFor(entry), [entry]);
  const style = actionStyle(entry.action);
  const record = recordLabel(entry);
  const summary = activityTitle(entry);

  return (
    <Fragment>
      <tr className="table-row align-top">
        <td className="whitespace-nowrap px-4 py-3">
          <time className="text-sm text-fg" dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}</time>
          <span className="block text-xs text-fg-muted">{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </td>
        <td className="px-4 py-3">
          <p className="whitespace-nowrap text-sm font-medium text-fg">{actorName(entry)}</p>
          {entry.performer?.email && <p className="max-w-48 truncate text-xs text-fg-muted" title={entry.performer.email}>{entry.performer.email}</p>}
        </td>
        <td className="px-4 py-3"><span className={style.badge}>{style.label}</span></td>
        <td className="px-4 py-3 text-sm text-fg-secondary">{entityLabel(entry.entityType)}</td>
        <td className="px-4 py-3">
          <p className="max-w-64 truncate text-sm text-fg" title={record || summary}>{record || (normalizedAction(entry.action) === 'login' ? 'User account' : '—')}</p>
          {record && <p className="max-w-64 truncate text-xs text-fg-muted">{summary}</p>}
        </td>
        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-fg-muted">{entry.ipAddress || '—'}</td>
        <td className="px-4 py-3 text-right">
          <button className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={`${open ? 'Hide' : 'View'} details for ${summary}`}>
            {changes.length ? `${changes.length} ${changes.length === 1 ? 'change' : 'changes'}` : 'Details'}
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </td>
      </tr>
      {open && (
        <tr className="bg-surface-secondary/60">
          <td colSpan={7} className="px-4 py-4">
            <div className="ml-auto max-w-4xl">
              {changes.length ? (
                <div className="overflow-hidden rounded-lg border border-border bg-surface">
                  <div className="grid grid-cols-[minmax(120px,.7fr)_1fr_1fr] gap-3 bg-surface-secondary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
                    <span>Field</span><span>Previous value</span><span>New value</span>
                  </div>
                  <div className="divide-y divide-border">
                    {changes.map((change) => (
                      <div key={change.field} className="grid grid-cols-[minmax(120px,.7fr)_1fr_1fr] gap-3 px-4 py-2.5 text-sm">
                        <p className="font-medium text-fg">{fieldLabel(change.field)}</p>
                        <p className="break-words text-fg-tertiary">{displayValue(change.before)}</p>
                        <p className="break-words font-medium text-fg">{displayValue(change.after)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <p className="text-sm text-fg-tertiary">No field-level changes were recorded for this event.</p>}
              <p className="mt-2 break-all font-mono text-xs text-fg-muted">Record ID: {entry.entityId}</p>
            </div>
          </td>
        </tr>
      )}
    </Fragment>
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
      <PageHeader title="Activity History" description="See who signed in, what changed, and when it happened." actions={<button className="btn-secondary" onClick={() => setRefreshKey((key) => key + 1)}><RefreshCw className="h-4 w-4" /> Refresh</button>} />

      <div className="card mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm">
        <div className="flex items-center gap-2"><FileClock className="h-4 w-4 text-brand-600" /><span className="font-semibold text-fg">{data.total.toLocaleString()}</span><span className="text-fg-muted">recorded events</span></div>
        <div className="flex items-center gap-2 text-fg-muted"><ShieldCheck className="h-4 w-4 text-emerald-600" /><span>Protected from editing and deletion</span></div>
      </div>

      <section className="card mb-4 p-4" aria-label="Filter activity history">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_170px_170px_auto] xl:items-end">
          <label className="text-xs font-semibold text-fg-secondary"><span className="mb-1.5 block">Business area</span><select aria-label="Business area" className="input-field" value={entityType} onChange={(event) => updateFilter(setEntityType, event.target.value)}><option value="">All business areas</option>{businessAreas.map((area) => <option key={area} value={area}>{area}</option>)}</select></label>
          <label className="text-xs font-semibold text-fg-secondary"><span className="mb-1.5 block">Activity</span><select aria-label="Activity" className="input-field" value={action} onChange={(event) => updateFilter(setAction, event.target.value)}><option value="">All activities</option><option value="login">Signed in</option><option value="setup">Initial setup</option><option value="create">Created</option><option value="update">Updated</option><option value="status_change">Status changed</option><option value="delete">Deleted</option></select></label>
          <label className="text-xs font-semibold text-fg-secondary"><span className="mb-1.5 block">From date</span><input aria-label="From date" type="date" className="input-field" value={from} onChange={(event) => updateFilter(setFrom, event.target.value)} /></label>
          <label className="text-xs font-semibold text-fg-secondary"><span className="mb-1.5 block">To date</span><input aria-label="To date" type="date" className="input-field" value={to} onChange={(event) => updateFilter(setTo, event.target.value)} /></label>
          <button className="btn-secondary" onClick={clearFilters} disabled={!filtersActive}><RotateCcw className="h-4 w-4" /> Clear</button>
        </div>
      </section>

      {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
      {loading ? <LoadingSpinner /> : data.items.length === 0 ? (
        <div className="card flex min-h-56 flex-col items-center justify-center p-6 text-center"><FileClock className="mb-3 h-10 w-10 text-fg-muted" /><p className="font-semibold text-fg">No matching activity</p><p className="mt-1 max-w-md text-sm text-fg-muted">Try a different business area or date range. New activity will appear here automatically.</p>{filtersActive && <button className="btn-secondary mt-4" onClick={clearFilters}>Clear filters</button>}</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead><tr className="table-header"><th className="px-4 py-3">When</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Business area</th><th className="px-4 py-3">Record</th><th className="px-4 py-3">Source</th><th className="px-4 py-3 text-right">Changes</th></tr></thead>
            <tbody className="divide-y divide-border">{data.items.map((entry) => <AuditTableRow key={entry._id} entry={entry} />)}</tbody>
          </table>
        </div>
      )}

      {data.pages > 1 && <div className="mt-5 flex items-center justify-between"><p className="text-sm text-fg-muted">Page {data.page} of {data.pages}</p><div className="flex gap-2"><button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="h-4 w-4" /> Previous</button><button className="btn-secondary" disabled={page >= data.pages} onClick={() => setPage((value) => value + 1)}>Next <ChevronRight className="h-4 w-4" /></button></div></div>}
    </>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Image as ImageIcon, Inbox, MessageSquare, Search, X } from 'lucide-react';
import { api } from '@/lib/api';
import { FeedbackRecord, FeedbackStatus, feedbackStatusLabels, feedbackTypeLabels } from '@/lib/feedback';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatDate } from '@/lib/utils';
import { clsx } from 'clsx';

const statuses = Object.keys(feedbackStatusLabels) as FeedbackStatus[];
type User = { _id: string; firstName: string; lastName: string; email: string; role: string };

export default function FeedbackAdminPage() {
  const [items, setItems] = useState<FeedbackRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [urgency, setUrgency] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState({ status: 'new', customerResponse: '', internalNotes: '', assigneeId: '', targetRelease: '', duplicateOfId: '' });
  const selected = items.find((item) => item._id === selectedId);

  const load = async () => {
    setLoading(true); setError('');
    const params = new URLSearchParams(); if (status) params.set('status', status); if (type) params.set('type', type); if (urgency) params.set('urgency', urgency); if (search.trim()) params.set('search', search.trim());
    try { const data = await api.get<FeedbackRecord[]>(`/feedback/admin${params.size ? `?${params}` : ''}`); setItems(data); if (!data.some((x) => x._id === selectedId)) setSelectedId(data[0]?._id || ''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load feedback.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); api.get<User[]>('/users').then(setUsers).catch(() => {}); }, [status, type, urgency]);
  useEffect(() => { if (selected) setDraft({ status: selected.status, customerResponse: selected.customerResponse || '', internalNotes: selected.internalNotes || '', assigneeId: selected.assigneeId || '', targetRelease: selected.targetRelease || '', duplicateOfId: selected.duplicateOfId || '' }); }, [selectedId, selected?.updatedAt]);

  const metrics = useMemo(() => ({ new: items.filter((x) => x.status === 'new').length, blocking: items.filter((x) => x.urgency === 'blocking' && !['fixed','closed','wont_fix'].includes(x.status)).length, planned: items.filter((x) => x.status === 'planned').length }), [items]);
  const save = async () => {
    if (!selected) return; setSaving(true); setError('');
    try { const body = { ...draft, assigneeId: draft.assigneeId || null, duplicateOfId: draft.duplicateOfId || null }; const updated = await api.patch<FeedbackRecord>(`/feedback/${selected._id}`, body); setItems((current) => current.map((item) => item._id === selected._id ? { ...item, ...updated } : item)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save changes.'); }
    finally { setSaving(false); }
  };

  return <>
    <PageHeader title="Customer Feedback" description="Triage customer issues, close the loop, and shape upcoming releases." />
    <div className="mb-5 grid grid-cols-3 gap-3"><Metric icon={Inbox} label="New" value={metrics.new} /><Metric icon={AlertTriangle} label="Blocking" value={metrics.blocking} danger /><Metric icon={MessageSquare} label="Planned" value={metrics.planned} /></div>
    <div className="mb-4 flex flex-wrap gap-2"><div className="relative min-w-56 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-fg-muted" /><input className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="Search feedback or page…" /></div><select aria-label="Feedback status filter" className="input w-40" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{statuses.map((x) => <option key={x} value={x}>{feedbackStatusLabels[x]}</option>)}</select><select aria-label="Feedback type filter" className="input w-44" value={type} onChange={(e) => setType(e.target.value)}><option value="">All types</option>{Object.entries(feedbackTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select aria-label="Feedback impact filter" className="input w-36" value={urgency} onChange={(e) => setUrgency(e.target.value)}><option value="">All impact</option><option value="blocking">Blocking</option><option value="important">Important</option><option value="minor">Minor</option></select><button className="btn-secondary" onClick={load}>Search</button></div>
    {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {loading ? <LoadingSpinner /> : <div className="grid min-h-[560px] overflow-hidden rounded-xl border border-border bg-surface lg:grid-cols-[minmax(300px,0.9fr)_minmax(420px,1.4fr)]">
      <div className="max-h-[70vh] overflow-y-auto border-b border-border lg:border-b-0 lg:border-r">{!items.length ? <p className="p-10 text-center text-sm text-fg-muted">No feedback matches these filters.</p> : items.map((item) => <button key={item._id} onClick={() => setSelectedId(item._id)} className={clsx('block w-full border-b border-border p-4 text-left transition hover:bg-surface-secondary', selectedId === item._id && 'bg-brand-50/70 dark:bg-brand-950/20')}><div className="flex items-center justify-between gap-2"><span className="text-[11px] font-bold uppercase tracking-wide text-brand-700 dark:text-brand-300">{feedbackTypeLabels[item.type]}</span><span className="text-[11px] text-fg-muted">{formatDate(item.createdAt)}</span></div><p className="mt-2 line-clamp-2 text-sm font-medium text-fg">{item.message}</p><div className="mt-3 flex flex-wrap items-center gap-2"><span className="badge-gray">{feedbackStatusLabels[item.status]}</span><span className={item.urgency === 'blocking' ? 'badge-red' : item.urgency === 'important' ? 'badge-amber' : 'badge-gray'}>{item.urgency}</span><span className="truncate text-[11px] text-fg-muted">{item.pagePath}</span></div></button>)}</div>
      <div className="max-h-[70vh] overflow-y-auto">{selected ? <div className="space-y-5 p-5 lg:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold text-fg-muted">{selected.submitter ? `${selected.submitter.firstName} ${selected.submitter.lastName} · ${selected.submitter.email}` : 'Customer'}</p><h2 className="mt-2 whitespace-pre-wrap text-lg font-semibold leading-relaxed text-fg">{selected.message}</h2></div><button onClick={() => setSelectedId('')} className="p-1 text-fg-muted lg:hidden"><X className="h-5 w-5" /></button></div>
        {selected.screenshotDataUrl && <a href={selected.screenshotDataUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-border"><img src={selected.screenshotDataUrl} alt="Customer screenshot" className="max-h-72 w-full object-contain bg-surface-secondary" /><span className="flex items-center gap-2 border-t border-border p-2 text-xs text-brand-700"><ImageIcon className="h-4 w-4" />Open full screenshot</span></a>}
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-surface-secondary p-4 text-xs"><Info label="Page" value={selected.pagePath} /><Info label="Version" value={`${selected.appVersion || '—'} · ${(selected.gitCommit || '—').slice(0, 7)}`} /><Info label="Device" value={`${selected.deviceType || '—'} ${selected.viewportWidth || ''}×${selected.viewportHeight || ''}`} /><Info label="Contact allowed" value={selected.contactAllowed ? 'Yes' : 'No'} />{selected.recentApiError && <div className="col-span-2"><Info label="Recent API error" value={`${selected.recentApiError.status || ''} ${selected.recentApiError.path || ''} — ${selected.recentApiError.message || ''}`} /></div>}</div>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Status"><select className="input" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>{statuses.map((x) => <option key={x} value={x}>{feedbackStatusLabels[x]}</option>)}</select></Field><Field label="Assignee"><select className="input" value={draft.assigneeId} onChange={(e) => setDraft({ ...draft, assigneeId: e.target.value })}><option value="">Unassigned</option>{users.map((u) => <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}</select></Field><Field label="Target release"><input className="input" value={draft.targetRelease} onChange={(e) => setDraft({ ...draft, targetRelease: e.target.value })} placeholder="e.g. 2.1.0" /></Field><Field label="Duplicate of"><select className="input" value={draft.duplicateOfId} onChange={(e) => setDraft({ ...draft, duplicateOfId: e.target.value })}><option value="">Not a duplicate</option>{items.filter((x) => x._id !== selected._id).map((x) => <option key={x._id} value={x._id}>{x.message.slice(0, 45)}</option>)}</select></Field></div>
        <Field label="Customer-visible response"><textarea className="input min-h-24 resize-y" value={draft.customerResponse} onChange={(e) => setDraft({ ...draft, customerResponse: e.target.value })} placeholder="This appears in My Feedback…" /></Field><Field label="Internal notes"><textarea className="input min-h-28 resize-y" value={draft.internalNotes} onChange={(e) => setDraft({ ...draft, internalNotes: e.target.value })} placeholder="Private triage notes…" /></Field>
        <div className="flex justify-end"><button className="btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save feedback'}</button></div>
      </div> : <div className="flex h-full items-center justify-center p-10 text-sm text-fg-muted">Select feedback to review.</div>}</div>
    </div>}
  </>;
}

function Metric({ icon: Icon, label, value, danger = false }: { icon: typeof Inbox; label: string; value: number; danger?: boolean }) { return <div className="card flex items-center gap-3 p-4"><div className={clsx('rounded-lg p-2', danger ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600 dark:bg-brand-950/30')}><Icon className="h-5 w-5" /></div><div><p className="text-xl font-bold text-fg">{value}</p><p className="text-xs text-fg-muted">{label}</p></div></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-fg-secondary">{label}</span>{children}</label>; }
function Info({ label, value }: { label: string; value: string }) { return <div><dt className="font-semibold text-fg-muted">{label}</dt><dd className="mt-1 break-words text-fg-secondary">{value}</dd></div>; }

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Inbox, MessageSquare, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { FeedbackRecord, feedbackBlockers } from '@/lib/feedback';
import { useFeedbackStream } from '@/hooks/use-feedback-stream';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { FeedbackDetail, FeedbackDraft } from '@/components/feedback/feedback-detail';
import { FeedbackFilters, FeedbackFilterState } from '@/components/feedback/feedback-filters';
import { FeedbackList } from '@/components/feedback/feedback-list';
import { clsx } from 'clsx';

type User = { _id: string; firstName: string; lastName: string; email: string; role: string };
type Totals = { new: number; blocking: number; planned: number };

const emptyDraft: FeedbackDraft = { status: 'new', customerResponse: '', internalNotes: '', assigneeId: '', targetRelease: '', duplicateOfId: '' };
const draftOf = (item: FeedbackRecord): FeedbackDraft => ({
  status: item.status,
  customerResponse: item.customerResponse || '',
  internalNotes: item.internalNotes || '',
  assigneeId: item.assigneeId || '',
  targetRelease: item.targetRelease || '',
  duplicateOfId: item.duplicateOfId || '',
});

export default function FeedbackAdminPage() {
  const [items, setItems] = useState<FeedbackRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [totals, setTotals] = useState<Totals>({ new: 0, blocking: 0, planned: 0 });
  const [selectedId, setSelectedId] = useState('');
  const [filters, setFilters] = useState<FeedbackFilterState>({ status: '', type: '', urgency: '', search: '', targetRelease: '' });
  const [knownReleases, setKnownReleases] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<FeedbackDraft>(emptyDraft);
  const [pendingUpdates, setPendingUpdates] = useState(0);

  const selected = items.find((item) => item._id === selectedId);
  // Compared against the draft so a live refresh never discards typing in progress.
  const dirty = useMemo(() => !!selected && JSON.stringify(draft) !== JSON.stringify(draftOf(selected)), [draft, selected]);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const load = useCallback(async (options: { quiet?: boolean } = {}) => {
    if (!options.quiet) setLoading(true);
    setError('');
    const current = filtersRef.current;
    const params = new URLSearchParams();
    if (current.status) params.set('status', current.status);
    if (current.type) params.set('type', current.type);
    if (current.urgency) params.set('urgency', current.urgency);
    if (current.targetRelease.trim()) params.set('targetRelease', current.targetRelease.trim());
    if (current.search.trim()) params.set('search', current.search.trim());
    try {
      const [data, counts] = await Promise.all([
        api.get<FeedbackRecord[]>(`/feedback/admin${params.size ? `?${params}` : ''}`),
        api.get<Totals>('/feedback/admin/count').catch(() => null),
      ]);
      setItems(data);
      if (counts) setTotals(counts);
      setKnownReleases((releases) =>
        [...new Set([...releases, ...data.map((item) => item.targetRelease).filter((value): value is string => Boolean(value))])].sort(),
      );
      setSelectedId((previous) => (data.some((item) => item._id === previous) ? previous : data[0]?._id || ''));
      setPendingUpdates(0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load feedback.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load, filters.status, filters.type, filters.urgency]);
  useEffect(() => { api.get<User[]>('/users').then(setUsers).catch(() => {}); }, []);

  // Live updates: refresh silently while the admin is only reading, and queue
  // behind a visible button once they have unsaved edits in the detail pane.
  useFeedbackStream('admin', () => {
    if (dirtyRef.current) setPendingUpdates((count) => count + 1);
    else void load({ quiet: true });
  });

  useEffect(() => {
    setDraft(selected ? draftOf(selected) : emptyDraft);
    setError('');
  }, [selectedId, selected?.updatedAt]);

  const save = async () => {
    if (!selected || feedbackBlockers(draft).length) return;
    setSaving(true);
    setError('');
    try {
      await api.patch<FeedbackRecord>(`/feedback/${selected._id}`, {
        ...draft,
        assigneeId: draft.assigneeId || null,
        duplicateOfId: draft.duplicateOfId || null,
      });
      // Refetch rather than patching locally: the saved item may no longer match
      // the active filter, and its place in the urgency ordering can change.
      await load({ quiet: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  return <>
    <PageHeader title="Feedback Center" description="One inbox for every client issue, idea, and product observation across releases." />

    <div className="mb-5 grid grid-cols-3 gap-3">
      <Metric icon={Inbox} label="New" value={totals.new} />
      <Metric icon={AlertTriangle} label="Blocking" value={totals.blocking} danger />
      <Metric icon={MessageSquare} label="Planned" value={totals.planned} />
    </div>

    <FeedbackFilters
      value={filters}
      onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
      onSearch={() => void load()}
      releases={knownReleases}
    />

    {pendingUpdates > 0 && (
      <button
        onClick={() => void load({ quiet: true })}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950/30 dark:text-brand-300"
      >
        <RefreshCw className="h-4 w-4" />
        {pendingUpdates} update{pendingUpdates > 1 ? 's' : ''} while you were editing — refresh the list
      </button>
    )}

    {error && !selected && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

    {loading ? <LoadingSpinner /> : (
      <div className="grid min-h-[560px] overflow-hidden rounded-xl border border-border bg-surface lg:grid-cols-[minmax(300px,0.9fr)_minmax(420px,1.4fr)]">
        <div className="max-h-[70vh] overflow-y-auto border-b border-border lg:border-b-0 lg:border-r">
          <FeedbackList items={items} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          {selected ? (
            <FeedbackDetail
              item={selected}
              siblings={items}
              users={users}
              draft={draft}
              onDraftChange={(patch) => { setDraft((current) => ({ ...current, ...patch })); setError(''); }}
              onSave={save}
              onClose={() => setSelectedId('')}
              saving={saving}
              dirty={dirty}
              error={error}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-10 text-sm text-fg-muted">Select feedback to review.</div>
          )}
        </div>
      </div>
    )}
  </>;
}

function Metric({ icon: Icon, label, value, danger = false }: { icon: typeof Inbox; label: string; value: number; danger?: boolean }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <div className={clsx('rounded-lg p-2', danger ? 'bg-red-50 text-red-600 dark:bg-red-950/30' : 'bg-brand-50 text-brand-600 dark:bg-brand-950/30')}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xl font-bold text-fg">{value}</p>
        <p className="text-xs text-fg-muted">{label}</p>
      </div>
    </div>
  );
}

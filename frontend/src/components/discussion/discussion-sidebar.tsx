'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pin, Trash2, MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';
import {
  DiscussionEntry,
  DiscussionEntryType,
  CreateDiscussionEntryPayload,
  UpdateDiscussionEntryPayload,
  ENTRY_TYPE_META,
  WITH_LABEL,
  WITH_PLACEHOLDER,
  NOTES_PLACEHOLDER,
  personName,
  formatEntryDate,
  stripHtml,
} from '@/lib/discussion';

interface DiscussionSidebarProps {
  opportunityId: string;
  currentUserId: string;
  noBorder?: boolean;
}

const ENTRY_TYPES: DiscussionEntryType[] = ['call', 'email', 'note'];

export function DiscussionSidebar({ opportunityId, currentUserId, noBorder = false }: DiscussionSidebarProps) {
  const [entries, setEntries] = useState<DiscussionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState<DiscussionEntryType>('note');
  const [withField, setWithField] = useState('');
  const [notes, setNotes] = useState('');

  function resetFields() {
    setType('note');
    setWithField('');
    setNotes('');
  }

  const load = useCallback(async () => {
    try {
      const data = await api.get<DiscussionEntry[]>(`/opportunities/${opportunityId}/discussion`);
      setEntries(Array.isArray(data) ? data : []);
    } catch {
      // silent — sidebar failure should not block the page
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!notes.trim()) return;
    setSubmitting(true);
    try {
      const people = withField.trim()
        ? withField.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      await api.post(`/opportunities/${opportunityId}/discussion`, {
        type,
        content: notes.trim(),
        date: new Date().toISOString(),
        externalParticipants: people.length ? people : undefined,
      } as CreateDiscussionEntryPayload);
      resetFields();
      setComposing(false);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePin(id: string, pinned: boolean) {
    await api.patch(
      `/opportunities/${opportunityId}/discussion/${id}`,
      { isPinned: pinned } as UpdateDiscussionEntryPayload,
    );
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return;
    await api.delete(`/opportunities/${opportunityId}/discussion/${id}`);
    await load();
  }

  const pinned = entries.filter((e) => e.isPinned);
  const rest = entries.filter((e) => !e.isPinned);
  const sorted = [...pinned, ...rest];

  return (
    <div className={`flex flex-col overflow-hidden max-h-[calc(100vh-8rem)] ${noBorder ? '' : 'rounded-xl border border-border bg-surface shadow-sm'}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-surface-secondary/40 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-fg-muted" />
          <span className="text-sm font-semibold text-fg">Discussion</span>
          {entries.length > 0 && (
            <span className="rounded-full bg-surface-tertiary border border-border px-2 py-0.5 text-[11px] font-medium text-fg-muted">
              {entries.length}
            </span>
          )}
        </div>
        {!composing && (
          <button
            type="button"
            onClick={() => setComposing(true)}
            className="flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        )}
      </div>

      {/* Compose form */}
      {composing && (
        <form
          onSubmit={handleSubmit}
          className="border-b border-border px-4 py-3 space-y-3 bg-surface-secondary/20 shrink-0"
        >
          {/* Type pills */}
          <div className="flex flex-wrap gap-1.5">
            {ENTRY_TYPES.map((t) => {
              const meta = ENTRY_TYPE_META[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    type === t
                      ? `${meta.color} border-transparent ring-1 ring-offset-1 ring-brand-400`
                      : 'border-border text-fg-secondary hover:border-border-strong hover:text-fg'
                  }`}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={withField}
            onChange={(e) => setWithField(e.target.value)}
            placeholder={`${WITH_LABEL[type]} — ${WITH_PLACEHOLDER[type]}`}
            className="input-field text-sm"
          />

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            placeholder={NOTES_PLACEHOLDER[type]}
            rows={3}
            className="input-field resize-none text-sm"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => { setComposing(false); resetFields(); }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-fg-secondary hover:bg-surface-tertiary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !notes.trim()}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {/* Entry feed */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {loading && (
          <p className="px-4 py-8 text-center text-xs text-fg-muted">Loading…</p>
        )}

        {!loading && entries.length === 0 && (
          <div className="px-4 py-10 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-secondary">
              <MessageSquare className="h-5 w-5 text-fg-muted" />
            </div>
            <p className="text-sm font-medium text-fg-secondary">No entries yet</p>
            <p className="mt-1 text-xs text-fg-muted">Log calls, notes, and decisions here.</p>
            <button
              type="button"
              onClick={() => setComposing(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add first entry
            </button>
          </div>
        )}

        {!loading && sorted.length > 0 && (
          <div className="divide-y divide-border/60">
            {sorted.map((entry) => {
              const meta = ENTRY_TYPE_META[entry.type as keyof typeof ENTRY_TYPE_META]
                ?? { label: entry.type, color: 'bg-gray-100 text-gray-700' };
              const isAuthor = entry.authorId._id === currentUserId;
              const text = stripHtml(entry.content);

              return (
                <div
                  key={entry._id}
                  className={`px-4 py-3 transition-colors ${entry.isPinned ? 'bg-brand-50/40 dark:bg-brand-950/10' : 'hover:bg-surface-secondary/30'}`}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight ${meta.color}`}>
                        {meta.label}
                      </span>
                      {entry.isPinned && <Pin className="h-2.5 w-2.5 shrink-0 text-brand-500" />}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePin(entry._id, !entry.isPinned)}
                        className="rounded p-1 text-fg-muted transition-colors hover:bg-surface-secondary hover:text-brand-500"
                        title={entry.isPinned ? 'Unpin' : 'Pin'}
                      >
                        <Pin className="h-3 w-3" />
                      </button>
                      {isAuthor && (
                        <button
                          type="button"
                          onClick={() => handleDelete(entry._id)}
                          className="rounded p-1 text-fg-muted transition-colors hover:bg-surface-secondary hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-fg line-clamp-3">{text}</p>

                  <p className="mt-1.5 text-[10px] text-fg-muted">
                    {formatEntryDate(entry.date)} · {personName(entry.authorId)}
                    {entry.externalParticipants.length > 0 && ` · ${entry.externalParticipants.join(', ')}`}
                  </p>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

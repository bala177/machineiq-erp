'use client';

import { useState } from 'react';
import { Pencil, Pin, PinOff, Trash2, X } from 'lucide-react';
import { DiscussionEntry, ENTRY_TYPE_META, UpdateDiscussionEntryPayload, personName, formatEntryDate, NOTES_PLACEHOLDER } from '@/lib/discussion';
import { RichTextEditor } from './rich-text-editor';
import type { DiscussionUser } from '@/app/(app)/opportunities/[id]/page';

interface DiscussionEntryCardProps {
  entry: DiscussionEntry;
  currentUserId: string;
  users?: DiscussionUser[];
  onPin: (id: string, pinned: boolean) => Promise<void>;
  onUpdate: (id: string, payload: UpdateDiscussionEntryPayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function DiscussionEntryCard({
  entry,
  currentUserId,
  users = [],
  onPin,
  onUpdate,
  onDelete,
}: DiscussionEntryCardProps) {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(entry.content);
  const [editError, setEditError] = useState('');

  const meta = ENTRY_TYPE_META[entry.type as keyof typeof ENTRY_TYPE_META]
    ?? { label: entry.type, color: 'bg-gray-100 text-gray-700' };
  const isAuthor = entry.authorId._id === currentUserId;

  // Build participant display names
  const participantNames = (entry.participants || [])
    .map((p) => `${p.firstName || ''} ${p.lastName || ''}`.trim())
    .filter(Boolean);
  const allParticipants = [
    ...participantNames,
    ...(entry.externalParticipants || []),
  ].filter(Boolean);

  async function handlePin() {
    setBusy(true);
    try { await onPin(entry._id, !entry.isPinned); } finally { setBusy(false); }
  }

  async function handleDelete() {
    if (!confirm('Delete this note?')) return;
    setBusy(true);
    try { await onDelete(entry._id); } finally { setBusy(false); }
  }

  async function handleSaveEdit() {
    const stripped = editContent.replace(/<[^>]*>/g, '').trim();
    if (!stripped) { setEditError('Content cannot be empty.'); return; }
    setBusy(true);
    setEditError('');
    try {
      await onUpdate(entry._id, { content: editContent });
      setEditing(false);
    } catch {
      setEditError('Failed to save changes.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`rounded-xl border bg-surface overflow-hidden transition-shadow ${
      entry.isPinned ? 'border-brand-400 shadow-sm shadow-brand-100 dark:shadow-brand-950/20' : 'border-border'
    }`}>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-surface-secondary/30">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>{meta.label}</span>
          {entry.isPinned && (
            <span className="flex items-center gap-1 text-xs font-medium text-brand-500">
              <Pin className="h-3 w-3" /> Pinned
            </span>
          )}
          <span className="text-xs text-fg-muted">
            {formatEntryDate(entry.date)} · <span className="font-medium text-fg-secondary">{personName(entry.authorId)}</span>
          </span>
          {allParticipants.length > 0 && (
            <span className="text-xs text-fg-muted">
              with {allParticipants.join(', ')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {isAuthor && !editing && (
            <button
              onClick={() => { setEditing(true); setEditContent(entry.content); setEditError(''); }}
              disabled={busy}
              title="Edit"
              className="p-1.5 rounded text-fg-muted hover:text-brand-500 hover:bg-surface-secondary transition-colors disabled:opacity-50"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {editing && (
            <button
              onClick={() => setEditing(false)}
              disabled={busy}
              title="Cancel edit"
              className="p-1.5 rounded text-fg-muted hover:text-fg hover:bg-surface-secondary transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={handlePin}
            disabled={busy}
            title={entry.isPinned ? 'Unpin' : 'Pin'}
            className="p-1.5 rounded text-fg-muted hover:text-brand-500 hover:bg-surface-secondary transition-colors disabled:opacity-50"
          >
            {entry.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </button>
          {isAuthor && (
            <button
              onClick={handleDelete}
              disabled={busy}
              title="Delete"
              className="p-1.5 rounded text-fg-muted hover:text-red-500 hover:bg-surface-secondary transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {editing ? (
          <div className="space-y-3">
            <RichTextEditor
              value={editContent}
              onChange={setEditContent}
              placeholder={NOTES_PLACEHOLDER[entry.type as keyof typeof NOTES_PLACEHOLDER] ?? 'Edit note…'}
              minHeight="100px"
            />
            {editError && <p className="text-xs text-red-500">{editError}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={busy}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSaveEdit()}
                disabled={busy}
                className="btn-primary text-xs disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        ) : (
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-fg [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1"
            // Content is generated by TipTap from authenticated users — safe formatting tags only
            dangerouslySetInnerHTML={{ __html: entry.content }}
          />
        )}
      </div>
    </div>
  );
}

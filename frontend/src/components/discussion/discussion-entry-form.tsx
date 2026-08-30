'use client';

import { useRef, useState } from 'react';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import {
  CreateDiscussionEntryPayload,
  NOTES_PLACEHOLDER,
} from '@/lib/discussion';
import { RichTextEditor } from './rich-text-editor';
import type { DiscussionUser } from '@/app/(app)/opportunities/[id]/page';

interface DiscussionEntryFormProps {
  onSubmit: (payload: CreateDiscussionEntryPayload) => Promise<void>;
  users?: DiscussionUser[];
  initialContent?: string;
  submitLabel?: string;
  onCancel?: () => void;
}

export function DiscussionEntryForm({
  onSubmit,
  users = [],
  initialContent = '',
  submitLabel = 'Add Note',
  onCancel,
}: DiscussionEntryFormProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedUsers, setSelectedUsers] = useState<DiscussionUser[]>([]);
  const [externalText, setExternalText] = useState('');
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const userPickerRef = useRef<HTMLDivElement>(null);

  function reset() {
    setContent('');
    setDate(new Date().toISOString().slice(0, 10));
    setSelectedUsers([]);
    setExternalText('');
    setUserSearch('');
    setFormError('');
    setOpen(false);
  }

  function userId(u: DiscussionUser) { return u._id || u.id || ''; }

  function toggleUser(u: DiscussionUser) {
    setSelectedUsers((cur) =>
      cur.some((x) => userId(x) === userId(u)) ? cur.filter((x) => userId(x) !== userId(u)) : [...cur, u],
    );
  }

  function removeUser(id: string) {
    setSelectedUsers((cur) => cur.filter((u) => userId(u) !== id));
  }

  function userName(u: DiscussionUser) {
    return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Unknown';
  }

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      !q ||
      (u.firstName || '').toLowerCase().includes(q) ||
      (u.lastName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const stripped = content.replace(/<[^>]*>/g, '').trim();
    if (!stripped) { setFormError('Note content is required.'); return; }
    setSubmitting(true);
    setFormError('');
    try {
      const external = externalText.trim()
        ? externalText.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      await onSubmit({
        type: 'note',
        content,
        date: new Date(date).toISOString(),
        participants: selectedUsers.map((u) => u._id || u.id).filter(Boolean) as string[],
        externalParticipants: external.length ? external : undefined,
      });
      reset();
      onCancel?.();
    } catch {
      setFormError('Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open && !initialContent) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border text-fg-muted hover:border-brand-400 hover:text-brand-500 transition-colors w-full"
      >
        <Plus className="h-4 w-4" />
        <span className="text-sm font-medium">Add note</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface shadow-sm overflow-visible space-y-0">
      {/* Top bar: label + date */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          Note
        </span>
        <div className="flex items-center gap-2">
          <label className="text-xs text-fg-muted sr-only">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="input-field text-xs py-1.5 w-36"
          />
        </div>
      </div>

      {/* Rich text editor */}
      <div className="px-4 pb-3">
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder={NOTES_PLACEHOLDER['note']}
          minHeight="110px"
        />
      </div>

      {/* Participants row */}
      <div className="px-4 pb-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-fg-muted">Participants:</span>
          {selectedUsers.map((u) => (
            <span key={userId(u)} className="flex items-center gap-1 rounded-full bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800/40 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:text-brand-300">
              {userName(u)}
              <button type="button" onClick={() => removeUser(userId(u))} className="text-brand-400 hover:text-brand-700 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          {/* User picker */}
          <div ref={userPickerRef} className="relative">
            <button
              type="button"
              onClick={() => { setUserPickerOpen((o) => !o); setUserSearch(''); }}
              className="flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-fg-muted hover:border-brand-400 hover:text-brand-500 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add person
              <ChevronDown className={`h-3 w-3 transition-transform ${userPickerOpen ? 'rotate-180' : ''}`} />
            </button>
            {userPickerOpen && (
              <div className="absolute z-50 top-full mt-1 left-0 w-56 rounded-xl border border-border bg-surface shadow-xl overflow-hidden">
                <div className="p-2 border-b border-border">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full rounded-lg border border-border px-2.5 py-1.5 text-xs bg-surface focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto py-1">
                  {filteredUsers.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-fg-muted">No users found.</p>
                  ) : (
                    filteredUsers.map((u) => {
                      const selected = selectedUsers.some((x) => userId(x) === userId(u));
                      return (
                        <button
                          key={userId(u)}
                          type="button"
                          onClick={() => { toggleUser(u); setUserPickerOpen(false); setUserSearch(''); }}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-surface-secondary transition-colors text-left"
                        >
                          <div>
                            <div className="font-medium text-fg">{userName(u)}</div>
                            {u.role && <div className="text-fg-muted capitalize">{u.role}</div>}
                          </div>
                          {selected && <Check className="h-3.5 w-3.5 text-brand-500 shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* External participants */}
        <div>
          <input
            type="text"
            value={externalText}
            onChange={(e) => setExternalText(e.target.value)}
            placeholder="External participants (comma-separated, e.g. Kumar · Titan Engineering)"
            className="input-field text-xs py-1.5"
          />
        </div>
      </div>

      {formError && <p className="px-4 pb-2 text-sm text-red-500">{formError}</p>}

      {/* Actions */}
      <div className="flex justify-end gap-2 px-4 py-3 border-t border-border bg-surface-secondary/40">
        <button
          type="button"
          onClick={() => { reset(); onCancel?.(); }}
          className="btn-ghost text-sm"
        >
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-50">
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

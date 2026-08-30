'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  DiscussionEntry,
  CreateDiscussionEntryPayload,
  UpdateDiscussionEntryPayload,
} from '@/lib/discussion';
import type { DiscussionUser } from '@/app/(app)/opportunities/[id]/page';

import { DiscussionEntryForm } from './discussion-entry-form';
import { DiscussionEntryCard } from './discussion-entry-card';

interface DiscussionBoardProps {
  opportunityId: string;
  currentUserId: string;
  users?: DiscussionUser[];
  onNoteChanged?: () => void;
}

export function DiscussionBoard({ opportunityId, currentUserId, users = [], onNoteChanged }: DiscussionBoardProps) {
  const [entries, setEntries] = useState<DiscussionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<DiscussionEntry[]>(`/opportunities/${opportunityId}/discussion`);
      setEntries(data);
    } catch {
      setError('Failed to load discussion entries.');
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  useEffect(() => { load(); }, [load]);

  // Poll every 20 s so collaborators across different roles see new notes without refreshing
  useEffect(() => {
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, [load]);

  async function handleCreate(payload: CreateDiscussionEntryPayload) {
    await api.post(`/opportunities/${opportunityId}/discussion`, payload);
    await load();
    onNoteChanged?.();
  }

  async function handleUpdate(id: string, payload: UpdateDiscussionEntryPayload) {
    await api.patch(`/opportunities/${opportunityId}/discussion/${id}`, payload);
    await load();
    onNoteChanged?.();
  }

  async function handlePin(id: string, pinned: boolean) {
    await handleUpdate(id, { isPinned: pinned });
  }

  async function handleDelete(id: string) {
    await api.delete(`/opportunities/${opportunityId}/discussion/${id}`);
    await load();
    onNoteChanged?.();
  }

  return (
    <div className="space-y-4">
      <DiscussionEntryForm onSubmit={handleCreate} users={users} />

      {loading && <p className="text-sm text-fg-muted py-4 text-center">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && entries.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-fg-muted">No notes yet. Add the first one above.</p>
        </div>
      )}

      <div className="space-y-3">
        {entries.map((entry) => (
          <DiscussionEntryCard
            key={entry._id}
            entry={entry}
            currentUserId={currentUserId}
            users={users}
            onPin={handlePin}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}

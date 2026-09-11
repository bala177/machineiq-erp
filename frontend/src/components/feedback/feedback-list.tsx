'use client';

import { clsx } from 'clsx';
import { FeedbackRecord, feedbackStatusLabels, feedbackStatusStyles, feedbackTypeLabels } from '@/lib/feedback';
import { formatDate } from '@/lib/utils';

export function FeedbackList({
  items,
  selectedId,
  onSelect,
}: {
  items: FeedbackRecord[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (!items.length) return <p className="p-10 text-center text-sm text-fg-muted">No feedback matches these filters.</p>;

  return (
    <ul>
      {items.map((item) => (
        <li key={item._id}>
          <button
            onClick={() => onSelect(item._id)}
            aria-current={selectedId === item._id}
            className={clsx(
              'block w-full border-b border-border p-4 text-left transition hover:bg-surface-secondary',
              selectedId === item._id && 'bg-brand-50/70 dark:bg-brand-950/20',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-brand-700 dark:text-brand-300">{feedbackTypeLabels[item.type]}</span>
              <span className="shrink-0 text-[11px] text-fg-muted">{formatDate(item.createdAt)}</span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm font-medium text-fg">{item.message}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={feedbackStatusStyles[item.status]}>{feedbackStatusLabels[item.status]}</span>
              <span className={item.urgency === 'blocking' ? 'badge-red' : item.urgency === 'important' ? 'badge-amber' : 'badge-gray'}>{item.urgency}</span>
              <span className="truncate text-[11px] text-fg-muted">{item.pagePath}</span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

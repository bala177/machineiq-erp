'use client';

import { Search } from 'lucide-react';
import { FeedbackStatus, feedbackStatusLabels, feedbackTypeLabels } from '@/lib/feedback';

const statuses = Object.keys(feedbackStatusLabels) as FeedbackStatus[];

export interface FeedbackFilterState {
  status: string;
  type: string;
  urgency: string;
  search: string;
  targetRelease: string;
}

export function FeedbackFilters({
  value,
  onChange,
  onSearch,
  releases,
}: {
  value: FeedbackFilterState;
  onChange: (next: Partial<FeedbackFilterState>) => void;
  onSearch: () => void;
  releases: string[];
}) {
  const submitOnEnter = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') onSearch();
  };

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-fg-muted" />
          <input
            className="input pl-9"
            aria-label="Search feedback"
            value={value.search}
            onChange={(event) => onChange({ search: event.target.value })}
            onKeyDown={submitOnEnter}
            placeholder="Search feedback or page…"
          />
        </div>
        <select aria-label="Feedback status filter" className="input w-40" value={value.status} onChange={(event) => onChange({ status: event.target.value })}>
          <option value="">All statuses</option>
          {statuses.map((status) => <option key={status} value={status}>{feedbackStatusLabels[status]}</option>)}
        </select>
        <select aria-label="Feedback type filter" className="input w-44" value={value.type} onChange={(event) => onChange({ type: event.target.value })}>
          <option value="">All types</option>
          {Object.entries(feedbackTypeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <select aria-label="Feedback impact filter" className="input w-36" value={value.urgency} onChange={(event) => onChange({ urgency: event.target.value })}>
          <option value="">All impact</option>
          <option value="blocking">Blocking</option>
          <option value="important">Important</option>
          <option value="minor">Minor</option>
        </select>
        <button className="btn-secondary" onClick={onSearch}>Search</button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {/* `block` matters: a bare <label> is inline, which printed the caption
            and the input on top of each other. */}
        <label className="block w-56 text-xs font-semibold text-fg-secondary">
          <span className="mb-1 block">Target release</span>
          <input
            list="feedback-releases"
            className="input"
            value={value.targetRelease}
            onChange={(event) => onChange({ targetRelease: event.target.value })}
            onKeyDown={submitOnEnter}
            placeholder="All releases"
          />
        </label>
        <datalist id="feedback-releases">{releases.map((release) => <option key={release} value={release} />)}</datalist>
        {value.targetRelease && <button className="btn-ghost mb-0.5" onClick={() => { onChange({ targetRelease: '' }); }}>Clear release</button>}
        <p className="mb-2 text-xs text-fg-muted">Set a target release on each planned item, then select Search for a release review.</p>
      </div>
    </div>
  );
}

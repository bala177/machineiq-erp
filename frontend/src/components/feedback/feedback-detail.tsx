'use client';

import { AlertCircle, Image as ImageIcon, X } from 'lucide-react';
import { clsx } from 'clsx';
import {
  FeedbackRecord,
  FeedbackStatus,
  feedbackBlockers,
  feedbackStatusLabels,
  feedbackStatusMeaning,
  feedbackStatusStyles,
  needsCustomerResponse,
  needsTargetRelease,
} from '@/lib/feedback';

const statuses = Object.keys(feedbackStatusLabels) as FeedbackStatus[];

export interface FeedbackDraft {
  status: string;
  customerResponse: string;
  internalNotes: string;
  assigneeId: string;
  targetRelease: string;
  duplicateOfId: string;
}

interface User { _id: string; firstName: string; lastName: string }

export function FeedbackDetail({
  item,
  siblings,
  users,
  draft,
  onDraftChange,
  onSave,
  onClose,
  saving,
  dirty,
  error,
}: {
  item: FeedbackRecord;
  siblings: FeedbackRecord[];
  users: User[];
  draft: FeedbackDraft;
  onDraftChange: (patch: Partial<FeedbackDraft>) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
  dirty: boolean;
  error: string;
}) {
  const blockers = feedbackBlockers(draft);
  const blockedOn = (field: 'customerResponse' | 'targetRelease') => blockers.find((blocker) => blocker.field === field);
  const responseRequired = needsCustomerResponse(draft.status);
  const releaseRequired = needsTargetRelease(draft.status);

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-surface px-5 py-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-fg-muted">
            {item.submitter ? `${item.submitter.firstName} ${item.submitter.lastName} · ${item.submitter.email}` : 'Customer'}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className={feedbackStatusStyles[item.status]}>{feedbackStatusLabels[item.status]}</span>
            {item.urgency === 'blocking' && <span className="badge-red">Blocking</span>}
            <span className="truncate text-xs text-fg-muted">{item.pagePath}</span>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1 text-fg-muted hover:bg-surface-secondary lg:hidden" aria-label="Close feedback detail">
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 lg:px-6">
        <h2 className="whitespace-pre-wrap text-lg font-semibold leading-relaxed text-fg">{item.message}</h2>

        {item.screenshotDataUrl && (
          <a href={item.screenshotDataUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-border">
            <img src={item.screenshotDataUrl} alt="Reporter screenshot" className="max-h-72 w-full bg-surface-secondary object-contain" />
            <span className="flex items-center gap-2 border-t border-border p-2 text-xs text-brand-700"><ImageIcon className="h-4 w-4" />Open full screenshot</span>
          </a>
        )}

        <dl className="grid grid-cols-2 gap-3 rounded-lg bg-surface-secondary p-4 text-xs">
          <Info label="Page" value={item.pagePath} />
          <Info label="Version" value={`${item.appVersion || '—'} · ${(item.gitCommit || '—').slice(0, 7)}`} />
          <Info label="Device" value={`${item.deviceType || '—'} ${item.viewportWidth || ''}×${item.viewportHeight || ''}`} />
          <Info label="Contact allowed" value={item.contactAllowed ? 'Yes' : 'No'} />
          {item.recentApiError && (
            <div className="col-span-2">
              <Info label="Recent API error" value={`${item.recentApiError.status || ''} ${item.recentApiError.path || ''} — ${item.recentApiError.message || ''}`} />
            </div>
          )}
        </dl>

        <section className="rounded-lg border border-border p-4">
          <Field label="Status" htmlFor="feedback-status">
            <select id="feedback-status" className="input" value={draft.status} onChange={(event) => onDraftChange({ status: event.target.value })}>
              {statuses.map((status) => <option key={status} value={status}>{feedbackStatusLabels[status]}</option>)}
            </select>
          </Field>
          <p className="mt-2 text-xs leading-relaxed text-fg-muted">{feedbackStatusMeaning[draft.status as FeedbackStatus]}</p>
          {(responseRequired || releaseRequired) && (
            <p className="mt-3 rounded-md bg-surface-secondary px-3 py-2 text-xs text-fg-secondary">
              To save as <strong>{feedbackStatusLabels[draft.status as FeedbackStatus]}</strong> you must fill in{' '}
              {[releaseRequired && 'a target release', responseRequired && 'a reply to the reporter'].filter(Boolean).join(' and ')}.
            </p>
          )}
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Assignee" htmlFor="feedback-assignee">
            <select id="feedback-assignee" className="input" value={draft.assigneeId} onChange={(event) => onDraftChange({ assigneeId: event.target.value })}>
              <option value="">Unassigned</option>
              {users.map((user) => <option key={user._id} value={user._id}>{user.firstName} {user.lastName}</option>)}
            </select>
          </Field>
          <Field label="Target release" htmlFor="feedback-release" required={releaseRequired} error={blockedOn('targetRelease')?.message}>
            <input
              id="feedback-release"
              className={clsx('input', blockedOn('targetRelease') && 'border-red-400 focus:border-red-500')}
              value={draft.targetRelease}
              onChange={(event) => onDraftChange({ targetRelease: event.target.value })}
              placeholder="e.g. 2.1.0"
            />
          </Field>
        </div>

        <Field label="Duplicate of" htmlFor="feedback-duplicate">
          <select id="feedback-duplicate" className="input" value={draft.duplicateOfId} onChange={(event) => onDraftChange({ duplicateOfId: event.target.value })}>
            <option value="">Not a duplicate</option>
            {siblings.filter((other) => other._id !== item._id).map((other) => (
              <option key={other._id} value={other._id}>{other.message.slice(0, 45)}</option>
            ))}
          </select>
        </Field>

        <Field
          label="Reply to the reporter"
          htmlFor="feedback-response"
          required={responseRequired}
          error={blockedOn('customerResponse')?.message}
          hint="The reporter reads this in their Feedback Center."
        >
          <textarea
            id="feedback-response"
            className={clsx('input min-h-24 resize-y', blockedOn('customerResponse') && 'border-red-400 focus:border-red-500')}
            value={draft.customerResponse}
            onChange={(event) => onDraftChange({ customerResponse: event.target.value })}
            placeholder="What you found, and what happens next…"
          />
        </Field>

        <Field label="Internal notes" htmlFor="feedback-notes" hint="Private to admins. Never shown to the reporter.">
          <textarea
            id="feedback-notes"
            className="input min-h-28 resize-y"
            value={draft.internalNotes}
            onChange={(event) => onDraftChange({ internalNotes: event.target.value })}
            placeholder="Private triage notes…"
          />
        </Field>
      </div>

      <footer className="sticky bottom-0 z-10 border-t border-border bg-surface px-5 py-3">
        {error && (
          <p role="alert" className="mb-2 flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-fg-muted">
            {blockers.length ? blockers[0].message : dirty ? 'Unsaved changes' : 'All changes saved'}
          </p>
          <button className="btn-primary" disabled={saving || !!blockers.length || !dirty} onClick={onSave}>
            {saving ? 'Saving…' : 'Save feedback'}
          </button>
        </div>
      </footer>
    </div>
  );
}

function Field({ label, htmlFor, children, required, error, hint }: {
  label: string; htmlFor: string; children: React.ReactNode; required?: boolean; error?: string; hint?: string;
}) {
  return (
    <div className="block">
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-fg-secondary">
        {label}{required && <span className="ml-1 text-red-500" title="Required for the selected status">*</span>}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p> : hint ? <p className="mt-1 text-xs text-fg-muted">{hint}</p> : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-fg-muted">{label}</dt>
      <dd className="mt-1 break-words text-fg-secondary">{value}</dd>
    </div>
  );
}

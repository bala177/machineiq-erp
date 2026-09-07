'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ExternalLink, MessageSquare, Smile } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { FeedbackRecord, feedbackStatusLabels, feedbackTypeLabels } from '@/lib/feedback';
import { ReviewSection, feedbackHref, reviewSections, sectionForPath } from '@/lib/review-sections';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatDate } from '@/lib/utils';

const statusStyle: Record<string, string> = { new: 'badge-blue', reviewing: 'badge-amber', needs_info: 'badge-red', planned: 'badge-purple', fixed: 'badge-green', wont_fix: 'badge-gray', closed: 'badge-gray' };

const steps = [
  { title: 'Open a section', detail: 'Start with the work you do most often.' },
  { title: 'Try it with your own data', detail: 'Real customers, real machines, real prices.' },
  { title: 'Tell us what you found', detail: 'Send feedback from that screen — we record where you were.' },
];

export default function MyFeedbackPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ enabled: boolean }>('/feedback/config')
      .then(({ enabled: on }) => {
        setEnabled(on);
        if (!on) return [] as FeedbackRecord[];
        return api.get<FeedbackRecord[]>('/feedback/mine');
      })
      .then((mine) => setItems(mine ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load your feedback.'))
      .finally(() => setLoading(false));
  }, []);

  const role = user?.role ?? '';
  const sections = useMemo(() => reviewSections.filter((section) => !role || section.roles.includes(role)), [role]);

  /** Feedback the reviewer has already sent, keyed by the section it came from. */
  const bySection = useMemo(() => {
    const map = new Map<string, FeedbackRecord[]>();
    for (const item of items) {
      const key = sectionForPath(item.pagePath)?.key ?? 'other';
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return map;
  }, [items]);

  const reviewed = sections.filter((section) => bySection.has(section.key)).length;
  const other = bySection.get('other') ?? [];

  if (loading) return <LoadingSpinner />;

  return <>
    <PageHeader title="Review & Feedback" description="Work through each section with your own data and tell us what works and what gets in your way." />

    {!enabled && <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">Feedback collection is switched off at the moment, so nothing can be sent yet. You can still open each section to look around — ask your MachineIQ contact to turn feedback on when you are ready to review.</div>}
    {enabled && error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

    <ol className="mb-6 grid gap-3 sm:grid-cols-3">
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-3 rounded-xl border border-border bg-surface p-4">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{index + 1}</span>
          <span>
            <span className="block text-sm font-semibold text-fg">{step.title}</span>
            <span className="mt-0.5 block text-xs text-fg-muted">{step.detail}</span>
          </span>
        </li>
      ))}
    </ol>

    <section className="mb-8">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-fg">Sections to review</h2>
        <p className="text-sm text-fg-muted">{reviewed} of {sections.length} reviewed</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {sections.map((section) => <SectionCard key={section.key} section={section} sent={bySection.get(section.key) ?? []} canSend={enabled} />)}
      </div>
    </section>

    <section>
      <h2 className="mb-3 text-lg font-semibold text-fg">What you have sent <span className="font-normal text-fg-muted">({items.length})</span></h2>

      {!items.length ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
          <MessageSquare className="mx-auto h-9 w-9 text-fg-muted" />
          <p className="mt-3 text-sm font-semibold text-fg">Nothing sent yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-fg-muted">Pick a section above and open it. The Feedback button stays in the bottom-right corner of every screen, so you can report something the moment you hit it.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {[...sections, ...(other.length ? [{ key: 'other', label: 'Elsewhere in the app' } as ReviewSection] : [])]
            .filter((section) => (bySection.get(section.key) ?? []).length)
            .map((section) => (
              <div key={section.key}>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-fg-muted">{section.label}</h3>
                <div className="space-y-3">{(bySection.get(section.key) ?? []).map((item) => <FeedbackCard key={item._id} item={item} />)}</div>
              </div>
            ))}
        </div>
      )}
    </section>
  </>;
}

function SectionCard({ section, sent, canSend }: { section: ReviewSection; sent: FeedbackRecord[]; canSend: boolean }) {
  const worksWell = sent.some((item) => item.type === 'positive');
  const open = sent.filter((item) => !['fixed', 'closed', 'wont_fix'].includes(item.status)).length;

  return (
    <article className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-fg">{section.label}</h3>
          {sent.length ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-secondary px-2.5 py-1 text-[11px] font-semibold text-fg-secondary">
              {worksWell && <Smile className="h-3.5 w-3.5 text-emerald-500" />}
              {sent.length} sent{open ? ` · ${open} open` : ''}
            </span>
          ) : (
            <span className="rounded-full border border-dashed border-border-strong px-2.5 py-1 text-[11px] font-medium text-fg-muted">Not reviewed yet</span>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">{section.purpose}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={section.href} className="btn-primary text-sm">Open section <ArrowRight className="h-4 w-4" /></Link>
        {canSend && <Link href={feedbackHref(section)} className="btn-secondary text-sm">Send feedback</Link>}
      </div>
    </article>
  );
}

function FeedbackCard({ item }: { item: FeedbackRecord }) {
  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={statusStyle[item.status] || 'badge-gray'}>{feedbackStatusLabels[item.status]}</span>
            <span className="text-xs font-semibold text-fg-secondary">{feedbackTypeLabels[item.type]}</span>
            {item.urgency === 'blocking' && <span className="badge-red">Blocking</span>}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-fg">{item.message}</p>
        </div>
        <span className="shrink-0 text-xs text-fg-muted">{formatDate(item.createdAt)}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-fg-muted">
        <span className="inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" />{item.pagePath}</span>
        {item.targetRelease && <span>Target: {item.targetRelease}</span>}
      </div>

      {item.customerResponse && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" />Team response</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-fg-secondary">{item.customerResponse}</p>
        </div>
      )}
    </article>
  );
}

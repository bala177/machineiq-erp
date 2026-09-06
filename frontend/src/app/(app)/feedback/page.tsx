'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, ExternalLink, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { FeedbackRecord, feedbackStatusLabels, feedbackTypeLabels } from '@/lib/feedback';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils';

const statusStyle: Record<string, string> = { new: 'badge-blue', reviewing: 'badge-amber', needs_info: 'badge-red', planned: 'badge-purple', fixed: 'badge-green', wont_fix: 'badge-gray', closed: 'badge-gray' };

export default function MyFeedbackPage() {
  const [items, setItems] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { api.get<FeedbackRecord[]>('/feedback/mine').then(setItems).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  if (loading) return <LoadingSpinner />;
  return <>
    <PageHeader title="My Feedback" description="Track what you shared and see responses from the MachineIQ team." />
    {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {!items.length ? <EmptyState icon={<MessageSquare className="h-10 w-10" />} title="No feedback yet" description="Use the Feedback button in the lower-right corner whenever something breaks, feels difficult, or could be better." /> :
      <div className="space-y-3">{items.map((item) => <article key={item._id} className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><span className={statusStyle[item.status] || 'badge-gray'}>{feedbackStatusLabels[item.status]}</span><span className="text-xs font-semibold text-fg-secondary">{feedbackTypeLabels[item.type]}</span>{item.urgency === 'blocking' && <span className="badge-red">Blocking</span>}</div><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-fg">{item.message}</p></div><span className="shrink-0 text-xs text-fg-muted">{formatDate(item.createdAt)}</span></div>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-fg-muted"><span className="inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" />{item.pagePath}</span>{item.targetRelease && <span>Target: {item.targetRelease}</span>}</div>
        {item.customerResponse && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" />Team response</p><p className="mt-2 whitespace-pre-wrap text-sm text-fg-secondary">{item.customerResponse}</p></div>}
      </article>)}</div>}
  </>;
}

'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, FileCheck2, FileText } from 'lucide-react';

export type PipelineValue = { currency: string; gross: string };
export type PipelineStage = { kind: 'enquiry' | 'quote' | 'order' | 'project'; open: number; total: number; value: PipelineValue[] };
export type AttentionRecord = {
  id: string; kind: string; number: string; title: string; status: string;
  customer: string; owner: string; currency: string; gross: string;
  valid_until: string | null; delivery_date: string | null;
};
export type SalesOverview = {
  scope: 'all' | 'own';
  stages: PipelineStage[];
  attention: { pendingApproval: AttentionRecord[]; expiringQuotes: AttentionRecord[]; overdueOrders: AttentionRecord[] };
};

// Release 2 keeps every commercial document on /sales, split by ?kind —
// these must match the sidebar exactly or the tiles lead nowhere.
const stageMeta: Record<PipelineStage['kind'], { label: string; href: string; hint: string }> = {
  enquiry: { label: 'Enquiries', href: '/sales?kind=enquiry', hint: 'Being qualified' },
  quote: { label: 'Quotations', href: '/sales?kind=quote', hint: 'Awaiting decision' },
  order: { label: 'Sales orders', href: '/sales?kind=order', hint: 'In delivery' },
  project: { label: 'Machine projects', href: '/sales?kind=project', hint: 'In execution' },
};

/** Amounts arrive as exact decimal strings; never re-parse them into a float. */
function formatMoney(currency: string, gross: string) {
  const [whole, fraction = ''] = gross.split('.');
  const grouped = Number(whole).toLocaleString('en-IN');
  return `${currency} ${grouped}${fraction && Number(fraction) ? `.${fraction}` : ''}`;
}

/**
 * The commercial pipeline across both releases: how much work sits at each
 * stage, and what it is worth. Values stay split by currency because totals
 * from different currencies are not comparable.
 */
export function SalesPipeline({ stages, scope }: { stages: PipelineStage[]; scope?: 'all' | 'own' }) {
  const anyRecords = stages.some((stage) => stage.total > 0);

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5">
        <div>
          <h2 className="font-semibold text-fg">Commercial pipeline</h2>
          <p className="text-sm text-fg-muted">
            {scope === 'own' ? 'Records you own' : 'Enquiry through to machine project'}
          </p>
        </div>
        <Link href="/sales?tab=reports" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">Reports</Link>
      </div>

      {anyRecords ? (
        <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4">
          {stages.map((stage, index) => {
            const meta = stageMeta[stage.kind];
            return (
              <Link
                key={stage.kind}
                href={meta.href}
                className={`group flex h-full flex-col gap-1 px-5 py-4 transition-colors hover:bg-surface-secondary ${index ? 'xl:border-l xl:border-border' : ''} ${index % 2 ? 'sm:border-l sm:border-border' : ''}`}
              >
                <span className="flex min-h-[2.25rem] items-start gap-1.5 text-[11px] font-medium uppercase leading-tight tracking-wider text-fg-muted">
                  {meta.label}
                  <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
                <span className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold leading-none tabular-nums text-fg">{stage.open}</span>
                  <span className="text-xs text-fg-muted">{meta.hint}</span>
                </span>
                <div className="mt-auto space-y-0.5 pt-3">
                  {stage.value.length === 0
                    ? <span className="text-sm text-fg-muted">—</span>
                    : stage.value.map((value) => (
                      <span key={value.currency} className="block text-sm font-medium tabular-nums text-fg-secondary">
                        {formatMoney(value.currency, value.gross)}
                      </span>
                    ))}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="px-5 py-10 text-center">
          <FileCheck2 className="mx-auto h-7 w-7 text-fg-muted" />
          <p className="mt-2.5 text-sm font-medium text-fg">No commercial records yet</p>
          <p className="mt-1 text-sm text-fg-muted">Raise an enquiry and it will move through quote, order, and machine project here.</p>
          <Link href="/sales?kind=enquiry" className="btn-primary mt-4 inline-flex">New enquiry</Link>
        </div>
      )}
    </section>
  );
}

const queues = [
  { key: 'pendingApproval' as const, label: 'Waiting on approval', icon: FileCheck2, tone: 'text-amber-600 dark:text-amber-400', detail: (r: AttentionRecord) => `${r.customer} · ${r.owner}` },
  { key: 'expiringQuotes' as const, label: 'Quotes expiring', icon: Clock, tone: 'text-amber-600 dark:text-amber-400', detail: (r: AttentionRecord) => `${r.customer} · valid to ${r.valid_until?.slice(0, 10) ?? '—'}` },
  { key: 'overdueOrders' as const, label: 'Orders past delivery date', icon: AlertTriangle, tone: 'text-red-600 dark:text-red-400', detail: (r: AttentionRecord) => `${r.customer} · due ${r.delivery_date?.slice(0, 10) ?? '—'}` },
];

const recordHref = (record: AttentionRecord) => `/sales/${record.id}`;

/** What is actually waiting on somebody, rather than a count of everything. */
export function AttentionQueue({ attention }: { attention: SalesOverview['attention'] }) {
  const active = queues.filter((queue) => attention[queue.key].length > 0);
  const total = active.reduce((sum, queue) => sum + attention[queue.key].length, 0);

  if (active.length === 0) {
    return (
      <p className="flex items-center gap-2 px-1 text-sm text-fg-muted">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        Nothing is overdue or waiting on approval.
      </p>
    );
  }

  return (
    <section className="card overflow-hidden border-amber-200 dark:border-amber-900/60">
      <div className="flex items-baseline gap-2 border-b border-border px-5 py-3.5">
        <h2 className="font-semibold text-fg">Needs attention</h2>
        <span className="text-sm tabular-nums text-fg-muted">{total}</span>
      </div>

      <div className="divide-y divide-border">
          {active.map((queue) => (
            <div key={queue.key} className="px-5 py-3.5">
              <p className={`flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide ${queue.tone}`}>
                <queue.icon className="h-3.5 w-3.5" />
                {queue.label}
                <span className="tabular-nums">({attention[queue.key].length})</span>
              </p>
              <ul className="mt-2 space-y-1.5">
                {attention[queue.key].slice(0, 4).map((record) => (
                  <li key={record.id}>
                    <Link href={recordHref(record)} className="flex flex-wrap items-baseline gap-x-2 text-sm hover:underline">
                      <span className="font-mono text-xs text-fg-muted">{record.number}</span>
                      <span className="min-w-0 flex-1 truncate font-medium text-fg">{record.title}</span>
                      <span className="text-xs text-fg-muted">{queue.detail(record)}</span>
                    </Link>
                  </li>
                ))}
                {attention[queue.key].length > 4 && (
                  <li className="text-xs text-fg-muted">and {attention[queue.key].length - 4} more</li>
                )}
              </ul>
            </div>
          ))}
      </div>
    </section>
  );
}

export type SalesRecordRow = {
  id: string; kind: string; number: string; title: string; status: string;
  customer_name: string; owner_name: string; currency: string; gross: string;
  document_date: string; updated_at: string;
};

const kindLabel: Record<string, string> = {
  enquiry: 'Enquiry', quote: 'Quotation', order: 'Sales order', project: 'Machine project',
};

/** Status colour follows meaning, so the same word reads alike across kinds. */
const statusTone: Record<string, string> = {
  draft: 'badge-gray', review: 'badge-amber', approved: 'badge-blue', sent: 'badge-blue',
  accepted: 'badge-green', confirmed: 'badge-green', active: 'badge-green', completed: 'badge-green',
  won: 'badge-green', qualified: 'badge-blue', quoted: 'badge-blue', on_hold: 'badge-amber',
  rejected: 'badge-red', lost: 'badge-red', cancelled: 'badge-red', expired: 'badge-red',
};

/** What has moved lately — the pipeline says how much, this says what. */
export function RecentRecords({ records }: { records: SalesRecordRow[] }) {
  if (records.length === 0) return null;
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h2 className="font-semibold text-fg">Recently updated</h2>
        <Link href="/sales" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">View all</Link>
      </div>
      <div className="divide-y divide-border">
        {records.slice(0, 6).map((record) => (
          <Link key={record.id} href={`/sales/${record.id}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-3 transition-colors hover:bg-surface-secondary">
            <span className="font-mono text-xs text-fg-muted">{record.number}</span>
            <span className="min-w-0 flex-1 truncate font-medium text-fg">{record.title}</span>
            <span className="hidden text-xs text-fg-muted sm:inline">{kindLabel[record.kind] ?? record.kind}</span>
            <span className="hidden text-sm text-fg-muted md:inline">{record.customer_name}</span>
            <span className={statusTone[record.status] ?? 'badge-gray'}>{record.status.replace(/_/g, ' ')}</span>
            <span className="w-32 text-right text-sm font-medium tabular-nums text-fg-secondary">
              {formatMoney(record.currency, record.gross)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

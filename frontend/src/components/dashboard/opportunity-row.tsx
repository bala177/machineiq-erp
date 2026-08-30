import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';
import type { OpportunityItem } from './types';

const STATUS_BORDER: Record<string, string> = {
  new:                   'border-l-sky-400',
  under_review:          'border-l-amber-400',
  feasibility_in_progress: 'border-l-orange-400',
  approved:              'border-l-emerald-500',
  rejected:              'border-l-red-400',
  converted_to_project:  'border-l-indigo-500',
};

export function OpportunityRow({ opp }: { opp: OpportunityItem }) {
  const border = STATUS_BORDER[opp.status] ?? 'border-l-slate-300';
  const customer = (opp.customerId as any)?.name ?? '—';
  const ownerName = opp.ownerId
    ? `${opp.ownerId.firstName} ${opp.ownerId.lastName}`
    : null;

  return (
    <Link href={`/opportunities/${opp._id}?ref=dashboard`} className="block">
      <div className={`flex items-center gap-2.5 rounded-xl border border-border border-l-4 ${border} bg-surface px-3 py-2.5 transition-all duration-200 hover:shadow-card-hover`}>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg truncate">{opp.title}</p>
          <p className="mt-0.5 truncate text-[13px] text-fg-muted">
            {customer}
            {ownerName && <> · {ownerName}</>}
            {opp.updatedAt && <> · {formatDate(opp.updatedAt)}</>}
          </p>
        </div>
        <StatusBadge status={opp.status} />
      </div>
    </Link>
  );
}

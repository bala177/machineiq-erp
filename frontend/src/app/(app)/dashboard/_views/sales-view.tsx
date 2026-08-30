import Link from 'next/link';
import { Tag, Eye, CheckCircle2, GitMerge } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { SectionLabel } from '@/components/dashboard/section-label';
import { OpportunityRow } from '@/components/dashboard/opportunity-row';
import type { OpportunityItem } from '@/components/dashboard/types';

const FUNNEL_STAGES = [
  { key: 'new',                    label: 'New',           bar: 'bg-sky-500',    href: '/opportunities?status=new' },
  { key: 'under_review',           label: 'Under Review',  bar: 'bg-amber-400',  href: '/opportunities?status=under_review' },
  { key: 'feasibility_in_progress',label: 'Feasibility',   bar: 'bg-orange-500', href: '/opportunities?status=feasibility_in_progress' },
  { key: 'approved',               label: 'Approved',      bar: 'bg-emerald-500',href: '/opportunities?status=approved' },
  { key: 'converted_to_project',   label: 'Converted',     bar: 'bg-indigo-500', href: '/opportunities?status=converted_to_project' },
];

interface Props {
  opportunities: OpportunityItem[];
}

export function SalesView({ opportunities }: Props) {
  const counts: Record<string, number> = {};
  opportunities.forEach((o) => { counts[o.status] = (counts[o.status] ?? 0) + 1; });
  const maxCount = Math.max(...Object.values(counts), 1);

  const totalOpps   = opportunities.length;
  const underReview = counts['under_review'] ?? 0;
  const approved    = counts['approved'] ?? 0;
  const converted   = counts['converted_to_project'] ?? 0;

  return (
    <div className="space-y-8 pb-8">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Total Inquiries"       value={totalOpps}   icon={<Tag          className="h-5 w-5" />} accent="blue"  href="/opportunities" />
        <KpiCard label="Under Review"     value={underReview} icon={<Eye          className="h-5 w-5" />} accent="amber" href="/opportunities?status=under_review" />
        <KpiCard label="Approved"         value={approved}    icon={<CheckCircle2 className="h-5 w-5" />} accent="green" href="/opportunities?status=approved" />
        <KpiCard label="Converted"        value={converted}   icon={<GitMerge     className="h-5 w-5" />} accent="violet" href="/opportunities?status=converted_to_project" />
      </div>

      {/* Machine Inquiries list + funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* All opps (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <SectionLabel>All Machine Inquiries</SectionLabel>
            <Link href="/opportunities" className="text-[15px] text-brand-600 hover:underline">View all</Link>
          </div>
          {opportunities.length === 0 ? (
            <p className="text-sm text-fg-muted">No machine inquiries yet.</p>
          ) : (
            <div className="space-y-2">
              {opportunities.map((opp) => <OpportunityRow key={opp._id} opp={opp} />)}
            </div>
          )}
        </div>

        {/* Funnel summary (2 cols) */}
        <div className="lg:col-span-2 card p-4">
          <div className="mb-4 text-xs font-semibold text-fg">Funnel Summary</div>
          <div className="space-y-3">
            {FUNNEL_STAGES.map((stage) => {
              const count = counts[stage.key] ?? 0;
              return (
                <Link key={stage.key} href={stage.href} className="block group">
                  <div className="mb-1 flex items-center justify-between text-[15px]">
                    <span className="text-fg-muted group-hover:text-fg transition-colors">{stage.label}</span>
                    <span className="font-semibold text-fg">{count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-tertiary">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${stage.bar}`}
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

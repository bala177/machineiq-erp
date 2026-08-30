import Link from 'next/link';
import { Building2, Tag, FileInput, CheckCircle2, GitMerge } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { OpportunityRow } from '@/components/dashboard/opportunity-row';
import type { ExecutiveDashboard, OpportunityItem } from '@/components/dashboard/types';

interface Props {
  data: ExecutiveDashboard;
  opportunities: OpportunityItem[];
}

const PRIORITY_TILES = [
  { key: 'critical', label: 'Critical', bg: 'bg-red-50',    text: 'text-red-600',    href: '/opportunities?priority=critical' },
  { key: 'high',     label: 'High',     bg: 'bg-orange-50', text: 'text-orange-600', href: '/opportunities?priority=high' },
  { key: 'medium',   label: 'Medium',   bg: 'bg-amber-50',  text: 'text-amber-600',  href: '/opportunities?priority=medium' },
  { key: 'low',      label: 'Low',      bg: 'bg-slate-50',  text: 'text-slate-500',  href: '/opportunities?priority=low' },
] as const;

const VERTICALS = [
  { key: 'foundry',      label: 'Foundry',      dot: 'bg-orange-400' },
  { key: 'machine_shop', label: 'Machine Shop',  dot: 'bg-sky-500' },
  { key: 'spm',          label: 'SPM',           dot: 'bg-violet-500' },
  { key: 'fabrication',  label: 'Fabrication',   dot: 'bg-emerald-500' },
] as const;

export function ExecutiveView({ data, opportunities }: Props) {
  const { opportunityPipeline } = data;
  const visibleOpportunities = opportunities.slice(0, 8);

  // Priority counts computed client-side
  const priorityCounts = PRIORITY_TILES.reduce<Record<string, number>>((acc, t) => {
    acc[t.key] = opportunities.filter(o => o.priority === t.key).length;
    return acc;
  }, {});

  // Vertical counts + max for bar width
  const verticalCounts = VERTICALS.reduce<Record<string, number>>((acc, v) => {
    acc[v.key] = opportunities.filter(o => o.machineVertical === v.key).length;
    return acc;
  }, {});
  const verticalMax = Math.max(...Object.values(verticalCounts), 1);
  const unclassified = opportunities.filter(o => !o.machineVertical || !VERTICALS.find(v => v.key === o.machineVertical)).length;

  return (
    <div className="space-y-6 pb-8">
      {/* KPI Strip — focus on Customers + Machine Inquiries */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Customers"    value={data.totalCustomers}              icon={<Building2    className="h-5 w-5" />} accent="violet" href="/customers" />
        <KpiCard label="Machine Inquiries" value={opportunities.length}            icon={<Tag          className="h-5 w-5" />} accent="amber"  href="/opportunities" />
        <KpiCard label="Approved"     value={opportunityPipeline.approved}     icon={<CheckCircle2 className="h-5 w-5" />} accent="green"  href="/opportunities?status=approved" />
        <KpiCard label="Converted"    value={opportunityPipeline.converted}    icon={<GitMerge     className="h-5 w-5" />} accent="blue"   href="/opportunities?status=converted_to_project" />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Recent machine inquiries (3 cols) */}
        <section className="card p-4 lg:col-span-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-fg">Recent Machine Inquiries</h2>
              <p className="mt-1 text-sm text-fg-muted">Latest activity in the pipeline.</p>
            </div>
            <Link href="/opportunities" className="text-sm font-medium text-brand-600 hover:underline">
              View all
            </Link>
          </div>

          {visibleOpportunities.length > 0 ? (
            <div className="mt-4 space-y-2">
              {visibleOpportunities.map((opp) => <OpportunityRow key={opp._id} opp={opp} />)}
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface-secondary/50 px-4 py-3">
              <FileInput className="h-4 w-4 shrink-0 text-fg-muted" />
              <p className="text-sm text-fg-muted">No machine inquiries yet.</p>
              <Link href="/opportunities/new" className="ml-auto shrink-0 text-xs font-medium text-brand-600 hover:underline">
                Add one
              </Link>
            </div>
          )}
        </section>

        {/* Breakdown widget (2 cols) */}
        <section className="card p-4 lg:col-span-2 space-y-5">

          {/* — Priority split — */}
          <div>
            <h2 className="text-base font-semibold text-fg">By Priority</h2>
            <p className="mt-0.5 text-sm text-fg-muted">Urgency across all stages.</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {PRIORITY_TILES.map((t) => (
                <Link key={t.key} href={t.href}
                  className={`rounded-xl ${t.bg} p-2.5 text-center transition-opacity hover:opacity-80`}>
                  <p className={`text-2xl font-bold ${t.text}`}>{priorityCounts[t.key] ?? 0}</p>
                  <p className={`mt-0.5 text-[11px] font-medium ${t.text} opacity-75`}>{t.label}</p>
                </Link>
              ))}
            </div>
          </div>

          <hr className="border-border" />

          {/* — Vertical distribution — */}
          <div>
            <h2 className="text-sm font-semibold text-fg">By Machine Vertical</h2>
            <p className="mt-0.5 text-xs text-fg-muted">Where the work is concentrated.</p>
            <div className="mt-3 space-y-2.5">
              {VERTICALS.map((v) => {
                const count = verticalCounts[v.key] ?? 0;
                const pct = (count / verticalMax) * 100;
                return (
                  <Link key={v.key} href={`/opportunities?vertical=${v.key}`} className="block group">
                    <div className="mb-1 flex items-center justify-between text-[12px]">
                      <span className="flex items-center gap-1.5 text-fg-muted group-hover:text-fg transition-colors">
                        <span className={`h-2 w-2 rounded-full ${v.dot}`} />
                        {v.label}
                      </span>
                      <span className="font-semibold text-fg">{count}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-tertiary">
                      <div className={`h-full rounded-full transition-all duration-500 ${v.dot}`} style={{ width: `${pct}%` }} />
                    </div>
                  </Link>
                );
              })}
              {unclassified > 0 && (
                <div className="flex items-center justify-between text-[12px] text-fg-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                    Other / Unset
                  </span>
                  <span className="font-semibold">{unclassified}</span>
                </div>
              )}
            </div>
          </div>

        </section>
      </div>
    </div>
  );
}

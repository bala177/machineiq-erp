import Link from 'next/link';
import { Package, Truck, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { SectionLabel } from '@/components/dashboard/section-label';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate } from '@/lib/utils';
import type { ProcurementDashboard, ExecutiveDashboard } from '@/components/dashboard/types';

const PROC_STATUS_LABELS: Record<string, string> = {
  pending_design_release: 'Pending Design',
  ready_for_procurement:  'Ready for PO',
  ordered:                'Ordered / PO Raised',
  received:               'Received',
  changed_after_release:  'Changed After Release',
};

const STATUS_BAR: Record<string, string> = {
  pending_design_release: 'bg-amber-400',
  ready_for_procurement:  'bg-emerald-500',
  ordered:                'bg-blue-500',
  received:               'bg-teal-500',
  changed_after_release:  'bg-red-500',
};

interface Props {
  procData: ProcurementDashboard;
  execData: ExecutiveDashboard | null;
}

export function ProcurementView({ procData, execData }: Props) {
  const { statusBreakdown, longLeadItems, changedAfterRelease } = procData;

  const pending  = statusBreakdown.find((s) => s._id === 'pending_design_release')?.count ?? 0;
  const ordered  = statusBreakdown.find((s) => s._id === 'ordered')?.count ?? 0;
  const received = statusBreakdown.find((s) => s._id === 'received')?.count ?? 0;
  const changed  = statusBreakdown.find((s) => s._id === 'changed_after_release')?.count ?? 0;
  const longLead = execData?.longLeadRisks ?? longLeadItems.length;

  const maxCount = Math.max(...statusBreakdown.map((s) => s.count), 1);

  return (
    <div className="space-y-8 pb-8">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard label="Pending Design"    value={pending}  icon={<Package      className="h-5 w-5" />} accent="amber" href="/procurement" />
        <KpiCard label="Ordered / PO"      value={ordered}  icon={<Truck        className="h-5 w-5" />} accent="blue"  href="/procurement" />
        <KpiCard label="Received"          value={received} icon={<CheckCircle2 className="h-5 w-5" />} accent="green" href="/procurement" />
        <KpiCard label="Long-Lead Risks"   value={longLead} icon={<AlertTriangle className="h-5 w-5" />} accent="red"  href="/procurement" />
        <KpiCard label="Changed After Rel" value={changed}  icon={<RefreshCw    className="h-5 w-5" />} accent="red"   href="/procurement" />
      </div>

      {/* Long-lead items + Changed after release */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Long-lead items */}
        <div>
          <SectionLabel>Long-Lead Risk Items</SectionLabel>
          {longLeadItems.length === 0 ? (
            <p className="text-sm text-fg-muted">No long-lead items.</p>
          ) : (
            <div className="card divide-y divide-border">
              {longLeadItems.map((item) => (
                <Link key={item._id} href="/procurement" className="block">
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-surface-secondary transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-fg truncate">{item.name}</p>
                      <p className="mt-0.5 text-[15px] text-fg-muted truncate">
                        {(item.projectId as any)?.name}
                        {(item.supplierId as any)?.name && <> · {(item.supplierId as any).name}</>}
                        {item.leadTimeWeeks != null && <> · {item.leadTimeWeeks}w lead</>}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Changed after release */}
        <div>
          <SectionLabel>Changed After Release</SectionLabel>
          {changedAfterRelease.length === 0 ? (
            <p className="text-sm text-fg-muted">No items changed after release.</p>
          ) : (
            <div className="card divide-y divide-border">
              {changedAfterRelease.map((item) => (
                <Link key={item._id} href="/procurement" className="block">
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-surface-secondary transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-fg truncate">{item.name}</p>
                      <p className="mt-0.5 text-[15px] text-fg-muted truncate">
                        {(item.projectId as any)?.name}
                        {item.updatedAt && <> · {formatDate(item.updatedAt)}</>}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modules ready for procurement */}
      {(execData?.modulesReadyForProcurement ?? 0) > 0 && (
        <div>
          <SectionLabel>Modules Ready for Procurement</SectionLabel>
          <div className="card p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-fg font-mono">{execData!.modulesReadyForProcurement}</p>
              <p className="text-xs text-fg-muted">modules ready to PO</p>
            </div>
            <Link href="/procurement" className="ml-auto text-sm font-semibold text-brand-600 hover:underline">
              View in Procurement →
            </Link>
          </div>
        </div>
      )}

      {/* Status breakdown */}
      <div>
        <SectionLabel>Status Breakdown</SectionLabel>
        <div className="card p-4">
          <div className="space-y-3">
            {statusBreakdown.map((s) => (
              <Link key={s._id} href={`/procurement?status=${s._id}`} className="block group">
                <div className="mb-1 flex items-center justify-between text-[15px]">
                  <span className="text-fg-muted group-hover:text-fg transition-colors">
                    {PROC_STATUS_LABELS[s._id] ?? s._id?.replace(/_/g, ' ')}
                  </span>
                  <span className="font-semibold text-fg">{s.count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-tertiary">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${STATUS_BAR[s._id] ?? 'bg-blue-500'}`}
                    style={{ width: `${(s.count / maxCount) * 100}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

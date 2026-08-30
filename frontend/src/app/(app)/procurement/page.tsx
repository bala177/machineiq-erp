'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { MetricCard } from '@/components/ui/metric-card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatDate } from '@/lib/utils';
import { ShoppingCart, Clock, AlertTriangle, Package } from 'lucide-react';

export default function ProcurementPage() {
  const [items, setItems] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    Promise.all([api.get<any[]>(`/procurement/items${statusFilter ? `?status=${statusFilter}` : ''}`), api.get<any>('/dashboard/procurement'), api.get<any[]>('/components')])
      .then(([items, dash, componentData]) => {
        setItems(items);
        setDashboard(dash);
        setComponents(componentData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  if (loading) return <LoadingSpinner />;

  const statusMap: Record<string, number> = {};
  dashboard?.statusBreakdown?.forEach((s: any) => {
    statusMap[s._id] = s.count;
  });

  const visibleComponents = components.filter((component) => component.designStatus === 'Released');
  const procurementActionable = visibleComponents.filter((component) => ['Ready', 'Ordered', 'Received'].includes(component.procurementStatus));
  const procurementBlockedComponents = components.filter((component) => component.designStatus !== 'Released');
  const assemblyBlockedComponents = components.filter((component) => component.procurementStatus !== 'Received');
  const longLeadComponents = components.filter((component) => component.longLeadRisk);

  const updateComponentStatus = async (componentId: string, payload: Record<string, string>) => {
    setLoading(true);
    try {
      await api.patch(`/components/${componentId}`, payload);
      const [itemData, dashboardData, componentData] = await Promise.all([api.get<any[]>(`/procurement/items${statusFilter ? `?status=${statusFilter}` : ''}`), api.get<any>('/dashboard/procurement'), api.get<any[]>('/components')]);
      setItems(itemData);
      setDashboard(dashboardData);
      setComponents(componentData);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Procurement" description="Track procurement readiness and ordering status" />

      {/* Dashboard metrics */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pending Release" value={statusMap['pending_design_release'] || 0} icon={<Clock className="h-5 w-5" />} accent="amber" />
        <MetricCard label="Ready" value={statusMap['ready_for_procurement'] || 0} icon={<Package className="h-5 w-5" />} accent="green" />
        <MetricCard label="Ordered" value={statusMap['ordered'] || 0} icon={<ShoppingCart className="h-5 w-5" />} accent="blue" />
        <MetricCard label="Changed After Release" value={statusMap['changed_after_release'] || 0} icon={<AlertTriangle className="h-5 w-5" />} accent="red" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Procurement Visible Components</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-fg">{visibleComponents.length}</p>
        </div>
        <div className="card border-l-4 border-l-amber-500 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">Blocking Procurement</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-amber-700">{procurementBlockedComponents.length}</p>
        </div>
        <div className="card border-l-4 border-l-red-500 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-500">Blocking Assembly</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-red-700">{assemblyBlockedComponents.length}</p>
        </div>
        <div className="card border-l-4 border-l-amber-400 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">Long-Lead Risks</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-amber-700">{longLeadComponents.length}</p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {['', 'pending_design_release', 'ready_for_procurement', 'ordered', 'received', 'changed_after_release'].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setLoading(true);
            }}
            className={`filter-pill ${statusFilter === s ? 'filter-pill-active' : 'filter-pill-inactive'}`}
          >
            {s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'All'}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<ShoppingCart className="h-10 w-10" />} title="No procurement items" />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-2 sm:hidden">
            {items.map((item) => (
              <div key={item._id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg">{item.name}</p>
                    <p className="mt-0.5 text-xs text-fg-tertiary">{item.supplierId?.name || 'No supplier'}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                {item.isLongLead && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-3 w-3" /> Long Lead
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block">
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="table-header">
                      <th>Item</th>
                      <th>Supplier</th>
                      <th>Lead Time</th>
                      <th>Expected Delivery</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item) => (
                      <tr key={item._id} className="table-row">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-fg">{item.name}</span>
                            {item.isLongLead && <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[16px] font-bold uppercase text-amber-700">Long Lead</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-fg-tertiary">{item.supplierId?.name || '—'}</td>
                        <td className="px-5 py-4 text-fg-tertiary">{item.estimatedLeadTimeDays ? `${item.estimatedLeadTimeDays}d` : '—'}</td>
                        <td className="px-5 py-4 text-fg-tertiary">{formatDate(item.expectedDeliveryDate)}</td>
                        <td className="px-5 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="card p-5">
          <h2 className="text-sm font-semibold text-fg">Component Procurement Queue</h2>
          {procurementActionable.length === 0 ? (
            <p className="mt-4 text-sm text-fg-tertiary">No released components are currently visible to procurement.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {procurementActionable.map((component) => (
                <div key={component._id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-fg">{component.name}</p>
                        <StatusBadge status={component.procurementStatus} />
                      </div>
                      <p className="mt-1 text-xs text-fg-tertiary">
                        Machine: {typeof component.machineId === 'string' ? component.machineId : component.machineId?.name || '—'} · Due: {formatDate(component.dueDate)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {component.procurementStatus === 'Ready' && (
                        <button onClick={() => updateComponentStatus(component._id, { procurementStatus: 'Ordered' })} className="btn-secondary text-xs">
                          Mark Ordered
                        </button>
                      )}
                      {component.procurementStatus === 'Ordered' && (
                        <button onClick={() => updateComponentStatus(component._id, { procurementStatus: 'Received' })} className="btn-secondary text-xs">
                          Mark Received
                        </button>
                      )}
                      {component.procurementStatus === 'Received' && component.assemblyStatus === 'Ready' && (
                        <button onClick={() => updateComponentStatus(component._id, { assemblyStatus: 'Installed' })} className="btn-secondary text-xs">
                          Mark Installed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card p-5">
          <h2 className="text-sm font-semibold text-fg">Blocked & Risk Components</h2>
          <div className="mt-4 space-y-3">
            {procurementBlockedComponents.length === 0 && assemblyBlockedComponents.length === 0 && longLeadComponents.length === 0 ? (
              <p className="text-sm text-fg-tertiary">No blocked or high-risk components right now.</p>
            ) : (
              [...procurementBlockedComponents, ...assemblyBlockedComponents.filter((component) => !procurementBlockedComponents.some((blocked) => blocked._id === component._id)), ...longLeadComponents.filter((component) => !procurementBlockedComponents.some((blocked) => blocked._id === component._id) && !assemblyBlockedComponents.some((blocked) => blocked._id === component._id))].map((component) => (
                <div key={component._id} className="rounded-lg bg-surface-secondary p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-fg">{component.name}</p>
                    <StatusBadge status={component.designStatus !== 'Released' ? component.designStatus : component.procurementStatus} />
                    {component.longLeadRisk && <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[16px] font-bold uppercase text-amber-700">Long Lead</span>}
                  </div>
                  <p className="mt-1 text-xs text-fg-tertiary">{component.blockerReason || (component.longLeadRisk ? `Lead time ${component.leadTimeWeeks || 0} weeks and not ordered yet` : 'Waiting on lifecycle progress')}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}

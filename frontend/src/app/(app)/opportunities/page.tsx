'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/utils';
import { Plus, FileInput, Building2, X, Pencil, Trash2, Search, ChevronDown } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: '',                      label: 'All Statuses' },
  { value: 'draft',                 label: 'Draft' },
  { value: 'new',                   label: 'New' },
  { value: 'under_review',          label: 'Under Review' },
  { value: 'feasibility_in_progress', label: 'Feasibility In Progress' },
  { value: 'approved',              label: 'Approved' },
  { value: 'rejected',              label: 'Rejected' },
  { value: 'converted_to_project',  label: 'Converted To Project' },
];

export default function OpportunitiesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const customerId   = searchParams.get('customerId')   || '';
  const customerName = searchParams.get('customerName') || '';

  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [total, setTotal]                 = useState(0);
  const [skip, setSkip]                   = useState(0);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState('');
  const [search, setSearch]               = useState('');
  const [deleteTarget, setDeleteTarget]   = useState<any | null>(null);
  const [deleteBusy, setDeleteBusy]       = useState(false);
  const [deleteError, setDeleteError]     = useState('');

  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const userRole              = user?.role || '';
  const canDeleteOpportunity  = userRole === 'admin' || userRole === 'manager';
  const canEditOpportunity    = (opp: any) =>
    ['sales', 'admin'].includes(userRole) &&
    ['draft', 'new', 'rejected'].includes(opp?.status);

  const fetchOpportunities = async (newSkip: number, replace: boolean) => {
    if (replace) setLoading(true); else setLoadingMore(true);
    const query = new URLSearchParams();
    query.set('limit', String(PAGE_SIZE));
    query.set('skip', String(newSkip));
    if (filter)     query.set('status',     filter);
    if (customerId) query.set('customerId', customerId);
    try {
      const res = await api.get<{ data: any[]; total: number }>(`/opportunities?${query.toString()}`);
      const rows = Array.isArray(res) ? res : (res.data ?? []);
      setTotal(Array.isArray(res) ? res.length : (res.total ?? rows.length));
      setOpportunities((prev) => replace ? rows : [...prev, ...rows]);
      setSkip(newSkip);
    } catch { /* keep current list */ }
    finally {
      if (replace) setLoading(false); else setLoadingMore(false);
    }
  };

  useEffect(() => {
    void fetchOpportunities(0, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, customerId]);

  const machineLabel = (opp: any) =>
    opp.machineVertical || opp.machineCategory || opp.machineType || '';

  const projId = (val: any) =>
    !val ? null : typeof val === 'string' ? val : (val._id ?? null);

  const visible = deferredSearch
    ? opportunities.filter((opp) =>
        opp.title?.toLowerCase().includes(deferredSearch) ||
        opp.customerId?.name?.toLowerCase().includes(deferredSearch) ||
        machineLabel(opp).toLowerCase().includes(deferredSearch),
      )
    : opportunities;

  const handleDeleteOpportunity = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    setDeleteError('');
    try {
      await api.delete(`/opportunities/${deleteTarget._id}`);
      setOpportunities((prev) => prev.filter((o) => o._id !== deleteTarget._id));
      setTotal((t) => Math.max(0, t - 1));
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete machine inquiry');
    } finally {
      setDeleteBusy(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <PageHeader
        title="Machine Inquiries"
        description="Machine request intake and feasibility tracking"
        actions={
          (userRole === 'admin' || userRole === 'sales') ? (
            <div className="flex items-center gap-2">
              <Link href="/customers" className="btn-secondary">
                <Building2 className="h-4 w-4" /> Customers
              </Link>
              <Link href="/opportunities/new" className="btn-primary">
                <Plus className="h-4 w-4" /> New Request
              </Link>
            </div>
          ) : undefined
        }
      />

      {/* Filter bar */}
      <div className="mb-6 card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input
              className="input-field pl-9 pr-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, customer, or machine type"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-fg-muted transition hover:bg-surface-tertiary hover:text-fg"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field lg:w-56"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Results + customer scope */}
          <div className="flex min-w-[200px] items-center justify-between rounded-2xl border border-border bg-surface-tertiary/40 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Results</p>
              <p className="mt-1 text-sm font-medium text-fg">
                {deferredSearch ? `${visible.length} match${visible.length === 1 ? '' : 'es'}` : `${opportunities.length} of ${total}`}
              </p>
            </div>
            {customerId ? (
              <div className="flex items-center gap-1 text-sm text-fg-muted">
                <span className="truncate max-w-[80px]">{customerName}</span>
                <Link href="/opportunities" className="rounded p-0.5 hover:text-fg">
                  <X className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <p className="text-sm text-fg-muted">All customers</p>
            )}
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<FileInput className="h-10 w-10" />}
          title="No machine inquiries found"
          description={search ? 'Try a different title, customer, or machine type.' : 'Create your first machine request to get started.'}
          action={
            <Link href="/opportunities/new" className="btn-primary">
              <Plus className="h-4 w-4" /> New Request
            </Link>
          }
        />
      ) : (
        <>
          {/* Mobile card view */}
          <div className="space-y-3 sm:hidden">
            {visible.map((opp) => (
              <div key={opp._id} className="card-hover p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Link href={`/opportunities/${opp._id}`} className="truncate text-sm font-semibold text-fg hover:text-brand-600">
                      {opp.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-fg-tertiary">{opp.customerId?.name}</p>
                    {opp.requestNo && (
                      <p className="font-mono text-[10px] text-fg-muted">{opp.requestNo}</p>
                    )}
                  </div>
                  <StatusBadge status={opp.status} />
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-fg-muted">
                  <span>Target: {formatDate(opp.deliveryTargetDate)}</span>
                  <span>{machineLabel(opp)}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                  <Link href={`/opportunities/${opp._id}`} className="btn-secondary px-3 py-2 text-xs">
                    Open
                  </Link>
                  {projId(opp.convertedProjectId) && (
                    <Link href={`/projects/${projId(opp.convertedProjectId)}`} className="btn-ghost px-3 py-2 text-xs font-mono">
                      {opp.convertedProjectId?.projectNo || 'Open Project'}
                    </Link>
                  )}
                  {canEditOpportunity(opp) && (
                    <Link href={`/opportunities/${opp._id}?tab=intake`} className="btn-ghost p-2" aria-label="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                  )}
                  {canDeleteOpportunity && (
                    <button
                      type="button"
                      onClick={() => { setDeleteError(''); setDeleteTarget(opp); }}
                      className="btn-ghost p-2 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
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
                      <th>Title</th>
                      <th>Customer</th>
                      <th>Machine / Vertical</th>
                      <th>Target Date</th>
                      <th>Status</th>
                      <th className="w-36" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visible.map((opp) => (
                      <tr key={opp._id} className="table-row">
                        <td className="px-5 py-4">
                          <Link href={`/opportunities/${opp._id}`} className="font-semibold text-fg hover:text-brand-600 transition-colors">
                            {opp.title}
                          </Link>
                          {opp.requestNo && (
                            <p className="mt-0.5 font-mono text-[11px] text-fg-muted">{opp.requestNo}</p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-fg-secondary">
                          {opp.customerId?._id ? (
                            <Link href={`/opportunities?customerId=${opp.customerId._id}&customerName=${encodeURIComponent(opp.customerId?.name || '')}`} className="hover:text-brand-600">
                              {opp.customerId?.name}
                            </Link>
                          ) : (
                            opp.customerId?.name || '—'
                          )}
                        </td>
                        <td className="px-5 py-4 text-fg-secondary">{machineLabel(opp) || '—'}</td>
                        <td className="px-5 py-4 text-fg-secondary">{formatDate(opp.deliveryTargetDate)}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <StatusBadge status={opp.status} />
                            {projId(opp.convertedProjectId) && opp.convertedProjectId?.projectNo && (
                              <Link
                                href={`/projects/${projId(opp.convertedProjectId)}`}
                                className="text-xs font-mono text-brand-600 hover:underline dark:text-brand-400 w-fit"
                              >
                                {opp.convertedProjectId.projectNo}
                              </Link>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <Link href={`/opportunities/${opp._id}`} className="btn-secondary px-3 py-2">
                              Open
                            </Link>
                            {projId(opp.convertedProjectId) && (
                              <Link href={`/projects/${projId(opp.convertedProjectId)}`} className="btn-ghost px-3 py-2">
                                Open Project
                              </Link>
                            )}
                            {canEditOpportunity(opp) && (
                              <Link href={`/opportunities/${opp._id}?tab=intake`} className="btn-ghost p-2" aria-label="Edit">
                                <Pencil className="h-4 w-4" />
                              </Link>
                            )}
                            {canDeleteOpportunity && (
                              <button
                                type="button"
                                onClick={() => { setDeleteError(''); setDeleteTarget(opp); }}
                                className="btn-ghost p-2 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20"
                                aria-label="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Load more */}
          {!deferredSearch && opportunities.length < total && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => void fetchOpportunities(skip + PAGE_SIZE, false)}
                disabled={loadingMore}
                className="btn-secondary gap-2"
              >
                {loadingMore ? 'Loading…' : (
                  <><ChevronDown className="h-4 w-4" /> Load more ({total - opportunities.length} remaining)</>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {deleteTarget && (
        <Modal title="Delete Machine Inquiry" onClose={() => !deleteBusy && setDeleteTarget(null)} size="md">
          <div className="space-y-4">
            <p className="text-sm text-fg-secondary">
              Delete <span className="font-semibold text-fg">{deleteTarget.title}</span>? This will remove it from the active pipeline.
            </p>
            {deleteError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleteBusy} className="btn-ghost">
                Cancel
              </button>
              <button type="button" onClick={() => void handleDeleteOpportunity()} disabled={deleteBusy} className="btn-danger">
                {deleteBusy ? 'Deleting…' : 'Delete Machine Inquiry'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

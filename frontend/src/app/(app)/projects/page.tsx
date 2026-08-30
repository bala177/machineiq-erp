'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { Plus, FolderKanban, ArrowUpRight, X, Trash2, Loader2 } from 'lucide-react';

export default function ProjectsPage() {
  const { user } = useAuth();
  const canManageProjects = user?.role === 'admin' || user?.role === 'manager';
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId') || '';
  const customerName = searchParams.get('customerName') || '';
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState('');
  const [toDelete, setToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/projects/${toDelete._id}`);
      setProjects((prev) => prev.filter((p) => p._id !== toDelete._id));
      setToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const query = new URLSearchParams();
    if (stageFilter) query.set('stage', stageFilter);
    if (customerId) query.set('customerId', customerId);
    api
      .get<any[]>(`/projects${query.toString() ? `?${query.toString()}` : ''}`)
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [stageFilter, customerId]);

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <PageHeader
        title="Projects"
        description="Active machine projects and their status"
        actions={
          canManageProjects ? (
            <Link href="/projects/new" className="btn-primary">
              <Plus className="h-4 w-4" /> New Project
            </Link>
          ) : undefined
        }
      />

      {customerId && (
        <div className="mb-6 card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-fg">Customer Filter Active</h2>
            <p className="mt-1 text-sm text-fg-muted">
              Showing projects linked to {customerName || 'the selected customer'}.
            </p>
          </div>
          <Link href="/projects" className="btn-ghost w-fit px-3 py-2 text-sm">
            <X className="h-4 w-4" />
            Clear filter
          </Link>
        </div>
      )}

      {/* Filter pills */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {['', 'inquiry', 'feasibility', 'concept_approved', 'engineering_in_progress', 'review_release', 'completed'].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStageFilter(s);
              setLoading(true);
            }}
            className={`filter-pill ${stageFilter === s ? 'filter-pill-active' : 'filter-pill-inactive'}`}
          >
            {s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'All'}
          </button>
        ))}
      </div>

      {projects.length === 0 ? (
        <EmptyState icon={<FolderKanban className="h-10 w-10" />} title="No projects found" description="Create your first project to get started" />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden">
            {projects.map((project) => (
              <Link key={project._id} href={`/projects/${project._id}`} className="card-hover block p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg">{project.name}</p>
                    {project.projectNo && (
                      <p className="font-mono text-[10px] text-fg-muted">{project.projectNo}</p>
                    )}
                    {project.customerId?._id ? (
                      <Link href={`/customers/${project.customerId._id}`} className="mt-0.5 block text-xs text-fg-tertiary hover:text-brand-600 transition-colors">
                        {project.customerId.name}
                      </Link>
                    ) : (
                      <p className="mt-0.5 text-xs text-fg-tertiary">{project.customerId?.name}</p>
                    )}
                  </div>
                  <StatusBadge status={project.health} />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <StatusBadge status={project.stage} size="sm" />
                  <span className="text-xs text-fg-muted">Due: {formatDate(project.targetDeliveryDate)}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block">
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="table-header">
                      <th>Project</th>
                      <th>Customer</th>
                      <th>PM</th>
                      <th>Stage</th>
                      <th>Health</th>
                      <th>Target Date</th>
                      <th className="w-10" />
                      {canManageProjects && <th className="w-10" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {projects.map((project) => (
                      <tr key={project._id} className="table-row">
                        <td className="px-5 py-4">
                          <Link href={`/projects/${project._id}`} className="font-semibold text-fg hover:text-brand-600 transition-colors">
                            {project.name}
                          </Link>
                          {project.projectNo && (
                            <p className="mt-0.5 font-mono text-[11px] text-fg-muted">{project.projectNo}</p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-fg-tertiary">
                          {project.customerId?._id ? (
                            <Link href={`/customers/${project.customerId._id}`} className="hover:text-brand-600 transition-colors">
                              {project.customerId.name}
                            </Link>
                          ) : (
                            project.customerId?.name || '—'
                          )}
                        </td>
                        <td className="px-5 py-4 text-fg-tertiary">
                          {project.projectManagerId?.firstName} {project.projectManagerId?.lastName}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={project.stage} />
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={project.health} />
                        </td>
                        <td className="px-5 py-4 text-fg-tertiary">{formatDate(project.targetDeliveryDate)}</td>
                        <td className="px-5 py-4">
                          <Link href={`/projects/${project._id}`} className="text-fg-muted hover:text-brand-600 transition-colors">
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </td>
                        {canManageProjects && (
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => { setDeleteError(''); setToDelete(project); }}
                              className="text-fg-muted hover:text-rose-600 transition-colors"
                              title="Delete project"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {toDelete && (
        <Modal title="Delete project?" onClose={() => !deleting && setToDelete(null)}>
          <p className="text-sm text-fg-secondary">
            Delete <span className="font-semibold text-fg">{toDelete.name}</span>? This soft-deletes the project and removes it from the list. Linked machines, tasks, and history are preserved in the audit trail.
          </p>
          {deleteError && (
            <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{deleteError}</div>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setToDelete(null)} disabled={deleting} className="btn-ghost">
              Cancel
            </button>
            <button type="button" onClick={handleDelete} disabled={deleting} className="btn-danger inline-flex items-center gap-2">
              {deleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</> : <><Trash2 className="h-4 w-4" /> Delete project</>}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

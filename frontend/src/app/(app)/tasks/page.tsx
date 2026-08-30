'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatDate, isOverdue } from '@/lib/utils';
import { ListChecks, AlertCircle, LayoutList, Columns3 } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState<'list' | 'kanban'>('list');

  useEffect(() => {
    const query = statusFilter ? `?status=${statusFilter}` : '';
    api
      .get<any[]>(`/tasks${query}`)
      .then(setTasks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  if (loading) return <LoadingSpinner />;

  const kanbanColumns = ['not_started', 'in_progress', 'waiting_for_input', 'under_review', 'blocked', 'released', 'closed'];

  return (
    <>
      <PageHeader
        title="Tasks"
        description="All tasks across projects"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-border bg-surface p-1 shadow-sm">
              <button onClick={() => setView('list')} className={clsx('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150', view === 'list' ? 'bg-brand-600 text-white shadow-sm' : 'text-fg-tertiary hover:text-fg-secondary hover:bg-surface-secondary')}>
                <LayoutList className="h-3.5 w-3.5" />
                List
              </button>
              <button onClick={() => setView('kanban')} className={clsx('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150', view === 'kanban' ? 'bg-brand-600 text-white shadow-sm' : 'text-fg-tertiary hover:text-fg-secondary hover:bg-surface-secondary')}>
                <Columns3 className="h-3.5 w-3.5" />
                Board
              </button>
            </div>
          </div>
        }
      />

      {tasks.length === 0 ? (
        <EmptyState icon={<ListChecks className="h-10 w-10" />} title="No tasks found" />
      ) : view === 'list' ? (
        <>
          {/* Mobile cards */}
          <div className="space-y-2 sm:hidden">
            {tasks.map((task) => (
              <div key={task._id} className={clsx('card-hover p-4', isOverdue(task.dueDate, task.status) && 'border-l-4 border-l-red-400')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg">{task.title}</p>
                    <p className="mt-0.5 text-xs text-fg-tertiary">
                      {task.ownerId?.firstName} {task.ownerId?.lastName} · {task.departmentId?.name}
                    </p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-fg-tertiary">
                  <span className={clsx(isOverdue(task.dueDate, task.status) && 'font-semibold text-red-600')}>
                    {isOverdue(task.dueDate, task.status) && <AlertCircle className="mr-0.5 inline h-3 w-3" />}
                    Due: {formatDate(task.dueDate)}
                  </span>
                  <StatusBadge status={task.priority} />
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
                      <th>Task</th>
                      <th>Owner</th>
                      <th>Department</th>
                      <th>Priority</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tasks.map((task) => (
                      <tr key={task._id} className={clsx('table-row', isOverdue(task.dueDate, task.status) && 'bg-red-50/40 dark:bg-red-950/20')}>
                        <td className="px-5 py-4 font-semibold text-fg">{task.title}</td>
                        <td className="px-5 py-4 text-fg-tertiary">
                          {task.ownerId?.firstName} {task.ownerId?.lastName}
                        </td>
                        <td className="px-5 py-4 text-fg-tertiary">{task.departmentId?.name || '—'}</td>
                        <td className="px-5 py-4">
                          <StatusBadge status={task.priority} />
                        </td>
                        <td className={clsx('px-5 py-4', isOverdue(task.dueDate, task.status) ? 'font-semibold text-red-600' : 'text-fg-tertiary')}>{formatDate(task.dueDate)}</td>
                        <td className="px-5 py-4">
                          <StatusBadge status={task.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Kanban Board */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col);
            return (
              <div key={col} className="flex w-64 shrink-0 flex-col sm:w-72">
                <div className="mb-3 flex items-center gap-2">
                  <StatusBadge status={col} size="md" />
                  <span className="rounded-full bg-surface-tertiary px-2 py-0.5 text-xs font-bold text-fg-muted">{colTasks.length}</span>
                </div>
                <div className="flex-1 space-y-2.5 rounded-2xl bg-surface-tertiary/60 p-2.5">
                  {colTasks.map((task) => (
                    <div key={task._id} className="card p-3.5 transition-all duration-200 hover:shadow-card-hover">
                      <p className="text-sm font-semibold text-fg">{task.title}</p>
                      <p className="mt-1.5 text-xs text-fg-tertiary">
                        {task.ownerId?.firstName} {task.ownerId?.lastName}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <StatusBadge status={task.priority} />
                        <span className={clsx('text-[15px] font-medium', isOverdue(task.dueDate, task.status) ? 'text-red-600' : 'text-fg-muted')}>{formatDate(task.dueDate)}</span>
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && <p className="py-8 text-center text-xs text-fg-muted">No tasks</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

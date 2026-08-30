import Link from 'next/link';
import { Clock, FolderKanban, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';
import type { AlertTask } from './types';

const PRIORITY_CFG: Record<string, string> = {
  critical: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  high:     'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  medium:   'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  low:      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export function AlertTaskRow({ task }: { task: AlertTask }) {
  const isBlocked = task.status === 'blocked';
  const isOverdue = !isBlocked && !!task.dueDate && new Date(task.dueDate) < new Date();
  const accentBg = isBlocked
    ? 'border-l-red-400 bg-red-50/30 dark:bg-red-950/10'
    : 'border-l-amber-400 bg-amber-50/30 dark:bg-amber-950/10';
  const priorityCls = PRIORITY_CFG[task.priority] ?? PRIORITY_CFG['low'];

  return (
    <Link href="/tasks?ref=dashboard" className="block">
      <div className={`flex flex-col gap-1.5 rounded-xl border border-border border-l-4 ${accentBg} p-3 transition-all duration-200 hover:shadow-card-hover`}>
        <div className="flex items-start justify-between gap-2">
          <span className="line-clamp-2 text-sm font-semibold leading-snug text-fg">{task.name || '—'}</span>
          {task.dueDate && (
            <div className={`flex flex-shrink-0 items-center gap-1 text-[13px] ${isOverdue || isBlocked ? 'text-red-500' : 'text-fg-muted'}`}>
              <Clock className="h-3 w-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={task.status} />
          {task.priority && (
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${priorityCls}`}>
              {task.priority}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-fg-muted">
          {task.projectId?.name && (
            <>
              <FolderKanban className="h-3 w-3" />
              <span>{task.projectId.name}</span>
            </>
          )}
          {task.ownerId && (
            <>
              <span className="text-fg-tertiary">·</span>
              <User className="h-3 w-3" />
              <span>{task.ownerId.firstName} {task.ownerId.lastName}</span>
            </>
          )}
          {task.departmentId?.name && (
            <>
              <span className="text-fg-tertiary">·</span>
              <span>{task.departmentId.name}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

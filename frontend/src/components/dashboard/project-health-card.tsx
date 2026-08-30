import Link from 'next/link';
import { CalendarDays, ListTodo, UserRound } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { ProjectSummary } from './types';

const HEALTH_CFG: Record<string, { label: string; dot: string; badge: string; bar: string; border: string }> = {
  healthy: { label: 'Healthy', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', bar: 'bg-emerald-500', border: 'border-l-emerald-500/70' },
  watch:   { label: 'Watch',   dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',   bar: 'bg-amber-400', border: 'border-l-amber-400/80' },
  at_risk: { label: 'At Risk', dot: 'bg-orange-500',  badge: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',  bar: 'bg-orange-500', border: 'border-l-orange-500/80' },
  delayed: { label: 'Delayed', dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',     bar: 'bg-red-500', border: 'border-l-red-500/80' },
};

function HealthBadge({ health }: { health: string }) {
  const cfg = HEALTH_CFG[health] ?? HEALTH_CFG['watch'];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[15px] font-semibold uppercase tracking-wide ${cfg.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function ProjectHealthCard({ project }: { project: ProjectSummary }) {
  const cfg = HEALTH_CFG[project.health] ?? HEALTH_CFG['watch'];
  const isOverdue = !!project.targetDeliveryDate && new Date(project.targetDeliveryDate) < new Date();
  const stageLabel = project.stage?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '';
  const pmName = project.projectManager
    ? `${project.projectManager.firstName[0]}. ${project.projectManager.lastName}`
    : null;

  return (
    <Link href={`/projects/${project._id}?ref=dashboard`} className="block">
      <div className={`card overflow-hidden border-l-4 ${cfg.border} transition-all duration-200 hover:shadow-card-hover`}>
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold leading-snug text-fg">{project.name}</h3>
              <p className="mt-1 truncate text-[13px] text-fg-muted">{project.customer ?? 'No customer assigned'}</p>
            </div>
            <HealthBadge health={project.health} />
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center justify-between gap-3 text-[12px] font-medium uppercase tracking-wide text-fg-muted">
                <span>Progress</span>
                <span className="font-semibold text-fg">{project.completionPct}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-tertiary">
                <div className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`} style={{ width: `${project.completionPct}%` }} />
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                {stageLabel}
              </span>
              {project.taskBlocked > 0 && (
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-700 dark:bg-red-950/30 dark:text-red-300">
                  {project.taskBlocked} blocked
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-fg-muted">
            {pmName && (
              <span className="inline-flex items-center gap-1">
                <UserRound className="h-3.5 w-3.5" />
                {pmName}
              </span>
            )}
            {project.targetDeliveryDate && (
              <span className={`inline-flex items-center gap-1 ${isOverdue ? 'font-semibold text-red-500' : ''}`}>
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(project.targetDeliveryDate)}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <ListTodo className="h-3.5 w-3.5" />
              {project.taskDone}/{project.taskTotal} tasks
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

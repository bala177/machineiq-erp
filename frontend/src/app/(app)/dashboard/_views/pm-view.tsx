import Link from 'next/link';
import {
  FolderKanban, Eye, ShieldAlert, Clock, ListTodo, CalendarDays, BarChart3,
} from 'lucide-react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { SectionLabel } from '@/components/dashboard/section-label';
import { ProjectHealthCard } from '@/components/dashboard/project-health-card';
import { AlertTaskRow } from '@/components/dashboard/alert-task-row';
import { GanttTimeline } from '@/components/dashboard/gantt-timeline';
import { StageProgressTrack } from '@/components/dashboard/stage-progress-track';
import type { ExecutiveDashboard } from '@/components/dashboard/types';

interface Props {
  data: ExecutiveDashboard;
}

export function PmView({ data }: Props) {
  const { projects, alertTasks } = data;
  const totalTasks   = projects.reduce((s, p) => s + p.taskTotal, 0);
  const doneTasks    = projects.reduce((s, p) => s + p.taskDone, 0);

  // Upcoming deadlines within 60 days
  const now    = new Date();
  const in60   = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const upcoming = projects
    .filter((p) => p.targetDeliveryDate && new Date(p.targetDeliveryDate) >= now && new Date(p.targetDeliveryDate) <= in60)
    .sort((a, b) => new Date(a.targetDeliveryDate!).getTime() - new Date(b.targetDeliveryDate!).getTime())
    .slice(0, 6);

  const taskRows = [
    { label: 'Completed',   value: doneTasks,        bar: 'bg-emerald-500', href: '/tasks?status=closed' },
    { label: 'In Progress', value: Math.max(0, totalTasks - doneTasks - data.blockedTasks), bar: 'bg-blue-500',   href: '/tasks?status=in_progress' },
    { label: 'Blocked',     value: data.blockedTasks, bar: 'bg-red-500',   href: '/tasks?status=blocked' },
    { label: 'Overdue',     value: data.overdueTasks, bar: 'bg-amber-400', href: '/tasks?overdue=true' },
  ];
  const maxVal = Math.max(...taskRows.map((r) => r.value), 1);

  return (
    <div className="space-y-8 pb-8">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard label="My Projects"  value={data.totalProjects} icon={<FolderKanban className="h-5 w-5" />} accent="blue"  href="/projects" />
        <KpiCard label="Watch"        value={data.watch}         icon={<Eye           className="h-5 w-5" />} accent="amber" href="/projects" />
        <KpiCard label="Blocked Tasks"value={data.blockedTasks}  icon={<ShieldAlert   className="h-5 w-5" />} accent="red"   href="/tasks?status=blocked" />
        <KpiCard label="Overdue Tasks"value={data.overdueTasks}  icon={<Clock         className="h-5 w-5" />} accent="amber" href="/tasks?overdue=true" />
        <KpiCard label="Total Tasks"  value={totalTasks}         icon={<ListTodo      className="h-5 w-5" />} accent="slate" href="/tasks" />
      </div>

      {/* Project health cards */}
      {projects.length > 0 && (
        <div>
          <SectionLabel>My Projects</SectionLabel>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {projects.map((p) => <ProjectHealthCard key={p._id} project={p} />)}
          </div>
        </div>
      )}

      {/* Gantt + Stage Progress */}
      {projects.length > 0 && (
        <>
          <div>
            <SectionLabel>Project Timeline — Gantt</SectionLabel>
            <GanttTimeline projects={projects} />
          </div>
          <div>
            <SectionLabel>Project Timeline — Stage Progress</SectionLabel>
            <StageProgressTrack projects={projects} />
          </div>
        </>
      )}

      {/* Task breakdown + Upcoming deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task breakdown */}
        <div className="card p-4">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-fg-muted" />
            <span className="text-xs font-semibold text-fg">Task Breakdown</span>
          </div>
          <div className="space-y-3">
            {taskRows.map((r) => (
              <Link key={r.label} href={r.href} className="block group">
                <div className="mb-1 flex items-center justify-between text-[15px]">
                  <span className="text-fg-muted group-hover:text-fg transition-colors">{r.label}</span>
                  <span className="font-semibold text-fg">{r.value}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-tertiary">
                  <div className={`h-full rounded-full ${r.bar}`} style={{ width: `${(r.value / maxVal) * 100}%` }} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming deadlines */}
        <div className="card p-4">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-fg-muted" />
            <span className="text-xs font-semibold text-fg">Upcoming Deadlines</span>
          </div>
          {upcoming.length > 0 ? (
            <div className="space-y-2.5">
              {upcoming.map((p) => {
                const daysLeft = Math.ceil((new Date(p.targetDeliveryDate!).getTime() - now.getTime()) / 86400000);
                return (
                  <Link key={p._id} href={`/projects/${p._id}`} className="flex items-center gap-2 group">
                    <span className="flex-1 truncate text-[15px] font-medium text-fg-secondary group-hover:text-brand-600 transition-colors">
                      {p.name}
                    </span>
                    <span className={`flex-shrink-0 text-[15px] font-semibold ${daysLeft <= 14 ? 'text-red-500' : 'text-fg-muted'}`}>
                      {daysLeft}d
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-[15px] text-fg-muted">No deadlines in the next 60 days.</p>
          )}
        </div>
      </div>

      {/* Alert tasks */}
      {alertTasks.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <SectionLabel>Overdue &amp; Blocked Tasks</SectionLabel>
            <span className="rounded-full bg-red-50 dark:bg-red-950/30 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:text-red-300">
              {alertTasks.length} alerts
            </span>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {alertTasks.map((t) => <AlertTaskRow key={t._id} task={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}

import Link from 'next/link';
import { ListTodo, Play, ShieldAlert, Clock, FolderKanban } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { SectionLabel } from '@/components/dashboard/section-label';
import { ProjectHealthCard } from '@/components/dashboard/project-health-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate } from '@/lib/utils';
import type { MyTask, DeptDashboard, ProjectSummary } from '@/components/dashboard/types';

const STATUS_COLORS: Record<string, string> = {
  not_started:      '#94a3b8',
  in_progress:      '#3b82f6',
  waiting_for_input:'#f59e0b',
  under_review:     '#8b5cf6',
  blocked:          '#ef4444',
  released:         '#10b981',
  closed:           '#64748b',
};

interface Props {
  tasks: MyTask[];
  deptDashboard: DeptDashboard | null;
  projects: ProjectSummary[];
}

export function EngineerView({ tasks, deptDashboard, projects }: Props) {
  const now = new Date();
  const myBlocked  = tasks.filter((t) => t.status === 'blocked').length;
  const myInProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const myOverdue  = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && !['closed','released'].includes(t.status)).length;

  // Sort: blocked first, then by due date
  const sorted = [...tasks].sort((a, b) => {
    if (a.status === 'blocked' && b.status !== 'blocked') return -1;
    if (b.status === 'blocked' && a.status !== 'blocked') return 1;
    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  // Donut data
  const statusCounts: Record<string, number> = {};
  tasks.forEach((t) => { statusCounts[t.status] = (statusCounts[t.status] ?? 0) + 1; });
  const donutEntries = Object.entries(statusCounts);
  const total = tasks.length || 1;
  let cumulativePct = 0;
  const donutSegments = donutEntries.map(([status, count]) => {
    const pct = (count / total) * 100;
    const segment = { status, count, pct, offset: cumulativePct };
    cumulativePct += pct;
    return segment;
  });

  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="space-y-8 pb-8">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="My Tasks"    value={tasks.length}  icon={<ListTodo   className="h-5 w-5" />} accent="blue"  href="/tasks?ownerId=me" />
        <KpiCard label="In Progress" value={myInProgress}  icon={<Play       className="h-5 w-5" />} accent="slate" href="/tasks?status=in_progress" />
        <KpiCard label="Blocked"     value={myBlocked}     icon={<ShieldAlert className="h-5 w-5" />} accent="red"   href="/tasks?status=blocked" />
        <KpiCard label="Overdue"     value={myOverdue}     icon={<Clock      className="h-5 w-5" />} accent="amber" href="/tasks?overdue=true" />
      </div>

      {/* My tasks + donut chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task list (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <SectionLabel>My Tasks</SectionLabel>
          {sorted.length === 0 ? (
            <p className="text-sm text-fg-muted">No tasks assigned to you.</p>
          ) : (
            <div className="space-y-2">
              {sorted.slice(0, 15).map((t) => {
                const overdue = !!t.dueDate && new Date(t.dueDate) < now && !['closed','released'].includes(t.status);
                return (
                  <Link key={t._id} href="/tasks" className="block">
                    <div className="card px-4 py-3 flex items-center gap-3 hover:shadow-card-hover transition-all">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-fg truncate">{t.name}</p>
                        <p className="mt-0.5 text-[15px] text-fg-muted truncate">
                          {t.projectId?.name}
                          {t.departmentId?.name && <> · {t.departmentId.name}</>}
                        </p>
                      </div>
                      <StatusBadge status={t.status} />
                      {t.dueDate && (
                        <span className={`text-[15px] flex-shrink-0 ${overdue ? 'text-red-500 font-semibold' : 'text-fg-muted'}`}>
                          {formatDate(t.dueDate)}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Donut chart (1 col) */}
        <div className="card p-4">
          <div className="mb-3 text-xs font-semibold text-fg">Task Status</div>
          {tasks.length > 0 ? (
            <>
              <div className="flex justify-center mb-4">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  {donutSegments.map((seg) => {
                    const dashArray = `${(seg.pct / 100) * circumference} ${circumference}`;
                    const rotation = -90 + (seg.offset / 100) * 360;
                    const color = STATUS_COLORS[seg.status] ?? '#94a3b8';
                    return (
                      <circle
                        key={seg.status}
                        cx="50" cy="50" r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="16"
                        strokeDasharray={dashArray}
                        strokeDashoffset="0"
                        transform={`rotate(${rotation} 50 50)`}
                      />
                    );
                  })}
                  <text x="50" y="54" textAnchor="middle" fontSize="16" fontWeight="bold" fill="currentColor" className="text-fg">
                    {tasks.length}
                  </text>
                </svg>
              </div>
              <div className="space-y-1.5">
                {donutSegments.map((seg) => (
                  <div key={seg.status} className="flex items-center gap-2 text-[15px]">
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[seg.status] ?? '#94a3b8' }} />
                    <span className="flex-1 text-fg-muted capitalize">{seg.status.replace(/_/g, ' ')}</span>
                    <span className="font-semibold text-fg">{seg.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-fg-muted">No tasks.</p>
          )}
        </div>
      </div>

      {/* Projects I'm on */}
      {projects.length > 0 && (
        <div>
          <SectionLabel>Projects I&apos;m On</SectionLabel>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {projects.map((p) => <ProjectHealthCard key={p._id} project={p} />)}
          </div>
        </div>
      )}

      {/* Department workload */}
      {deptDashboard && (
        <div>
          <SectionLabel>Department Workload</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total',        value: deptDashboard.totalTasks,  accent: 'slate' as const },
              { label: 'Due This Week',value: deptDashboard.dueThisWeek, accent: 'amber' as const },
              { label: 'Overdue',      value: deptDashboard.overdue,     accent: 'red' as const },
              { label: 'Blocked',      value: deptDashboard.blocked,     accent: 'red' as const },
            ].map((item) => (
              <div key={item.label} className="card p-4">
                <p className="text-[16px] font-semibold uppercase tracking-wider text-fg-muted">{item.label}</p>
                <p className="mt-1 text-2xl font-bold text-fg font-mono">{item.value}</p>
              </div>
            ))}
          </div>
          {deptDashboard.statusBreakdown.length > 0 && (
            <div className="mt-3 card p-4">
              <div className="flex items-center gap-2 mb-3">
                <FolderKanban className="h-4 w-4 text-fg-muted" />
                <span className="text-xs font-semibold text-fg">Status Breakdown</span>
              </div>
              <div className="space-y-2">
                {deptDashboard.statusBreakdown.map((s) => {
                  const maxCount = Math.max(...deptDashboard.statusBreakdown.map((x) => x.count), 1);
                  return (
                    <div key={s._id} className="flex items-center gap-2">
                      <span className="w-24 flex-shrink-0 truncate text-[15px] text-fg-muted capitalize">
                        {s._id?.replace(/_/g, ' ')}
                      </span>
                      <div className="flex-1 overflow-hidden rounded-full bg-surface-tertiary h-1.5">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${(s.count / maxCount) * 100}%` }} />
                      </div>
                      <span className="w-4 flex-shrink-0 text-right text-[15px] font-bold text-fg">{s.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

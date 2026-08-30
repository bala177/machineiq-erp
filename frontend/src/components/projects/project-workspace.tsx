'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { clsx } from 'clsx';
import { ArrowLeft, ArrowRight, BellRing, Building2, ChevronRight, FileInput, FileText, GitBranch, LayoutGrid, ListChecks, Package, RefreshCcw, ShieldCheck, Wrench } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { StageTrack } from '@/components/ui/stage-track';
import { AlertBanner } from '@/components/ui/alert-banner';
import { formatDate, formatStatus } from '@/lib/utils';
import { Isa88Tree, LevelPill } from '@/components/machines/isa88-tree';
import { Isa88Editor } from '@/components/machines/isa88-editor';
import { ModuleCoordinationPanel } from '@/components/projects/module-coordination-panel';

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'breakdown', label: 'Machine Architecture', icon: GitBranch },
  { id: 'tasks', label: 'Tasks', icon: ListChecks },
  { id: 'procurement', label: 'Procurement', icon: Package },
  { id: 'decisions', label: 'Decisions', icon: FileText },
] as const;
const stageFlow = ['inquiry', 'feasibility', 'concept_approved', 'engineering_in_progress', 'review_release', 'procurement_in_progress', 'build_assembly', 'fat_sat', 'completed'] as const;
type TabId = (typeof tabs)[number]['id'];

const PM_ROLES = new Set(['admin', 'manager']);

const HEALTH_OPTIONS = [
  { value: 'healthy',  label: 'Healthy' },
  { value: 'watch',    label: 'Watch' },
  { value: 'at_risk',  label: 'At Risk' },
  { value: 'delayed',  label: 'Delayed' },
];

const PRIORITY_OPTIONS = [
  { value: 'low',      label: 'Low' },
  { value: 'medium',   label: 'Medium' },
  { value: 'high',     label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export default function ProjectWorkspace() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const isPmRole = PM_ROLES.has(user?.role || '');
  const [tab, setTab] = useState<TabId>('overview');
  const [editingMachineId, setEditingMachineId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [data, setData] = useState<any>({ tasks: [], components: [], machines: [], modules: [], users: [], meta: null, procurementItems: [], decisions: [], documents: [] });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [stageSaving, setStageSaving] = useState(false);
  const [stageError, setStageError] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const [project, tasks, components, componentSummary, machines, modules, users, meta, procurementItems, decisions, documents] = await Promise.all([
      api.get<any>(`/projects/${params.id}`),
      api.get<any[]>(`/tasks?projectId=${params.id}`),
      api.get<any[]>(`/components?projectId=${params.id}`),
      api.get<any>(`/dashboard/project-components?projectId=${params.id}`),
      api.get<any[]>(`/machines?projectId=${params.id}`),
      api.get<any[]>(`/machines/projects/${params.id}/modules`),
      api.get<any[]>('/users'),
      api.get<any>('/meta/machine-architecture-enums'),
      api.get<any[]>(`/procurement/items?projectId=${params.id}`),
      api.get<any[]>(`/documents/decisions?projectId=${params.id}`),
      api.get<any[]>(`/documents?projectId=${params.id}`),
    ]);
    const machineTrees = await Promise.all((machines || []).map((machine: any) => api.get(`/machines/${machine._id}/tree`)));
    setData({ project, tasks, components, componentSummary, machines: machineTrees, modules, users, meta, procurementItems, decisions, documents });
    setSelectedModuleId((current) => current && modules.some((module: any) => module._id === current) ? current : modules[0]?._id || null);
  };

  useEffect(() => {
    load()
      .catch((err: any) => setError(err.message || 'Failed to load project workspace'))
      .finally(() => setLoading(false));
  }, [params.id]);

  const refreshMachines = async () => {
    const [machines, modules, components, componentSummary] = await Promise.all([
      api.get<any[]>(`/machines?projectId=${params.id}`),
      api.get<any[]>(`/machines/projects/${params.id}/modules`),
      api.get<any[]>(`/components?projectId=${params.id}`),
      api.get<any>(`/dashboard/project-components?projectId=${params.id}`),
    ]);
    const machineTrees = await Promise.all((machines || []).map((m: any) => api.get(`/machines/${m._id}/tree`)));
    setData((prev: any) => ({ ...prev, machines: machineTrees, modules, components, componentSummary }));
    setSelectedModuleId((current) => current && modules.some((module: any) => module._id === current) ? current : modules[0]?._id || null);
  };

  const project = data.project;
  const tasks = data.tasks || [];
  const components = data.components || [];
  const modules = data.modules || [];
  const users = data.users || [];
  const meta = data.meta;
  const summary = data.componentSummary;
  const blockedTasks = tasks.filter((task: any) => task.status === 'blocked');
  const overdueTasks = tasks.filter((task: any) => task.dueDate && !['closed', 'released', 'completed'].includes(task.status) && new Date(task.dueDate) < new Date());
  const blockedComponents = components.filter((component: any) => component.blockedByDependencies);
  const delayedComponents = components.filter((component: any) => component.isDelayed);
  const stageIndex = stageFlow.indexOf(project?.stage);
  // opportunityId is now populated — extract the raw ID string for use in hrefs
  const opportunityIdStr: string | null = project?.opportunityId
    ? (typeof project.opportunityId === 'object' ? (project.opportunityId as any)._id : project.opportunityId)
    : null;
  // Projects converted from an opportunity start at 'feasibility' — 'inquiry' was never entered
  const projectStartStage = opportunityIdStr ? 'feasibility' : 'inquiry';
  const projectStartIndex = stageFlow.indexOf(projectStartStage);
  const prevStage = stageIndex > projectStartIndex ? stageFlow[stageIndex - 1] : null;
  const nextStage = stageIndex >= 0 && stageIndex < stageFlow.length - 1 ? stageFlow[stageIndex + 1] : null;
  const owners = useMemo(() => {
    const seen = new Map<string, any>();
    tasks.forEach((task: any) => task.ownerId?._id && seen.set(task.ownerId._id, task.ownerId));
    return Array.from(seen.values());
  }, [tasks]);
  const [taskStatusFilter, setTaskStatusFilter] = useState('');
  const [taskOwnerFilter, setTaskOwnerFilter] = useState('');
  const filteredTasks = tasks.filter((task: any) => (!taskStatusFilter || task.status === taskStatusFilter) && (!taskOwnerFilter || task.ownerId?._id === taskOwnerFilter));
  const selectedModule = useMemo(() => modules.find((module: any) => module._id === selectedModuleId) || null, [modules, selectedModuleId]);
  const moduleMetaById = useMemo(
    () =>
      Object.fromEntries(
        modules.map((module: any) => [
          module._id,
          {
            ownerName: module.ownerName || (module.ownerId ? `${module.ownerId.firstName} ${module.ownerId.lastName}` : ''),
            plannedEndDate: module.plannedEndDate,
            status: module.status,
            blockerCount: module.blockerCount,
          },
        ]),
      ),
    [modules],
  );

  const runProjectAction = async (path: string) => {
    setSyncing(true);
    setError('');
    try {
      await api.post(path, {});
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to process workflow action');
    } finally {
      setSyncing(false);
    }
  };

  const updateProject = async (updates: { stage?: string; health?: string; priority?: string }) => {
    setStageSaving(true);
    setStageError('');
    try {
      await api.patch(`/projects/${params.id}`, updates);
      await load();
    } catch (err: any) {
      setStageError(err.message || 'Failed to update project');
    } finally {
      setStageSaving(false);
    }
  };

  const updateComponent = async (componentId: string, field: 'designStatus' | 'procurementStatus' | 'assemblyStatus', value: string) => {
    setSyncing(true);
    setError('');
    try {
      await api.patch(`/components/${componentId}`, { [field]: value });
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to update component');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <p className="text-sm text-fg-tertiary">Loading project workspace…</p>;
  if (!project) return <div className="card p-5 text-sm text-fg-tertiary">{error || 'Project not found.'}</div>;

  return (
    <>
      <PageHeader
        title={project.name}
        description={`${project.customerId?.name || 'No customer'} • ${project.description || 'Integrated project workspace'}`}
        actions={
          <>
            {opportunityIdStr && (
              <Link href={`/opportunities/${opportunityIdStr}`} className="btn-ghost text-xs">
                <FileInput className="h-3.5 w-3.5" /> Source Opp
              </Link>
            )}
            {project.customerId?._id && (
              <Link href={`/customers/${project.customerId._id}`} className="btn-ghost text-xs">
                <Building2 className="h-3.5 w-3.5" /> Customer
              </Link>
            )}
            <button onClick={() => runProjectAction(`/components/projects/${params.id}/sync`)} disabled={syncing} className="btn-secondary text-xs">
              <RefreshCcw className="h-3.5 w-3.5" /> Sync
            </button>
            <button onClick={() => runProjectAction(`/components/projects/${params.id}/process-reminders`)} disabled={syncing} className="btn-secondary text-xs">
              <BellRing className="h-3.5 w-3.5" /> Reminders
            </button>
            <Link href="/projects" className="btn-ghost">
              Back
            </Link>
          </>
        }
      />

      {error && <div className="mb-6 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>}

      <section className="card mb-6 overflow-hidden">
        <div className="border-b border-border bg-gradient-to-r from-surface-secondary via-surface to-brand-50/50 dark:to-brand-950/20 px-5 py-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={project.health} />
              <StatusBadge status={project.stage} />
              <StatusBadge status={project.priority} />
            </div>
            <div className="grid gap-3 text-sm text-fg-tertiary sm:grid-cols-2 xl:grid-cols-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">Customer</p>
                <p className="mt-1 font-medium text-fg">
                  {project.customerId?._id ? (
                    <Link href={`/customers/${project.customerId._id}`} className="hover:text-brand-600 transition-colors">
                      {project.customerId.name}
                    </Link>
                  ) : (
                    project.customerId?.name || '—'
                  )}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">PM</p>
                <p className="mt-1 font-medium text-fg">{project.projectManagerId ? `${project.projectManagerId.firstName} ${project.projectManagerId.lastName}` : '—'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">Start</p>
                <p className="mt-1 font-medium text-fg">{formatDate(project.startDate)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">Target</p>
                <p className="mt-1 font-medium text-fg">{formatDate(project.targetDeliveryDate)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">Team</p>
                <p className="mt-1 font-medium text-fg">{project.teamMembers?.length || 0} members</p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-border px-5 py-2.5">
          <StageTrack
            stages={[...stageFlow]}
            currentStage={stageIndex >= 0 ? project.stage : stageFlow[stageFlow.length - 1]}
            startStage={projectStartStage}
          />
        </div>

        {/* Stage / Health / Priority controls — PM/admin only */}
        {isPmRole && (
          <div className="border-t border-border bg-surface-secondary/40 px-5 py-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-muted">Stage</span>
              <button
                onClick={() => prevStage && updateProject({ stage: prevStage })}
                disabled={!prevStage || stageSaving}
                className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-fg-secondary hover:bg-surface-secondary disabled:opacity-30 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" /> {prevStage ? formatStatus(prevStage) : 'Start'}
              </button>
              <span className="rounded-full bg-brand-100 dark:bg-brand-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700 dark:text-brand-400">
                {formatStatus(project.stage)}
              </span>
              <button
                onClick={() => nextStage && updateProject({ stage: nextStage })}
                disabled={!nextStage || stageSaving}
                className="flex items-center gap-1 rounded-lg border border-brand-300 dark:border-brand-800 bg-brand-50 dark:bg-brand-950/30 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-950/50 disabled:opacity-30 transition-colors"
              >
                {nextStage ? formatStatus(nextStage) : 'Done'} <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-muted">Health</span>
              <select
                value={project.health}
                onChange={(e) => updateProject({ health: e.target.value })}
                disabled={stageSaving}
                className="input-field py-1 text-xs"
              >
                {HEALTH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-muted ml-2">Priority</span>
              <select
                value={project.priority}
                onChange={(e) => updateProject({ priority: e.target.value })}
                disabled={stageSaving}
                className="input-field py-1 text-xs"
              >
                {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {stageError && (
              <p className="w-full text-xs text-red-600 dark:text-red-400">{stageError}</p>
            )}
          </div>
        )}
      </section>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Active Blockers</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-red-700">{blockedTasks.length + blockedComponents.length}</p>
          <p className="mt-1 text-xs text-fg-tertiary">{blockedTasks.length} tasks · {blockedComponents.length} components</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Overdue Tasks</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-amber-700">{overdueTasks.length}</p>
          <p className="mt-1 text-xs text-fg-tertiary">Past due date</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Ready for Procurement</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-700">{summary?.modulesReadyForProcurement ?? modules.filter((module: any) => module.status === 'ready_for_procurement').length}</p>
          <p className="mt-1 text-xs text-fg-tertiary">of {summary?.totalModules ?? modules.length} modules</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Long-Lead Risks</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-amber-700">{summary?.longLeadRisks ?? modules.reduce((total: number, module: any) => total + (module.longLeadRiskCount || 0), 0)}</p>
          <p className="mt-1 text-xs text-fg-tertiary">Items at delivery risk</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-border">
        {tabs.map((item) => (
          <button key={item.id} onClick={() => setTab(item.id)} className={clsx('inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors', tab === item.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-fg-muted hover:text-fg')}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <section className="space-y-6">

            {/* Opportunity assessment context — shown only when project was converted */}
            {project.opportunityId && typeof project.opportunityId === 'object' && (
              <div className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-fg-muted" />
                    <h2 className="text-sm font-semibold text-fg">Feasibility Assessment</h2>
                    <span className="rounded-full bg-surface-secondary border border-border px-2 py-0.5 text-[10px] font-semibold text-fg-muted">
                      from source inquiry
                    </span>
                  </div>
                  <Link
                    href={`/opportunities/${(project.opportunityId as any)._id}`}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 shrink-0"
                  >
                    {(project.opportunityId as any).requestNo || 'View inquiry'} →
                  </Link>
                </div>

                {/* Rating pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {[
                    { label: 'Feasibility', value: (project.opportunityId as any).feasibilityRating },
                    { label: 'Complexity',  value: (project.opportunityId as any).complexityRating },
                    { label: 'Risk',        value: (project.opportunityId as any).riskRating },
                    { label: 'Budget',      value: (project.opportunityId as any).budgetAlignment },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-surface-secondary px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-fg-muted">{label}</p>
                      <p className="mt-1 text-xs font-semibold text-fg">{value ? formatStatus(value) : '—'}</p>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Feasibility notes', value: (project.opportunityId as any).feasibilityNotes },
                    { label: 'Complexity notes',  value: (project.opportunityId as any).complexityNotes },
                    { label: 'Risk notes',        value: (project.opportunityId as any).riskNotes },
                  ].filter((f) => f.value?.trim()).map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-fg-muted mb-1">{label}</p>
                      <p className="text-xs text-fg-secondary leading-relaxed">{value}</p>
                    </div>
                  ))}
                </div>

                {!(project.opportunityId as any).feasibilityNotes &&
                 !(project.opportunityId as any).complexityNotes &&
                 !(project.opportunityId as any).riskNotes && (
                  <p className="text-xs text-fg-muted italic">No review notes were recorded on the source inquiry.</p>
                )}
              </div>
            )}

            <div className="card p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-fg">Health Snapshot</h2>
                <button onClick={() => setTab('breakdown')} className="text-xs font-medium text-brand-600 hover:text-brand-700">
                  Open machine architecture →
                </button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-surface-secondary px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">Total Modules</p>
                  <p className="mt-1 text-lg font-bold text-fg">{summary?.totalModules ?? modules.length}</p>
                </div>
                <div className="rounded-lg bg-surface-secondary px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">Blocked Modules</p>
                  <p className="mt-1 text-lg font-bold text-red-700">{summary?.blockedModules ?? modules.filter((m: any) => m.status === 'blocked').length}</p>
                </div>
                <div className="rounded-lg bg-surface-secondary px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">Blocked Components</p>
                  <p className="mt-1 text-lg font-bold text-red-700">{blockedComponents.length}</p>
                </div>
                <div className="rounded-lg bg-surface-secondary px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">Delayed Components</p>
                  <p className="mt-1 text-lg font-bold text-amber-700">{delayedComponents.length}</p>
                </div>
                <div className="rounded-lg bg-surface-secondary px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">Blocking Procurement</p>
                  <p className="mt-1 text-lg font-bold text-orange-700">{summary?.componentsBlockingProcurement ?? 0}</p>
                </div>
                <div className="rounded-lg bg-surface-secondary px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">Blocking Assembly</p>
                  <p className="mt-1 text-lg font-bold text-rose-700">{summary?.componentsBlockingAssembly ?? 0}</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-fg">Milestones</h2>
              <div className="mt-4 space-y-3">
                {project.milestones?.length ? (
                  project.milestones.map((milestone: any, index: number) => (
                    <div key={`${milestone.title}-${index}`} className="rounded-xl border border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-fg">{milestone.title}</p>
                          <p className="mt-1 text-xs text-fg-tertiary">
                            Target {formatDate(milestone.targetDate)} • Actual {formatDate(milestone.actualDate)}
                          </p>
                        </div>
                        <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', milestone.completed ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 'bg-surface-tertiary text-fg-tertiary')}>{milestone.completed ? 'Completed' : 'Open'}</span>
                      </div>
                      <p className="mt-3 text-sm text-fg-secondary">{milestone.notes || 'No notes yet.'}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-fg-tertiary">No milestones recorded yet.</p>
                )}
              </div>
            </div>
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-fg">Kickoff Summary</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Date</p>
                  <p className="mt-1 text-sm text-fg-secondary">{formatDate(project.kickoff?.date)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Attendees</p>
                  <p className="mt-1 text-sm text-fg-secondary">
                    {project.kickoff?.attendees?.length
                      ? project.kickoff.attendees
                          .map((item: any) => {
                            const first = (item?.firstName || '').trim();
                            const last = (item?.lastName || '').trim();
                            const full = `${first} ${last}`.trim();
                            return full || item?.email || 'Unknown';
                          })
                          .join(', ')
                      : 'No attendees logged'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Decisions</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-fg-secondary">{project.kickoff?.decisions?.length ? project.kickoff.decisions.join('\n') : 'No kickoff decisions logged'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Risks</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-fg-secondary">{project.kickoff?.risks?.length ? project.kickoff.risks.join('\n') : 'No kickoff risks logged'}</p>
                </div>
              </div>
            </div>
          </section>
          <section className="space-y-6">
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-fg">Active Blockers</h2>
              <div className="mt-4 space-y-3">
                {blockedTasks.length === 0 && blockedComponents.length === 0 ? (
                  <p className="text-sm text-fg-tertiary">No active blockers right now.</p>
                ) : (
                  <div className="space-y-2">
                    {blockedTasks.map((task: any) => (
                      <AlertBanner key={task._id} variant="error" title={task.title} body={`Owner: ${task.ownerId?.firstName ?? ''} ${task.ownerId?.lastName ?? ''} · Due ${formatDate(task.dueDate)}`} />
                    ))}
                    {blockedComponents.map((component: any) => (
                      <AlertBanner key={component._id} variant="warning" title={component.name} body={component.blockerReason || 'Waiting on dependency resolution'} />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-fg">Machine Health</h2>
              <div className="mt-4 space-y-3">
                {summary?.machineBreakdown?.length ? (
                  summary.machineBreakdown.map((machine: any) => (
                    <div key={machine._id} className="rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-fg">{machine.machineName}</p>
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">{machine.totalComponents} comps</span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-fg-tertiary">
                        <div>
                          Completed: <span className="font-semibold text-emerald-700">{machine.completedComponents}</span>
                        </div>
                        <div>
                          Pending: <span className="font-semibold text-fg">{machine.pendingComponents}</span>
                        </div>
                        <div>
                          Procurement blockers: <span className="font-semibold text-amber-700">{machine.blockingProcurement}</span>
                        </div>
                        <div>
                          Assembly blockers: <span className="font-semibold text-red-700">{machine.blockingAssembly}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-fg-tertiary">No machine component metrics available yet.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {tab === 'breakdown' && (
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="text-base font-semibold text-fg">Machine Architecture (ISA-88)</h2>
            <p className="mt-1 text-sm text-fg-tertiary">
              Define and coordinate the project hierarchy: <span className="font-medium text-fg">Machine → Unit → Equipment Module → Control Module → Component</span>. Use the editor to build the structure, then pick a module on the right to manage design-to-procurement coordination.
            </p>
          </div>
          <section className="space-y-5">
            {data.machines.length === 0 ? (
              <EmptyState icon={<Wrench className="h-10 w-10" />} title="No machine architecture defined" description="Add machines, units, equipment modules, and control modules to structure execution." />
            ) : (
              data.machines.map((machine: any) => {
                const isEditing = editingMachineId === machine._id;
                return (
                  <section key={machine._id} className="card overflow-hidden">
                    <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                      <div>
                        <h2 className="text-base font-semibold text-fg">{machine.name}</h2>
                        <div className="mt-1 flex items-center gap-2">
                          <LevelPill level="unit" />
                          <LevelPill level="em" />
                          <LevelPill level="cm" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {machine.units?.length > 0 && (
                          <span className="text-xs text-fg-muted">
                            {machine.units.length} unit{machine.units.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        <div className="flex overflow-hidden rounded-lg border border-border">
                          <button
                            onClick={() => setEditingMachineId(null)}
                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                              !isEditing ? 'bg-brand-600 text-white' : 'text-fg-secondary hover:bg-surface-tertiary'
                            }`}
                          >
                            View
                          </button>
                          <button
                            onClick={() => setEditingMachineId(machine._id)}
                            className={`border-l border-border px-3 py-1.5 text-xs font-medium transition-colors ${
                              isEditing ? 'bg-brand-600 text-white' : 'text-fg-secondary hover:bg-surface-tertiary'
                            }`}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      {isEditing ? (
                        <Isa88Editor machineId={machine._id} tree={machine} onUpdate={refreshMachines} />
                      ) : (
                        <Isa88Tree tree={machine} moduleMeta={moduleMetaById} />
                      )}
                    </div>
                  </section>
                );
              })
            )}
          </section>

          <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
            <div className="space-y-3">
              {modules.length === 0 ? (
                <EmptyState icon={<GitBranch className="h-8 w-8" />} title="No modules yet" description="Create modules in the machine tree to begin design-to-procurement coordination." />
              ) : (
                modules.map((module: any) => {
                  const ownerName = module.ownerName || (module.ownerId ? `${module.ownerId.firstName} ${module.ownerId.lastName}` : 'Unassigned');
                  const initials = ownerName
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part: string) => part[0]?.toUpperCase())
                    .join('');
                  return (
                    <button
                      key={module._id}
                      onClick={() => setSelectedModuleId(module._id)}
                      className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                        selectedModuleId === module._id ? 'border-brand-300 bg-brand-50/70 dark:border-brand-900 dark:bg-brand-950/20' : 'border-border bg-surface hover:bg-surface-secondary'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-fg">{module.name}</p>
                          <p className="mt-1 text-xs text-fg-tertiary">{module.machineName}</p>
                        </div>
                        <StatusBadge status={module.status} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-fg-tertiary">
                        <span className="rounded-full bg-surface-secondary px-2 py-1 font-semibold text-fg">{initials || 'NA'}</span>
                        <span>{formatDate(module.plannedEndDate)}</span>
                        <span>{module.blockerCount} blockers</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <ModuleCoordinationPanel
              module={selectedModule}
              meta={meta}
              users={users}
              projectId={params.id}
              projectTasks={tasks}
              onRefresh={refreshMachines}
            />
          </section>
        </div>
      )}

      {tab === 'tasks' && (
        <section className="card p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-fg">Execution Tasks</h2>
              <p className="mt-1 text-sm text-fg-tertiary">Track engineering work, blockers, and review readiness inside the project.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <select value={taskStatusFilter} onChange={(e) => setTaskStatusFilter(e.target.value)} className="input-field">
                <option value="">All Status</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_for_input">Waiting for Input</option>
                <option value="under_review">Under Review</option>
                <option value="blocked">Blocked</option>
                <option value="released">Released</option>
                <option value="closed">Closed</option>
              </select>
              <select value={taskOwnerFilter} onChange={(e) => setTaskOwnerFilter(e.target.value)} className="input-field">
                <option value="">All Owners</option>
                {owners.map((owner) => (
                  <option key={owner._id} value={owner._id}>
                    {owner.firstName} {owner.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {filteredTasks.length ? (
              filteredTasks.map((task: any) => (
                <div key={task._id} className={clsx('rounded-xl border p-4', task.status === 'blocked' ? 'border-red-200 dark:border-red-800 bg-red-50/70 dark:bg-red-950/20' : 'border-border bg-surface')}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-fg">{task.title}</p>
                    <StatusBadge status={task.status} />
                    <StatusBadge status={task.priority} />
                  </div>
                  <p className="mt-2 text-xs text-fg-tertiary">
                    Owner {task.ownerId?.firstName} {task.ownerId?.lastName} • Department {task.departmentId?.name || '—'} • Due {formatDate(task.dueDate)}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState icon={<ListChecks className="h-8 w-8" />} title="No tasks match the current filters" description="Adjust the filters to see more work items." />
            )}
          </div>
        </section>
      )}

      {tab === 'procurement' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Released to Procurement</p>
              <p className="mt-2 text-3xl font-bold text-fg">{components.filter((component: any) => component.designStatus === 'Released').length}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">Pending Release</p>
              <p className="mt-2 text-3xl font-bold text-amber-700">{components.filter((component: any) => component.designStatus !== 'Released').length}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Ordered</p>
              <p className="mt-2 text-3xl font-bold text-blue-700">{components.filter((component: any) => component.procurementStatus === 'Ordered').length}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">Received</p>
              <p className="mt-2 text-3xl font-bold text-emerald-700">{components.filter((component: any) => component.procurementStatus === 'Received').length}</p>
            </div>
          </div>
          <section className="card overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-fg">Component Procurement Queue</h2>
            </div>
            <div className="space-y-3 p-5">
              {components.map((component: any) => (
                <div key={component._id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-fg">{component.name}</p>
                          <StatusBadge status={component.designStatus} />
                          <StatusBadge status={component.procurementStatus} />
                          {component.designStatus !== 'Released' && <StatusBadge status="blocked" />}
                        </div>
                        <p className="mt-2 text-xs text-fg-tertiary">
                          Machine {typeof component.machineId === 'string' ? component.machineId : component.machineId?.name || '—'} • Due {formatDate(component.dueDate)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                      {component.designStatus === 'Released' && component.procurementStatus === 'Ready' && (
                        <button onClick={() => updateComponent(component._id, 'procurementStatus', 'Ordered')} disabled={syncing} className="btn-secondary text-xs">
                          Mark Ordered
                        </button>
                      )}
                      {component.procurementStatus === 'Ordered' && (
                        <button onClick={() => updateComponent(component._id, 'procurementStatus', 'Received')} disabled={syncing} className="btn-secondary text-xs">
                          Mark Received
                        </button>
                      )}
                      {component.procurementStatus === 'Received' && component.assemblyStatus === 'Ready' && (
                        <button onClick={() => updateComponent(component._id, 'assemblyStatus', 'Installed')} disabled={syncing} className="btn-secondary text-xs">
                          Mark Installed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="card p-5">
            <h2 className="text-sm font-semibold text-fg">Procurement Items</h2>
            <div className="mt-4 space-y-3">
              {data.procurementItems.length ? (
                data.procurementItems.map((item: any) => (
                  <div key={item._id} className="rounded-xl border border-border p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-fg">{item.name}</p>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="mt-2 text-xs text-fg-tertiary">
                          Supplier {item.supplierId?.name || '—'} • Lead time {item.estimatedLeadTimeDays ? `${item.estimatedLeadTimeDays}d` : '—'} • Expected {formatDate(item.expectedDeliveryDate)}
                        </p>
                      </div>
                      {item.isLongLead && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Long Lead</span>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-fg-tertiary">No procurement items logged for this project yet.</p>
              )}
            </div>
          </section>
        </div>
      )}

      {tab === 'decisions' && (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-fg">Decision Log</h2>
              <span className="text-xs text-fg-muted">{data.decisions.length} records</span>
            </div>
            <div className="mt-4 space-y-4">
              {data.decisions.length ? (
                data.decisions.map((decision: any) => (
                  <div key={decision._id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-fg">{decision.title}</p>
                        <p className="mt-2 text-sm text-fg-secondary">{decision.decision}</p>
                        {decision.rationale && <p className="mt-2 text-xs italic text-fg-tertiary">{decision.rationale}</p>}
                      </div>
                      <span className="text-xs text-fg-muted">{formatDate(decision.createdAt)}</span>
                    </div>
                    <p className="mt-3 text-xs text-fg-tertiary">
                      By {decision.madeBy?.firstName} {decision.madeBy?.lastName}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState icon={<FileText className="h-8 w-8" />} title="No decisions recorded" description="Decision entries for this project will appear here." />
              )}
            </div>
          </section>
          <section className="space-y-6">
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-fg">Project Documents</h2>
              <div className="mt-4 space-y-3">
                {data.documents.length ? (
                  data.documents.map((document: any) => (
                    <div key={document._id} className="rounded-xl border border-border p-4">
                      <p className="text-sm font-semibold text-fg">{document.title}</p>
                      <p className="mt-2 text-xs text-fg-tertiary">
                        Uploaded by {document.uploadedBy?.firstName} {document.uploadedBy?.lastName} • {formatDate(document.createdAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-fg-tertiary">No project documents uploaded yet.</p>
                )}
              </div>
            </div>
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-fg">Governance Snapshot</h2>
              <div className="mt-4 space-y-3 text-sm text-fg-tertiary">
                <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-secondary px-3 py-2">
                  <span>Kickoff Decisions</span>
                  <span className="font-semibold text-fg">{project.kickoff?.decisions?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-secondary px-3 py-2">
                  <span>Decision Log Entries</span>
                  <span className="font-semibold text-fg">{data.decisions.length}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-secondary px-3 py-2">
                  <span>Documents</span>
                  <span className="font-semibold text-fg">{data.documents.length}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

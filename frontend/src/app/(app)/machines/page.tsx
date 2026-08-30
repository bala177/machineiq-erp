'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate } from '@/lib/utils';
import { Factory, Plus, Wrench } from 'lucide-react';
import { Isa88Tree, LevelPill, type MachineTreeNode } from '@/components/machines/isa88-tree';
import { Isa88Editor } from '@/components/machines/isa88-editor';

/* ─── Types ──────────────────────────────────────────────────────────── */

type TabKey = 'overview' | 'structure' | 'components' | 'procurement' | 'assembly';
type User = { _id: string; firstName: string; lastName: string; role?: string };
type Project = { _id: string; name: string };

type Machine = {
  _id: string; name: string; projectId?: Project;
  unitCount: number; componentCount: number; delayedCount: number;
  designProgress: number; procurementProgress: number; assemblyProgress: number;
};

type ComponentRecord = {
  _id: string; name: string; discipline?: string; dueDate?: string; isDelayed: boolean;
  designStatus: string; procurementStatus: string; assemblyStatus: string;
  ownerId?: User | null;
  unitId?: { name: string } | null;
  equipmentModuleId?: { name: string } | null;
  controlModuleId?: { name: string } | null;
};

type MachineTree = MachineTreeNode & { projectId?: Project };
type MachineStats = {
  units: number; equipmentModules: number; controlModules: number;
  components: number; delayed: number;
  designProgress: number; procurementProgress: number; assemblyProgress: number;
};
type Meta = { disciplines: string[]; designStatuses: string[]; procurementStatuses: string[]; assemblyStatuses: string[] };

const tabs: TabKey[] = ['overview', 'structure', 'components', 'procurement', 'assembly'];

/* ─── Page ───────────────────────────────────────────────────────────── */

export default function MachinesPage() {
  const { user } = useAuth();
  const canWrite = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'designer';
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [projectId, setProjectId] = useState('');
  const [machineId, setMachineId] = useState('');
  const [tree, setTree] = useState<MachineTree | null>(null);
  const [stats, setStats] = useState<MachineStats | null>(null);
  const [components, setComponents] = useState<ComponentRecord[]>([]);
  const [tab, setTab] = useState<TabKey>('overview');
  const [structureMode, setStructureMode] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [machineName, setMachineName] = useState('');
  const [componentForm, setComponentForm] = useState({
    name: '', discipline: '', ownerId: '', dueDate: '', parentType: 'Machine', parentId: '',
  });

  useEffect(() => {
    Promise.all([
      api.get<Project[]>('/projects'),
      api.get<User[]>('/users'),
      api.get<Meta>('/meta/machine-architecture-enums'),
    ]).then(([p, u, m]) => {
      setProjects(p);
      setUsers(u.filter((user) => ['designer', 'manager', 'admin'].includes(user.role || '')));
      setMeta(m);
      if (p[0]) setProjectId(p[0]._id);
    }).catch((err: any) => setError(err.message || 'Failed to load machine architecture')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    api.get<Machine[]>(`/machines?projectId=${projectId}`).then((data) => {
      setMachines(data);
      if (!data.some((m) => m._id === machineId)) setMachineId(data[0]?._id || '');
    }).catch((err: any) => setError(err.message || 'Failed to load machines')).finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    if (!machineId) return;
    setLoading(true);
    Promise.all([
      api.get<MachineTree>(`/machines/${machineId}/tree`),
      api.get<MachineStats>(`/machines/${machineId}/stats`),
      api.get<ComponentRecord[]>(`/components?machineId=${machineId}`),
    ]).then(([t, s, c]) => {
      setTree(t); setStats(s); setComponents(c);
      setComponentForm((cur) => ({ ...cur, parentId: t._id }));
    }).catch((err: any) => setError(err.message || 'Failed to load machine details')).finally(() => setLoading(false));
  }, [machineId]);

  const procurement = useMemo(() => components.filter((c) => c.designStatus === 'Released'), [components]);
  const assembly = useMemo(() => components.filter((c) => c.procurementStatus === 'Received'), [components]);

  const refresh = async () => {
    if (!machineId) return;
    const [m, t, s, c] = await Promise.all([
      api.get<Machine[]>(`/machines?projectId=${projectId}`),
      api.get<MachineTree>(`/machines/${machineId}/tree`),
      api.get<MachineStats>(`/machines/${machineId}/stats`),
      api.get<ComponentRecord[]>(`/components?machineId=${machineId}`),
    ]);
    setMachines(m); setTree(t); setStats(s); setComponents(c);
  };

  const createMachine = async () => {
    if (!machineName.trim() || !projectId) return;
    setSaving(true);
    try {
      await api.post('/machines', { name: machineName, projectId });
      setMachineName('');
      const list = await api.get<Machine[]>(`/machines?projectId=${projectId}`);
      setMachines(list);
      if (!machineId && list[0]) setMachineId(list[0]._id);
    } catch (err: any) { setError(err.message || 'Failed to create machine'); } finally { setSaving(false); }
  };

  const createComponent = async () => {
    if (!machineId || !projectId || !componentForm.name || !componentForm.ownerId || !componentForm.dueDate || !componentForm.parentId) return;
    setSaving(true);
    try {
      await api.post('/components', { ...componentForm, projectId, machineId });
      setComponentForm({ name: '', discipline: '', ownerId: '', dueDate: '', parentType: 'Machine', parentId: machineId });
      await refresh();
    } catch (err: any) { setError(err.message || 'Failed to create component'); } finally { setSaving(false); }
  };

  const patchStatus = async (id: string, field: 'designStatus' | 'procurementStatus' | 'assemblyStatus', value: string) => {
    setSaving(true);
    try { await api.patch(`/components/${id}`, { [field]: value }); await refresh(); }
    catch (err: any) { setError(err.message || 'Failed to update component'); } finally { setSaving(false); }
  };

  if (loading && !projects.length) return <LoadingSpinner />;

  return (
    <>
      <PageHeader
        title="Machine Architecture"
        description="ISA-88 structure and release-to-assembly tracking in one workspace"
      />

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">{error}</div>
      )}

      {/* Top bar: project picker + new machine */}
      <div className={`mb-5 grid gap-3 ${canWrite ? 'md:grid-cols-[240px_1fr_180px]' : 'md:grid-cols-[240px_1fr]'}`}>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="input-field">
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        {canWrite && (
          <>
            <input
              className="input-field"
              placeholder="New machine name…"
              value={machineName}
              onChange={(e) => setMachineName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createMachine()}
            />
            <button onClick={createMachine} disabled={saving || !machineName.trim()} className="btn-primary">
              <Plus className="h-4 w-4" /> New Machine
            </button>
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        {/* ── Machine list ── */}
        <section className="card overflow-hidden">
          <div className="border-b border-border px-5 py-3.5">
            <p className="text-xs font-bold uppercase tracking-wider text-fg-muted">Machines</p>
          </div>
          {machines.length === 0 ? (
            <EmptyState icon={<Factory className="h-8 w-8" />} title="No machines yet" description="Create a machine to begin." />
          ) : machines.map((m) => (
            <button
              key={m._id}
              onClick={() => setMachineId(m._id)}
              className={`block w-full border-b border-border px-5 py-4 text-left last:border-b-0 transition-colors ${
                machineId === m._id ? 'bg-brand-50 dark:bg-brand-950/20 border-l-2 border-l-brand-500' : 'hover:bg-surface-secondary'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-fg">{m.name}</p>
                {m.delayedCount > 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[15px] font-bold text-red-700 dark:bg-red-950/40 dark:text-red-400">
                    {m.delayedCount} delayed
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-fg-tertiary">
                {m.unitCount} units · {m.componentCount} components
              </p>
              {m.componentCount > 0 && (
                <div className="mt-2 flex gap-1.5">
                  <ProgressBar pct={m.designProgress} color="bg-blue-500" label="D" />
                  <ProgressBar pct={m.procurementProgress} color="bg-amber-500" label="P" />
                  <ProgressBar pct={m.assemblyProgress} color="bg-emerald-500" label="A" />
                </div>
              )}
            </button>
          ))}
        </section>

        {/* ── Machine detail ── */}
        {!tree || !stats ? (
          <EmptyState icon={<Wrench className="h-10 w-10" />} title="Select a machine" description="Pick a machine from the list to open the workspace." />
        ) : (
          <div className="space-y-5">
            {/* Header + tabs */}
            <section className="card p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xl font-bold text-fg">{tree.name}</p>
                  <p className="mt-0.5 text-sm text-fg-tertiary">{tree.projectId?.name || 'No project linked'}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tabs.map((item) => (
                    <button
                      key={item}
                      onClick={() => setTab(item)}
                      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                        tab === item
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'bg-surface-secondary text-fg-secondary hover:bg-surface-tertiary'
                      }`}
                    >
                      {item[0].toUpperCase() + item.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Overview ── */}
            {tab === 'overview' && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {([
                    ['Units', stats.units, 'text-blue-600'],
                    ['Equipment Modules', stats.equipmentModules, 'text-teal-600'],
                    ['Control Modules', stats.controlModules, 'text-violet-600'],
                    ['Components', stats.components, 'text-fg'],
                    ['Delayed', stats.delayed, 'text-red-600'],
                  ] as const).map(([label, value, color]) => (
                    <div key={label} className="card p-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-fg-muted">{label}</p>
                      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="card p-5">
                  <p className="mb-4 text-sm font-semibold text-fg">Progress</p>
                  <div className="space-y-3">
                    {([
                      ['Design released', stats.designProgress, 'bg-blue-500', 'bg-blue-100'],
                      ['Procurement received', stats.procurementProgress, 'bg-amber-500', 'bg-amber-100'],
                      ['Assembly installed', stats.assemblyProgress, 'bg-emerald-500', 'bg-emerald-100'],
                    ] as const).map(([label, pct, fill, track]) => (
                      <div key={label}>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-sm text-fg-secondary">{label}</span>
                          <span className="text-sm font-bold text-fg">{pct}%</span>
                        </div>
                        <div className={`h-2 w-full overflow-hidden rounded-full ${track}`}>
                          <div className={`h-full rounded-full transition-all duration-500 ${fill}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Structure ── */}
            {tab === 'structure' && (
              <section className="card p-5">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-fg">ISA-88 Structure</p>
                    <p className="mt-0.5 text-xs text-fg-muted">
                      Machine → Unit → Equipment Module → Control Module → Component
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="hidden sm:flex items-center gap-1.5 text-[15px] font-semibold">
                      <LevelPill level="unit" />
                      <LevelPill level="em" />
                      <LevelPill level="cm" />
                    </div>
                    <div className="flex overflow-hidden rounded-lg border border-border">
                      <button
                        onClick={() => setStructureMode('view')}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                          structureMode === 'view'
                            ? 'bg-brand-600 text-white'
                            : 'text-fg-secondary hover:bg-surface-tertiary'
                        }`}
                      >
                        View
                      </button>
                      <button
                        onClick={() => setStructureMode('edit')}
                        className={`border-l border-border px-3 py-1.5 text-xs font-medium transition-colors ${
                          structureMode === 'edit'
                            ? 'bg-brand-600 text-white'
                            : 'text-fg-secondary hover:bg-surface-tertiary'
                        }`}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
                {structureMode === 'view' ? (
                  <Isa88Tree tree={tree} />
                ) : (
                  <Isa88Editor machineId={machineId} tree={tree} onUpdate={refresh} />
                )}
              </section>
            )}

            {/* ── Components ── */}
            {tab === 'components' && (
              <>
                <section className="card p-5">
                  <p className="mb-4 text-sm font-semibold text-fg">Add Component</p>
                  {canWrite && (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <input className="input-field" placeholder="Component name" value={componentForm.name} onChange={(e) => setComponentForm((c) => ({ ...c, name: e.target.value }))} />
                    <select className="input-field" value={componentForm.discipline} onChange={(e) => setComponentForm((c) => ({ ...c, discipline: e.target.value }))}>
                      <option value="">Discipline</option>
                      {meta?.disciplines.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select className="input-field" value={componentForm.ownerId} onChange={(e) => setComponentForm((c) => ({ ...c, ownerId: e.target.value }))}>
                      <option value="">Owner</option>
                      {users.map((u) => <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}
                    </select>
                    <input className="input-field" type="date" value={componentForm.dueDate} onChange={(e) => setComponentForm((c) => ({ ...c, dueDate: e.target.value }))} />
                    <button onClick={createComponent} disabled={saving || !componentForm.name || !componentForm.ownerId || !componentForm.dueDate} className="btn-primary">
                      <Plus className="h-4 w-4" /> Create
                    </button>
                  </div>
                  )}
                </section>
                <ComponentTable components={components} meta={meta} onPatch={patchStatus} />
              </>
            )}

            {/* ── Procurement ── */}
            {tab === 'procurement' && (
              <ComponentTable components={procurement} meta={meta} mode="procurement" onPatch={patchStatus} />
            )}

            {/* ── Assembly ── */}
            {tab === 'assembly' && (
              <ComponentTable components={assembly} meta={meta} mode="assembly" onPatch={patchStatus} />
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Mini progress bar ───────────────────────────────────────────────── */

function ProgressBar({ pct, color, label }: { pct: number; color: string; label: string }) {
  return (
    <div className="flex flex-1 items-center gap-1">
      <span className="w-3 text-[16px] font-bold text-fg-muted">{label}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-surface-tertiary h-1">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ─── Component table ─────────────────────────────────────────────────── */

function ComponentTable({
  components, meta, onPatch, mode = 'all',
}: {
  components: ComponentRecord[];
  meta: Meta | null;
  mode?: 'all' | 'procurement' | 'assembly';
  onPatch: (id: string, field: 'designStatus' | 'procurementStatus' | 'assemblyStatus', value: string) => void;
}) {
  return (
    <section className="card overflow-hidden">
      {components.length === 0 ? (
        <EmptyState icon={<Wrench className="h-8 w-8" />} title="No components" description="This view has no components yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="table-header">
                <th>Component</th>
                <th>Location</th>
                <th>Owner</th>
                <th>Due</th>
                <th>Design</th>
                <th>Procurement</th>
                <th>Assembly</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {components.map((comp) => (
                <tr
                  key={comp._id}
                  className={`table-row ${comp.isDelayed ? 'border-l-[3px] border-l-amber-400' : ''}`}
                >
                  <td className="px-5 py-4">
                    <span className="font-semibold text-fg">{comp.name}</span>
                    {comp.discipline && (
                      <span className="ml-2 text-xs font-normal text-fg-muted">{comp.discipline}</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-fg-tertiary">
                    {comp.controlModuleId?.name || comp.equipmentModuleId?.name || comp.unitId?.name || 'Machine'}
                  </td>
                  <td className="px-5 py-4 text-fg-tertiary">
                    {comp.ownerId ? `${comp.ownerId.firstName} ${comp.ownerId.lastName}` : '—'}
                  </td>
                  <td className="px-5 py-4 text-fg-tertiary">{formatDate(comp.dueDate)}</td>
                  <td className="px-5 py-4">
                    {mode !== 'all' ? (
                      <StatusBadge status={comp.designStatus} />
                    ) : (
                      <select
                        className="input-field min-w-[140px]"
                        value={comp.designStatus}
                        onChange={(e) => onPatch(comp._id, 'designStatus', e.target.value)}
                      >
                        {meta?.designStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <select
                      className="input-field min-w-[140px]"
                      value={comp.procurementStatus}
                      onChange={(e) => onPatch(comp._id, 'procurementStatus', e.target.value)}
                    >
                      {meta?.procurementStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      className="input-field min-w-[130px]"
                      value={comp.assemblyStatus}
                      onChange={(e) => onPatch(comp._id, 'assemblyStatus', e.target.value)}
                    >
                      {meta?.assemblyStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

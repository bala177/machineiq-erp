'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Package, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils';

type UserOption = {
  _id: string;
  firstName: string;
  lastName: string;
};

type ModuleComponent = {
  _id: string;
  partName?: string;
  name?: string;
  quantity?: number;
  category?: string;
  supplier?: string;
  leadTimeWeeks?: number;
  status?: string;
  remarks?: string;
  longLeadRisk?: boolean;
  designStatus?: string;
  procurementStatus?: string;
};

type ModuleTask = {
  _id: string;
  title: string;
  status: string;
  priority?: string;
  dueDate?: string;
  blockerReason?: string;
  dependencyBlocked?: boolean;
  dependsOnTaskId?: { title?: string } | string | null;
  dependsOn?: Array<{ _id: string; title: string; status: string }>;
};

type ModuleDeliverable = {
  label: string;
  completed: boolean;
};

type ModuleRecord = {
  _id: string;
  name: string;
  machineName: string;
  ownerId?: { _id: string; firstName: string; lastName: string } | null;
  ownerName?: string;
  department?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  status: string;
  blockerCount: number;
  criticalBlockedTasks: number;
  releaseEligible: boolean;
  releaseReady?: boolean;
  componentsLocked?: boolean;
  completedDeliverables: number;
  deliverableCount: number;
  longLeadRiskCount: number;
  tasks: ModuleTask[];
  components: ModuleComponent[];
  deliverables: ModuleDeliverable[];
};

type Meta = {
  moduleDepartments?: string[];
  moduleComponentCategories?: string[];
  moduleComponentStatuses?: string[];
  taskStatuses?: string[];
  priorities?: string[];
};

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'components', label: 'Components' },
  { id: 'procurement', label: 'Procurement' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function ModuleCoordinationPanel({
  module,
  meta,
  users,
  projectId,
  projectTasks,
  onRefresh,
}: {
  module: ModuleRecord | null;
  meta: Meta | null;
  users: UserOption[];
  projectId: string;
  projectTasks: ModuleTask[];
  onRefresh: () => Promise<void>;
}) {
  const [tab, setTab] = useState<TabId>('overview');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newDeliverable, setNewDeliverable] = useState('');
  const [newComponent, setNewComponent] = useState({
    partName: '',
    quantity: 1,
    category: meta?.moduleComponentCategories?.[0] || 'Mechanical',
    supplier: '',
    leadTimeWeeks: 0,
    status: meta?.moduleComponentStatuses?.[0] || 'Planned',
    remarks: '',
  });

  useEffect(() => {
    setTab('overview');
    setError('');
    setNewDeliverable('');
  }, [module?._id]);

  useEffect(() => {
    setNewComponent((prev) => ({
      ...prev,
      category: meta?.moduleComponentCategories?.includes(prev.category) ? prev.category : meta?.moduleComponentCategories?.[0] || 'Mechanical',
      status: meta?.moduleComponentStatuses?.includes(prev.status) ? prev.status : meta?.moduleComponentStatuses?.[0] || 'Planned',
    }));
  }, [meta?.moduleComponentCategories, meta?.moduleComponentStatuses]);

  const procurementComponents = useMemo(
    () => (module?.components || []).filter((component) => component.designStatus === 'Released' || component.status === 'Ordered' || component.longLeadRisk),
    [module],
  );
  if (!module) {
    return (
      <div className="card p-6">
        <EmptyState icon={<Package className="h-8 w-8" />} title="No module selected" description="Choose a module to coordinate design release, early components, and procurement readiness." />
      </div>
    );
  }

  const persistModule = async (patch: Record<string, unknown>) => {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/machines/units/${module._id}`, patch);
      await onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update module');
    } finally {
      setSaving(false);
    }
  };

  const toggleDeliverable = async (index: number) => {
    const deliverables = module.deliverables.map((item, currentIndex) =>
      currentIndex === index ? { ...item, completed: !item.completed } : item,
    );
    await persistModule({ deliverables });
  };

  const addDeliverable = async () => {
    if (!newDeliverable.trim()) return;
    await persistModule({
      deliverables: [...module.deliverables, { label: newDeliverable.trim(), completed: false }],
    });
    setNewDeliverable('');
  };

  const patchComponent = async (componentId: string, patch: Record<string, unknown>) => {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/components/${componentId}`, patch);
      await onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update component');
    } finally {
      setSaving(false);
    }
  };

  const removeComponent = async (componentId: string) => {
    setSaving(true);
    setError('');
    try {
      await api.delete(`/components/${componentId}`);
      await onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to delete component');
    } finally {
      setSaving(false);
    }
  };

  const createComponent = async () => {
    if (!newComponent.partName.trim()) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/components', {
        projectId,
        machineId: (module as any).machineId,
        parentType: 'Unit',
        parentId: module._id,
        partName: newComponent.partName.trim(),
        name: newComponent.partName.trim(),
        quantity: Number(newComponent.quantity) || 1,
        category: newComponent.category,
        supplier: newComponent.supplier.trim(),
        leadTimeWeeks: Number(newComponent.leadTimeWeeks) || 0,
        status: newComponent.status,
        remarks: newComponent.remarks.trim(),
        ownerId: module.ownerId?._id,
        dueDate: module.plannedEndDate || null,
      });
      setNewComponent({
        partName: '',
        quantity: 1,
        category: meta?.moduleComponentCategories?.[0] || 'Mechanical',
        supplier: '',
        leadTimeWeeks: 0,
        status: meta?.moduleComponentStatuses?.[0] || 'Planned',
        remarks: '',
      });
      await onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create component');
    } finally {
      setSaving(false);
    }
  };

  const releaseToProcurement = async () => {
    setSaving(true);
    setError('');
    try {
      await api.post(`/machines/units/${module._id}/release-to-procurement`, {});
      await onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to release module');
    } finally {
      setSaving(false);
    }
  };

  const patchTask = async (taskId: string, patch: Record<string, unknown>) => {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/tasks/${taskId}`, patch);
      await onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-fg">{module.name}</h2>
              <StatusBadge status={module.status} />
              {module.longLeadRiskCount > 0 && <StatusBadge status="watch" />}
            </div>
            <p className="mt-1 text-sm text-fg-tertiary">
              {module.machineName} • {module.ownerName || (module.ownerId ? `${module.ownerId.firstName} ${module.ownerId.lastName}` : 'Unassigned')} • Due {formatDate(module.plannedEndDate)}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Metric label="Deliverables" value={`${module.completedDeliverables}/${module.deliverableCount}`} tone="text-fg" />
            <Metric label="Blocked Tasks" value={String(module.blockerCount)} tone={module.blockerCount > 0 ? 'text-red-700' : 'text-emerald-700'} />
            <Metric label="Long-Lead Risks" value={String(module.longLeadRiskCount)} tone={module.longLeadRiskCount > 0 ? 'text-amber-700' : 'text-emerald-700'} />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border px-4 pt-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${tab === item.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-fg-muted hover:text-fg'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm text-fg-secondary">
                Owner
                <select
                  value={module.ownerId?._id || ''}
                  onChange={(event) => {
                    const match = users.find((user) => user._id === event.target.value);
                    void persistModule({
                      ownerId: event.target.value || null,
                      ownerName: match ? `${match.firstName} ${match.lastName}` : '',
                    });
                  }}
                  className="input-field mt-1"
                  disabled={saving}
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-fg-secondary">
                Department
                <select
                  value={module.department || ''}
                  onChange={(event) => void persistModule({ department: event.target.value })}
                  className="input-field mt-1"
                  disabled={saving}
                >
                  <option value="">Select department</option>
                  {(meta?.moduleDepartments || []).map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-fg-secondary">
                Planned Start
                <input
                  type="date"
                  defaultValue={module.plannedStartDate ? new Date(module.plannedStartDate).toISOString().slice(0, 10) : ''}
                  onBlur={(event) => void persistModule({ plannedStartDate: event.target.value || null })}
                  className="input-field mt-1"
                  disabled={saving}
                />
              </label>
              <label className="text-sm text-fg-secondary">
                Planned End
                <input
                  type="date"
                  defaultValue={module.plannedEndDate ? new Date(module.plannedEndDate).toISOString().slice(0, 10) : ''}
                  onBlur={(event) => void persistModule({ plannedEndDate: event.target.value || null })}
                  className="input-field mt-1"
                  disabled={saving}
                />
              </label>
            </div>

            <div className="rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-fg">Deliverables</h3>
                  <p className="mt-1 text-sm text-fg-tertiary">Track design outputs that gate procurement release.</p>
                </div>
                <button
                  onClick={releaseToProcurement}
                  disabled={!module.releaseEligible || saving}
                  className="btn-secondary text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Release to Procurement
                </button>
              </div>
              <div className="mt-4 space-y-2">
                {module.deliverables.length === 0 ? (
                  <p className="text-sm text-fg-tertiary">No deliverables listed yet.</p>
                ) : (
                  module.deliverables.map((deliverable, index) => (
                    <label key={`${deliverable.label}-${index}`} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2">
                      <input type="checkbox" checked={deliverable.completed} onChange={() => void toggleDeliverable(index)} />
                      <span className={`text-sm ${deliverable.completed ? 'text-emerald-700 line-through' : 'text-fg'}`}>{deliverable.label}</span>
                    </label>
                  ))
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  value={newDeliverable}
                  onChange={(event) => setNewDeliverable(event.target.value)}
                  className="input-field"
                  placeholder="Add deliverable"
                />
                <button onClick={addDeliverable} disabled={saving} className="btn-secondary text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <InfoCallout
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  tone={module.releaseEligible ? 'success' : 'watch'}
                  title={module.releaseEligible ? 'Ready for procurement release' : 'Release checks still open'}
                  body={
                    module.releaseEligible
                      ? 'All deliverables are complete and no critical tasks are blocked.'
                      : 'Finish the deliverables checklist and clear critical blocked tasks before release.'
                  }
                />
                <InfoCallout
                  icon={<AlertTriangle className="h-4 w-4" />}
                  tone={module.longLeadRiskCount > 0 ? 'watch' : 'success'}
                  title={`${module.longLeadRiskCount} long-lead risk${module.longLeadRiskCount === 1 ? '' : 's'}`}
                  body="Components at 8+ weeks and not yet ordered are flagged here and in procurement."
                />
              </div>
            </div>
          </div>
        )}

        {tab === 'tasks' && (
          <div className="space-y-3">
            {module.tasks.length === 0 ? (
              <EmptyState icon={<Clock3 className="h-8 w-8" />} title="No module tasks" description="Tasks linked to this module will appear here, including dependency-driven blocked status." />
            ) : (
              module.tasks.map((task) => {
                const dependencyLabel =
                  task.dependsOn?.[0]?.title ||
                  (typeof task.dependsOnTaskId === 'object' ? task.dependsOnTaskId?.title : '') ||
                  '';
                const dependencyOptions = (projectTasks || []).filter((option) => option._id !== task._id);
                return (
                  <div key={task._id} className={`rounded-2xl border p-4 ${task.status === 'blocked' ? 'border-red-200 bg-red-50/70 dark:border-red-900 dark:bg-red-950/20' : 'border-border bg-surface'}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-fg">{task.title}</p>
                      <StatusBadge status={task.status} />
                      {task.priority && <StatusBadge status={task.priority} />}
                    </div>
                    <p className="mt-2 text-xs text-fg-tertiary">Due {formatDate(task.dueDate)}{dependencyLabel ? ` • Depends on ${dependencyLabel}` : ''}</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <label className="text-xs text-fg-muted">
                        Status
                        <select
                          value={task.status}
                          onChange={(event) => void patchTask(task._id, { status: event.target.value })}
                          className="input-field mt-1"
                          disabled={saving}
                        >
                          {(meta?.taskStatuses || []).map((status) => (
                            <option key={status} value={status}>
                              {status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs text-fg-muted">
                        Priority
                        <select
                          value={task.priority || ''}
                          onChange={(event) => void patchTask(task._id, { priority: event.target.value })}
                          className="input-field mt-1"
                          disabled={saving}
                        >
                          {(meta?.priorities || []).map((priority) => (
                            <option key={priority} value={priority}>
                              {priority.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs text-fg-muted">
                        Depends On
                        <select
                          value={typeof task.dependsOnTaskId === 'string' ? task.dependsOnTaskId : (task.dependsOn?.[0]?._id || '')}
                          onChange={(event) => void patchTask(task._id, { dependsOnTaskId: event.target.value || null })}
                          className="input-field mt-1"
                          disabled={saving}
                        >
                          <option value="">No dependency</option>
                          {dependencyOptions.map((option) => (
                            <option key={option._id} value={option._id}>
                              {option.title}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    {(task.blockerReason || task.dependencyBlocked) && <p className="mt-2 text-sm text-red-700">{task.blockerReason || 'Blocked by dependency'}</p>}
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === 'components' && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.9fr_1fr_0.8fr_0.9fr_1.2fr_auto]">
              <input className="input-field" placeholder="Part name" value={newComponent.partName} onChange={(event) => setNewComponent((prev) => ({ ...prev, partName: event.target.value }))} />
              <input className="input-field" type="number" min={1} value={newComponent.quantity} onChange={(event) => setNewComponent((prev) => ({ ...prev, quantity: Number(event.target.value) || 1 }))} />
              <select className="input-field" value={newComponent.category} onChange={(event) => setNewComponent((prev) => ({ ...prev, category: event.target.value }))}>
                {(meta?.moduleComponentCategories || []).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <input className="input-field" placeholder="Supplier" value={newComponent.supplier} onChange={(event) => setNewComponent((prev) => ({ ...prev, supplier: event.target.value }))} />
              <input className="input-field" type="number" min={0} value={newComponent.leadTimeWeeks} onChange={(event) => setNewComponent((prev) => ({ ...prev, leadTimeWeeks: Number(event.target.value) || 0 }))} />
              <select className="input-field" value={newComponent.status} onChange={(event) => setNewComponent((prev) => ({ ...prev, status: event.target.value }))}>
                {(meta?.moduleComponentStatuses || []).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <input className="input-field" placeholder="Remarks" value={newComponent.remarks} onChange={(event) => setNewComponent((prev) => ({ ...prev, remarks: event.target.value }))} />
              <button onClick={createComponent} disabled={saving} className="btn-secondary text-xs">
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="min-w-full text-sm">
                <thead className="bg-surface-secondary text-left text-xs uppercase tracking-wide text-fg-muted">
                  <tr>
                    <th className="px-3 py-2">Part</th>
                    <th className="px-3 py-2">Qty</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Supplier</th>
                    <th className="px-3 py-2">Lead</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Remarks</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {module.components.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-sm text-fg-tertiary">
                        No early components captured for this module yet.
                      </td>
                    </tr>
                  ) : (
                    module.components.map((component) => (
                      <tr key={component._id} className="border-t border-border">
                        <td className="px-3 py-2">
                          <input
                            className="input-field"
                            defaultValue={component.partName || component.name || ''}
                            onBlur={(event) => void patchComponent(component._id, { partName: event.target.value, name: event.target.value })}
                            disabled={saving || module.componentsLocked}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            className="input-field"
                            type="number"
                            min={1}
                            defaultValue={component.quantity ?? 1}
                            onBlur={(event) => void patchComponent(component._id, { quantity: Number(event.target.value) || 1 })}
                            disabled={saving || module.componentsLocked}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select className="input-field" value={component.category || ''} onChange={(event) => void patchComponent(component._id, { category: event.target.value })} disabled={saving || module.componentsLocked}>
                            {(meta?.moduleComponentCategories || []).map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            className="input-field"
                            defaultValue={component.supplier || ''}
                            onBlur={(event) => void patchComponent(component._id, { supplier: event.target.value })}
                            disabled={saving || module.componentsLocked}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <input
                              className="input-field"
                              type="number"
                              min={0}
                              defaultValue={component.leadTimeWeeks ?? 0}
                              onBlur={(event) => void patchComponent(component._id, { leadTimeWeeks: Number(event.target.value) || 0 })}
                              disabled={saving || module.componentsLocked}
                            />
                            {component.longLeadRisk && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[15px] font-semibold text-amber-700">Long-Lead Risk</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <select className="input-field" value={component.status || ''} onChange={(event) => void patchComponent(component._id, { status: event.target.value })} disabled={saving}>
                            {(meta?.moduleComponentStatuses || []).map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input className="input-field" defaultValue={component.remarks || ''} onBlur={(event) => void patchComponent(component._id, { remarks: event.target.value })} disabled={saving || module.componentsLocked} />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button onClick={() => void removeComponent(component._id)} disabled={saving} className="btn-ghost text-xs text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'procurement' && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Released Components" value={String((module.components || []).filter((component) => component.designStatus === 'Released').length)} tone="text-emerald-700" />
              <Metric label="Ordered" value={String((module.components || []).filter((component) => component.status === 'Ordered').length)} tone="text-blue-700" />
              <Metric label="Long-Lead Risks" value={String(module.longLeadRiskCount)} tone={module.longLeadRiskCount > 0 ? 'text-amber-700' : 'text-emerald-700'} />
            </div>
            <div className="space-y-3">
              {procurementComponents.length === 0 ? (
                <EmptyState icon={<Package className="h-8 w-8" />} title="Nothing in procurement view yet" description="Release the module or flag long-lead parts to surface them here." />
              ) : (
                procurementComponents.map((component) => (
                  <div key={component._id} className="rounded-2xl border border-border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-fg">{component.partName || component.name}</p>
                      {component.status && <StatusBadge status={component.status} />}
                      {component.designStatus && <StatusBadge status={component.designStatus} />}
                      {component.procurementStatus && <StatusBadge status={component.procurementStatus} />}
                      {component.longLeadRisk && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[15px] font-semibold text-amber-700">Long-Lead Risk</span>}
                    </div>
                    <p className="mt-2 text-xs text-fg-tertiary">
                      Supplier {component.supplier || '—'} • Lead time {component.leadTimeWeeks ?? 0} weeks • Qty {component.quantity ?? 1}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl bg-surface-secondary px-4 py-3">
      <p className="text-[15px] font-semibold uppercase tracking-wide text-fg-muted">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function InfoCallout({
  icon,
  tone,
  title,
  body,
}: {
  icon: ReactNode;
  tone: 'success' | 'watch';
  title: string;
  body: string;
}) {
  const styles =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300'
      : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300';

  return (
    <div className={`rounded-2xl border p-4 ${styles}`}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <p className="mt-2 text-sm">{body}</p>
    </div>
  );
}

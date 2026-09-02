'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Building2, Check, Pencil, Plus, RefreshCw, Trash2, UsersRound } from 'lucide-react';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Modal } from '@/components/ui/modal';

type Department = { _id: string; name: string; code?: string; description?: string; isActive: boolean };
type DepartmentForm = { name: string; code: string; description: string };
const emptyForm: DepartmentForm = { name: '', code: '', description: '' };

export function DepartmentManagement({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [form, setForm] = useState<DepartmentForm>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get<Department[]>('/departments');
      setDepartments(result);
      onCountChange?.(result.length);
      setError('');
    } catch (requestError: any) {
      setError(requestError.message || 'Departments could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => { void load(); }, [load]);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(department: Department) {
    setEditTarget(department);
    setForm({ name: department.name, code: department.code || '', description: department.description || '' });
    setError('');
    setModalOpen(true);
  }

  async function save() {
    if (!form.name.trim()) { setError('Department name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      if (editTarget) await api.patch(`/departments/${editTarget._id}`, form);
      else await api.post('/departments', form);
      setModalOpen(false);
      await load();
    } catch (requestError: any) {
      setError(requestError.message || 'Department could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.delete(`/departments/${deleteTarget._id}`);
      setDeleteTarget(null);
      await load();
    } catch (requestError: any) {
      setDeleteTarget(null);
      setError(requestError.message || 'Department could not be deleted. Reassign active users first.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card mt-6 overflow-hidden" aria-labelledby="departments-heading">
      <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300"><UsersRound className="h-5 w-5" /></div>
          <div>
            <div className="flex flex-wrap items-center gap-2"><h2 id="departments-heading" className="font-semibold text-fg">Departments</h2><span className="badge-gray">{departments.length} configured</span></div>
            <p className="mt-1 text-sm text-fg-muted">Define the teams responsible for people, tasks, deliverables, and project work.</p>
          </div>
        </div>
        <button className="btn-primary shrink-0" onClick={openCreate}><Plus className="h-4 w-4" /> Add Department</button>
      </div>

      {error && !modalOpen && <div className="m-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
      {loading ? <div className="py-10"><LoadingSpinner /></div> : departments.length === 0 ? (
        <div className="flex flex-col items-center px-5 py-12 text-center"><Building2 className="mb-3 h-10 w-10 text-fg-muted" /><p className="font-semibold text-fg">No departments configured</p><p className="mt-1 max-w-md text-sm text-fg-muted">Add the first department before assigning team members or departmental ownership.</p><button className="btn-secondary mt-4" onClick={openCreate}><Plus className="h-4 w-4" /> Add first department</button></div>
      ) : (
        <div className="divide-y divide-border">
          {departments.map((department) => (
            <div key={department._id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-fg">{department.name}</p>{department.code && <span className="badge-blue">{department.code}</span>}<span className={department.isActive ? 'badge-green' : 'badge-gray'}>{department.isActive ? 'Active' : 'Inactive'}</span></div><p className="mt-1 text-sm text-fg-muted">{department.description || 'No description provided'}</p></div>
              <div className="flex shrink-0 gap-1"><button className="btn-ghost px-2 py-2" onClick={() => openEdit(department)} aria-label={`Edit ${department.name}`}><Pencil className="h-4 w-4" /></button><button className="btn-ghost px-2 py-2 text-red-600" onClick={() => setDeleteTarget(department)} aria-label={`Delete ${department.name}`}><Trash2 className="h-4 w-4" /></button></div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && <Modal title={editTarget ? 'Edit department' : 'Add department'} onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-fg-secondary">Department name <span className="text-red-500">*</span><input className="input-field mt-1.5" placeholder="e.g. Mechanical Engineering" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label className="block text-sm font-medium text-fg-secondary">Department code<input className="input-field mt-1.5" placeholder="e.g. MECH" maxLength={10} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} /><span className="mt-1 block text-xs font-normal text-fg-muted">Short identifier used in reports and assignments</span></label>
          <label className="block text-sm font-medium text-fg-secondary">Description<textarea className="input-field mt-1.5 resize-none" rows={3} placeholder="What is this team responsible for?" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-border pt-4"><button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" disabled={saving} onClick={() => void save()}>{saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{editTarget ? 'Save changes' : 'Create department'}</button></div>
        </div>
      </Modal>}

      {deleteTarget && <Modal title="Delete department" onClose={() => setDeleteTarget(null)}><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/30"><AlertTriangle className="h-5 w-5" /></div><div><p className="font-semibold text-fg">Delete {deleteTarget.name}?</p><p className="mt-1 text-sm text-fg-muted">Departments with active users cannot be deleted. This action cannot be undone.</p></div></div><div className="mt-6 flex justify-end gap-2"><button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button><button className="btn-danger" disabled={saving} onClick={() => void remove()}>{saving ? 'Deleting…' : 'Delete department'}</button></div></Modal>}
    </section>
  );
}

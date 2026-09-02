'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Building2, Bell, FileCog, FileText, Info, KeyRound, ShieldCheck, Plus, Pencil, Trash2, Check, X, Save, AlertTriangle, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { APP_VERSION } from '@/lib/app-meta';
import { ROLE_DEFINITIONS, ROLE_KEYS, roleLabel } from '@/lib/roles';

// ─── Types ────────────────────────────────────────────────────────────────────

type Department = {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
};

type DeptForm = { name: string; code: string; description: string };
type Permission = { _id: string; code: string; module: string; action: string; description?: string; isActive: boolean };
type RolePermission = { role: string; permissionId: string; allowed: boolean };
type DocumentType = { _id: string; code: string; name: string; prefix: string; padding: number; resetFrequency: 'never' | 'yearly' | 'monthly'; nextNumber: string; isActive: boolean };
type DocumentTypeForm = { code: string; name: string; prefix: string; padding: number; resetFrequency: 'never' | 'yearly' | 'monthly'; nextNumber: number };

type NotificationPrefs = {
  assignment: boolean;
  status_change: boolean;
  due_reminder: boolean;
  overdue: boolean;
};

type CommercialPrefs = {
  organizationName: string;
  organizationEmail: string;
  organizationPhone: string;
  taxRegistrationNumber: string;
  billingAddress: string;
  quotePrefix: string;
  quoteNumberPadding: number;
  defaultCurrency: string;
  defaultValidityDays: number;
  defaultTaxName: string;
  defaultTaxPercent: number;
  defaultNotes: string;
  defaultTerms: string;
  bankDetails: string;
  units: string[];
  taxes: { name: string; rate: number }[];
  items: { name: string; sku: string; hsnSac: string; unit: string; rate: number; taxName: string; taxPercent: number; description: string }[];
};

const NOTIF_LABELS: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  { key: 'assignment', label: 'Task Assignment', description: 'Notify users when a task or component is assigned to them' },
  { key: 'status_change', label: 'Status Changes', description: 'Notify relevant parties when a task status is updated' },
  { key: 'due_reminder', label: 'Due Date Reminder', description: 'Send reminders when a task or component is approaching its due date' },
  { key: 'overdue', label: 'Overdue Alerts', description: 'Alert task owners when items pass their due date without completion' },
];

const TABS = [
  { key: 'commercial', label: 'Commercial', icon: FileText },
  { key: 'roles', label: 'Roles', icon: ShieldCheck },
  { key: 'permissions', label: 'Permissions', icon: KeyRound },
  { key: 'documentTypes', label: 'Document Types', icon: FileCog },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'platform', label: 'Platform', icon: Info },
] as const;

type Tab = (typeof TABS)[number]['key'];

const EMPTY_FORM: DeptForm = { name: '', code: '', description: '' };
const EMPTY_DOCUMENT_TYPE: DocumentTypeForm = { code: '', name: '', prefix: '', padding: 4, resetFrequency: 'yearly', nextNumber: 1 };

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md animate-slide-up rounded-2xl border border-border bg-surface shadow-elevated">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-fg">{title}</h2>
          <button onClick={onClose} className="rounded-xl p-1.5 text-fg-muted transition-colors hover:bg-surface-tertiary hover:text-fg-tertiary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm animate-slide-up rounded-2xl border border-border bg-surface p-6 shadow-elevated">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-sm text-fg-secondary">{message}</p>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-danger">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Departments Tab ──────────────────────────────────────────────────────────

function DepartmentsTab() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [form, setForm] = useState<DeptForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<Department[]>('/departments')
      .then(setDepartments)
      .catch(() => setError('Failed to load departments'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  }

  function openEdit(dept: Department) {
    setEditTarget(dept);
    setForm({ name: dept.name, code: dept.code || '', description: dept.description || '' });
    setError('');
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError('Department name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editTarget) {
        await api.patch(`/departments/${editTarget._id}`, form);
      } else {
        await api.post('/departments', form);
      }
      setShowModal(false);
      load();
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/departments/${deleteTarget._id}`);
      setDeleteTarget(null);
      load();
    } catch {
      setError('Failed to delete department');
      setDeleteTarget(null);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-fg-tertiary">Manage the departments in your organisation. Departments are used to assign ownership to tasks, deliverables, and team members.</p>
        <button onClick={openCreate} className="btn-primary shrink-0">
          <Plus className="h-4 w-4" /> Add Department
        </button>
      </div>

      {error && !showModal && <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>}

      {departments.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <Building2 className="mb-3 h-10 w-10 text-fg-muted" />
          <p className="text-sm font-medium text-fg-tertiary">No departments yet</p>
          <p className="mt-1 text-xs text-fg-muted">Add your first department to get started</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-2 sm:hidden">
            {departments.map((d) => (
              <div key={d._id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-fg">{d.name}</p>
                      {d.code && <span className="rounded bg-surface-tertiary px-1.5 py-0.5 text-[16px] font-semibold uppercase tracking-wider text-fg-tertiary">{d.code}</span>}
                    </div>
                    {d.description && <p className="mt-0.5 text-xs text-fg-tertiary">{d.description}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => openEdit(d)} className="btn-ghost p-1.5 text-fg-muted hover:text-brand-600">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(d)} className="btn-ghost p-1.5 text-fg-muted hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="card hidden overflow-hidden sm:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="table-header">
                  <th>Name</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {departments.map((d) => (
                  <tr key={d._id} className="table-row">
                    <td className="px-5 py-4 font-semibold text-fg">{d.name}</td>
                    <td className="px-5 py-4">{d.code ? <span className="rounded-lg bg-surface-tertiary px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-fg-tertiary">{d.code}</span> : <span className="text-fg-muted">—</span>}</td>
                    <td className="px-5 py-4 text-fg-tertiary">{d.description || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[15px] font-semibold', d.isActive ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400')}>
                        <span className={clsx('h-1.5 w-1.5 rounded-full', d.isActive ? 'bg-emerald-500' : 'bg-slate-400')} />
                        {d.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(d)} className="btn-ghost p-1.5 text-fg-muted hover:text-brand-600" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(d)} className="btn-ghost p-1.5 text-fg-muted hover:text-red-500" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <Modal title={editTarget ? 'Edit Department' : 'Add Department'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="department-name" className="mb-1.5 block text-sm font-medium text-fg-secondary">
                Name <span className="text-red-500">*</span>
              </label>
              <input id="department-name" className="input-field w-full" placeholder="e.g. Mechanical Engineering" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label htmlFor="department-code" className="mb-1.5 block text-sm font-medium text-fg-secondary">
                Code
              </label>
              <input id="department-code" className="input-field w-full" placeholder="e.g. MECH" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} maxLength={10} />
              <p className="mt-1 text-xs text-fg-muted">Short identifier used in reports and task labels</p>
            </div>
            <div>
              <label htmlFor="department-description" className="mb-1.5 block text-sm font-medium text-fg-secondary">
                Description
              </label>
              <textarea id="department-description" className="input-field w-full resize-none" rows={3} placeholder="Optional description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            {error && <p className="rounded bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {editTarget ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteTarget && <ConfirmDialog message={`Delete "${deleteTarget.name}"? This action cannot be undone. Departments with active users cannot be deleted.`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}

// ─── Roles Tab ───────────────────────────────────────────────────────────────

function RolesTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-fg-tertiary">Roles control what each user can see and do across MachineIQ. Role permissions are enforced server-side on every request.</p>
      </div>

      <div className="space-y-2 sm:hidden">
        {ROLE_DEFINITIONS.map((r) => (
          <div key={r.key} className="card p-4">
            <div className="flex items-start gap-3">
              <span className={clsx('mt-0.5 inline-flex shrink-0 items-center rounded px-2 py-0.5 text-xs font-semibold capitalize', r.color)}>{r.label}</span>
              <p className="text-xs text-fg-tertiary">{r.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card hidden overflow-hidden sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="table-header">
              <th>Role</th>
              <th>Permissions &amp; Scope</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ROLE_DEFINITIONS.map((r) => (
              <tr key={r.key} className="table-row">
                <td className="px-5 py-4">
                  <span className={clsx('inline-flex items-center rounded px-2.5 py-0.5 text-xs font-semibold capitalize', r.color)}>{r.label}</span>
                </td>
                <td className="max-w-xl px-5 py-4 text-fg-tertiary">{r.description}</td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[15px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/30">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Fixed application roles</p>
        <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-400">Use the Permissions tab to configure the capabilities assigned to each role.</p>
      </div>
    </div>
  );
}

// ─── Permission Matrix Tab ───────────────────────────────────────────────────

function PermissionsTab() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [savingRole, setSavingRole] = useState('');
  const [savedRole, setSavedRole] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<{ permissions: Permission[]; assignments: RolePermission[] }>('/permissions/matrix')
      .then((matrix) => {
        setPermissions(matrix.permissions.filter((permission) => permission.isActive));
        setSelected(Object.fromEntries(ROLE_KEYS.map((role) => [role, matrix.assignments.filter((assignment) => assignment.role === role && assignment.allowed).map((assignment) => assignment.permissionId)])));
        setError('');
      })
      .catch((err: any) => setError(err.message || 'Failed to load permission matrix'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(role: string, permissionId: string) {
    setSelected((current) => {
      const rolePermissions = current[role] || [];
      return {
        ...current,
        [role]: rolePermissions.includes(permissionId) ? rolePermissions.filter((id) => id !== permissionId) : [...rolePermissions, permissionId],
      };
    });
    setSavedRole('');
  }

  async function save(role: string) {
    setSavingRole(role);
    setSavedRole('');
    setError('');
    try {
      await api.put(`/permissions/roles/${role}`, { permissionIds: selected[role] || [] });
      setSavedRole(role);
    } catch (err: any) {
      setError(err.message || `Failed to save ${roleLabel(role)} permissions`);
    } finally {
      setSavingRole('');
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-fg-tertiary">Assign explicit server-enforced permissions to each role. Save each role after making changes.</p>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">{error}</div>}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="table-header">
              <th>Capability</th>
              {ROLE_DEFINITIONS.map((role) => (
                <th key={role.key} className="text-center">
                  {role.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {permissions.map((permission) => (
              <tr key={permission._id} className="table-row">
                <td className="px-5 py-4">
                  <p className="font-semibold text-fg">
                    {permission.module} · {permission.action}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-fg-muted">{permission.code}</p>
                </td>
                {ROLE_DEFINITIONS.map((role) => (
                  <td key={role.key} className="px-4 py-4 text-center">
                    <input type="checkbox" className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500" aria-label={`${role.label}: ${permission.module} ${permission.action}`} checked={(selected[role.key] || []).includes(permission._id)} onChange={() => toggle(role.key, permission._id)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {ROLE_DEFINITIONS.map((role) => (
          <button key={role.key} type="button" className="btn-secondary" disabled={Boolean(savingRole)} onClick={() => void save(role.key)}>
            {savingRole === role.key ? <RefreshCw className="h-4 w-4 animate-spin" /> : savedRole === role.key ? <Check className="h-4 w-4 text-emerald-600" /> : <Save className="h-4 w-4" />}Save {role.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Document Types Tab ──────────────────────────────────────────────────────

function DocumentTypesTab() {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<DocumentTypeForm>(EMPTY_DOCUMENT_TYPE);
  const [editTarget, setEditTarget] = useState<DocumentType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentType | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<DocumentType[]>('/document-types')
      .then((data) => {
        setDocumentTypes(data);
        setError('');
      })
      .catch((err: any) => setError(err.message || 'Failed to load document types'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_DOCUMENT_TYPE);
    setError('');
    setOpen(true);
  }

  function openEdit(documentType: DocumentType) {
    setEditTarget(documentType);
    setForm({ code: documentType.code, name: documentType.name, prefix: documentType.prefix, padding: documentType.padding, resetFrequency: documentType.resetFrequency, nextNumber: Number(documentType.nextNumber) });
    setError('');
    setOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editTarget) {
        const { code: _code, ...changes } = form;
        await api.patch(`/document-types/${editTarget._id}`, changes);
      } else {
        await api.post('/document-types', form);
      }
      setOpen(false);
      load();
    } catch (err: any) {
      setError(err.message || 'Failed to save document type');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/document-types/${deleteTarget._id}`);
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      setError(err.message || 'Failed to delete document type');
      setDeleteTarget(null);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-fg-tertiary">Control document prefixes, number padding, reset periods, and the next number issued.</p>
        <button type="button" className="btn-primary shrink-0" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New Document Type
        </button>
      </div>
      {error && !open && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">{error}</div>}
      {documentTypes.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <FileCog className="mb-3 h-10 w-10 text-fg-muted" />
          <p className="text-sm font-medium text-fg">No document types configured</p>
          <p className="mt-1 text-xs text-fg-muted">Create the first numbering rule for quotes, invoices, or future ERP documents.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="table-header">
                <th>Document type</th>
                <th>Prefix</th>
                <th>Reset</th>
                <th>Next number</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documentTypes.map((documentType) => (
                <tr key={documentType._id} className="table-row">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-fg">{documentType.name}</p>
                    <p className="font-mono text-xs text-fg-muted">{documentType.code}</p>
                  </td>
                  <td className="px-5 py-4 font-mono text-fg-secondary">{documentType.prefix}</td>
                  <td className="px-5 py-4 capitalize text-fg-secondary">{documentType.resetFrequency}</td>
                  <td className="px-5 py-4 text-fg-secondary">{String(documentType.nextNumber).padStart(documentType.padding, '0')}</td>
                  <td className="px-5 py-4">
                    <span className={documentType.isActive ? 'badge-green' : 'badge-gray'}>{documentType.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <button type="button" className="btn-ghost p-2" title="Edit" onClick={() => openEdit(documentType)}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" className="btn-ghost p-2 text-red-600" title="Delete" onClick={() => setDeleteTarget(documentType)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && (
        <Modal title={editTarget ? 'Edit Document Type' : 'New Document Type'} onClose={() => setOpen(false)}>
          <form className="space-y-4" onSubmit={save}>
            <label className="block text-sm font-medium text-fg-secondary">
              Code
              <input className="input-field mt-1.5" required disabled={Boolean(editTarget)} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toLowerCase() })} placeholder="quote" />
            </label>
            <label className="block text-sm font-medium text-fg-secondary">
              Name
              <input className="input-field mt-1.5" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Quote" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-fg-secondary">
                Prefix
                <input className="input-field mt-1.5" required value={form.prefix} onChange={(event) => setForm({ ...form, prefix: event.target.value.toUpperCase() })} placeholder="QTE" />
              </label>
              <label className="block text-sm font-medium text-fg-secondary">
                Padding
                <input className="input-field mt-1.5" type="number" min="1" max="10" required value={form.padding} onChange={(event) => setForm({ ...form, padding: Number(event.target.value) })} />
              </label>
              <label className="block text-sm font-medium text-fg-secondary">
                Reset frequency
                <select className="input-field mt-1.5" value={form.resetFrequency} onChange={(event) => setForm({ ...form, resetFrequency: event.target.value as DocumentTypeForm['resetFrequency'] })}>
                  <option value="never">Never</option>
                  <option value="yearly">Yearly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-fg-secondary">
                Next number
                <input className="input-field mt-1.5" type="number" min="1" required value={form.nextNumber} onChange={(event) => setForm({ ...form, nextNumber: Number(event.target.value) })} />
              </label>
            </div>
            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Document Type'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deleteTarget && <ConfirmDialog message={`Delete "${deleteTarget.name}"? Existing documents keep their issued numbers, but this type cannot issue new numbers.`} onConfirm={() => void remove()} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    assignment: true,
    status_change: true,
    due_reminder: true,
    overdue: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<any>('/settings/notification_preferences')
      .then((res) => {
        const value = res?.value ?? res;
        if (value && typeof value === 'object' && 'assignment' in value) {
          setPrefs(value as NotificationPrefs);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await api.patch('/settings/notification_preferences', { value: prefs });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  }

  function toggle(key: keyof NotificationPrefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
    setSaved(false);
  }

  if (loading) return <LoadingSpinner />;

  const enabledCount = Object.values(prefs).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-fg-tertiary">Control which notification types are active. Disabling a type suppresses all in-app and real-time alerts of that kind for all users.</p>
        <span className="shrink-0 text-xs text-fg-muted">
          {enabledCount} of {NOTIF_LABELS.length} active
        </span>
      </div>

      <div className="card divide-y divide-border overflow-hidden">
        {NOTIF_LABELS.map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-surface-secondary">
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg">{label}</p>
              <p className="mt-0.5 text-xs text-fg-tertiary">{description}</p>
            </div>
            <button onClick={() => toggle(key)} className={clsx('relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none', prefs[key] ? 'bg-brand-600' : 'bg-surface-tertiary dark:bg-slate-600')} role="switch" aria-label={label} aria-checked={prefs[key]}>
              <span className={clsx('pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200', prefs[key] ? 'translate-x-5' : 'translate-x-0')} />
            </button>
          </div>
        ))}
      </div>

      {error && <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>}

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Preferences
        </button>
      </div>
    </div>
  );
}

// ─── Commercial Tab ──────────────────────────────────────────────────────────

const DEFAULT_COMMERCIAL_PREFS: CommercialPrefs = {
  organizationName: 'MachineIQ',
  organizationEmail: 'sales@machineiq.com',
  organizationPhone: '',
  taxRegistrationNumber: '',
  billingAddress: '',
  quotePrefix: 'QTE',
  quoteNumberPadding: 4,
  defaultCurrency: 'INR',
  defaultValidityDays: 30,
  defaultTaxName: 'GST 18%',
  defaultTaxPercent: 18,
  defaultNotes: 'Thank you for your business.',
  defaultTerms: 'Payment as agreed. Quote validity is subject to technical confirmation.',
  bankDetails: '',
  units: ['Nos', 'Set', 'Lot', 'Hour', 'Day'],
  taxes: [
    { name: 'GST 0%', rate: 0 },
    { name: 'GST 5%', rate: 5 },
    { name: 'GST 12%', rate: 12 },
    { name: 'GST 18%', rate: 18 },
    { name: 'GST 28%', rate: 28 },
  ],
  items: [],
};

function CommercialTab() {
  const [prefs, setPrefs] = useState<CommercialPrefs>(DEFAULT_COMMERCIAL_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<any>('/settings/commercial_preferences')
      .then((res) => setPrefs({ ...DEFAULT_COMMERCIAL_PREFS, ...(res?.value ?? res ?? {}) }))
      .catch(() => setError('Failed to load commercial preferences'))
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof CommercialPrefs>(key: K, value: CommercialPrefs[K]) => {
    setPrefs((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await api.patch('/settings/commercial_preferences', { value: prefs });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save commercial preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-fg">Organization and numbering</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fg-secondary">Organization Name</span>
            <input className="input-field" value={prefs.organizationName} onChange={(e) => set('organizationName', e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fg-secondary">Email</span>
            <input className="input-field" value={prefs.organizationEmail} onChange={(e) => set('organizationEmail', e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fg-secondary">Phone</span>
            <input className="input-field" value={prefs.organizationPhone} onChange={(e) => set('organizationPhone', e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fg-secondary">Tax Registration Number</span>
            <input className="input-field" value={prefs.taxRegistrationNumber} onChange={(e) => set('taxRegistrationNumber', e.target.value)} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-medium text-fg-secondary">Address</span>
            <textarea className="input-field min-h-[80px]" value={prefs.billingAddress} onChange={(e) => set('billingAddress', e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fg-secondary">Quote Prefix</span>
            <input className="input-field uppercase" value={prefs.quotePrefix} onChange={(e) => set('quotePrefix', e.target.value.toUpperCase())} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fg-secondary">Number Padding</span>
            <input className="input-field" type="number" min="1" max="8" value={prefs.quoteNumberPadding} onChange={(e) => set('quoteNumberPadding', Number(e.target.value))} />
          </label>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-fg">Quote defaults</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fg-secondary">Currency</span>
            <input className="input-field uppercase" value={prefs.defaultCurrency} onChange={(e) => set('defaultCurrency', e.target.value.toUpperCase())} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fg-secondary">Validity Days</span>
            <input className="input-field" type="number" min="1" value={prefs.defaultValidityDays} onChange={(e) => set('defaultValidityDays', Number(e.target.value))} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fg-secondary">Default Tax Name</span>
            <input className="input-field" value={prefs.defaultTaxName} onChange={(e) => set('defaultTaxName', e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fg-secondary">Default Tax %</span>
            <input className="input-field" type="number" min="0" max="100" value={prefs.defaultTaxPercent} onChange={(e) => set('defaultTaxPercent', Number(e.target.value))} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-medium text-fg-secondary">Default Notes</span>
            <textarea className="input-field min-h-[80px]" value={prefs.defaultNotes} onChange={(e) => set('defaultNotes', e.target.value)} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-medium text-fg-secondary">Terms and Conditions</span>
            <textarea className="input-field min-h-[100px]" value={prefs.defaultTerms} onChange={(e) => set('defaultTerms', e.target.value)} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-medium text-fg-secondary">Bank Details</span>
            <textarea className="input-field min-h-[90px]" value={prefs.bankDetails} onChange={(e) => set('bankDetails', e.target.value)} />
          </label>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-fg">Taxes</h2>
            <button type="button" className="btn-secondary px-3 py-2" onClick={() => set('taxes', [...prefs.taxes, { name: '', rate: 0 }])}>
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          <div className="space-y-2">
            {prefs.taxes.map((tax, index) => (
              <div key={index} className="grid grid-cols-[1fr_100px_auto] gap-2">
                <input
                  className="input-field"
                  value={tax.name}
                  onChange={(e) =>
                    set(
                      'taxes',
                      prefs.taxes.map((item, i) => (i === index ? { ...item, name: e.target.value } : item)),
                    )
                  }
                  placeholder="Tax name"
                />
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  max="100"
                  value={tax.rate}
                  onChange={(e) =>
                    set(
                      'taxes',
                      prefs.taxes.map((item, i) => (i === index ? { ...item, rate: Number(e.target.value) } : item)),
                    )
                  }
                />
                <button
                  type="button"
                  className="btn-ghost p-2 text-red-600"
                  onClick={() =>
                    set(
                      'taxes',
                      prefs.taxes.filter((_, i) => i !== index),
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-fg">Units</h2>
          <textarea
            className="input-field min-h-[150px]"
            value={prefs.units.join('\n')}
            onChange={(e) =>
              set(
                'units',
                e.target.value
                  .split('\n')
                  .map((item) => item.trim())
                  .filter(Boolean),
              )
            }
          />
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg">Item catalog</h2>
          <button type="button" className="btn-secondary px-3 py-2" onClick={() => set('items', [...prefs.items, { name: '', sku: '', hsnSac: '', unit: 'Nos', rate: 0, taxName: prefs.defaultTaxName, taxPercent: prefs.defaultTaxPercent, description: '' }])}>
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
        <div className="space-y-3">
          {prefs.items.map((item, index) => (
            <div key={index} className="rounded-lg border border-border p-3">
              <div className="grid gap-2 md:grid-cols-[1fr_120px_120px_90px_120px_auto]">
                <input
                  className="input-field"
                  value={item.name}
                  onChange={(e) =>
                    set(
                      'items',
                      prefs.items.map((entry, i) => (i === index ? { ...entry, name: e.target.value } : entry)),
                    )
                  }
                  placeholder="Item name"
                />
                <input
                  className="input-field"
                  value={item.sku}
                  onChange={(e) =>
                    set(
                      'items',
                      prefs.items.map((entry, i) => (i === index ? { ...entry, sku: e.target.value } : entry)),
                    )
                  }
                  placeholder="SKU"
                />
                <input
                  className="input-field"
                  value={item.hsnSac}
                  onChange={(e) =>
                    set(
                      'items',
                      prefs.items.map((entry, i) => (i === index ? { ...entry, hsnSac: e.target.value } : entry)),
                    )
                  }
                  placeholder="HSN/SAC"
                />
                <input
                  className="input-field"
                  value={item.unit}
                  onChange={(e) =>
                    set(
                      'items',
                      prefs.items.map((entry, i) => (i === index ? { ...entry, unit: e.target.value } : entry)),
                    )
                  }
                  placeholder="Unit"
                />
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  value={item.rate}
                  onChange={(e) =>
                    set(
                      'items',
                      prefs.items.map((entry, i) => (i === index ? { ...entry, rate: Number(e.target.value) } : entry)),
                    )
                  }
                  placeholder="Rate"
                />
                <button
                  type="button"
                  className="btn-ghost p-2 text-red-600"
                  onClick={() =>
                    set(
                      'items',
                      prefs.items.filter((_, i) => i !== index),
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 grid gap-2 md:grid-cols-[180px_120px_1fr]">
                <input
                  className="input-field"
                  value={item.taxName}
                  onChange={(e) =>
                    set(
                      'items',
                      prefs.items.map((entry, i) => (i === index ? { ...entry, taxName: e.target.value } : entry)),
                    )
                  }
                  placeholder="Tax name"
                />
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  max="100"
                  value={item.taxPercent}
                  onChange={(e) =>
                    set(
                      'items',
                      prefs.items.map((entry, i) => (i === index ? { ...entry, taxPercent: Number(e.target.value) } : entry)),
                    )
                  }
                  placeholder="Tax %"
                />
                <input
                  className="input-field"
                  value={item.description}
                  onChange={(e) =>
                    set(
                      'items',
                      prefs.items.map((entry, i) => (i === index ? { ...entry, description: e.target.value } : entry)),
                    )
                  }
                  placeholder="Description shown on quote"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="flex justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
        <button type="button" onClick={save} disabled={saving} className="btn-primary">
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Commercial Settings
        </button>
      </div>
    </div>
  );
}

// ─── Platform Tab ─────────────────────────────────────────────────────────────

function PlatformTab() {
  const rows: { label: string; value: string }[] = [
    { label: 'Product', value: 'MachineIQ — ERP for Machine Builders' },
    { label: 'Version', value: APP_VERSION },
    { label: 'Status', value: 'In development — not yet released' },
    { label: 'Support', value: 'support@machineiq.com' },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-fg-tertiary">About this MachineIQ installation.</p>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border">
            {rows.map(({ label, value }) => (
              <tr key={label} className="hover:bg-surface-secondary">
                <td className="w-44 px-4 py-3 font-medium text-fg-tertiary">{label}</td>
                <td className="px-4 py-3 text-fg-secondary">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('commercial');

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get('tab') as Tab | null;
    if (requestedTab && TABS.some((tab) => tab.key === requestedTab)) setActiveTab(requestedTab);
  }, []);

  return (
    <>
      <PageHeader title="Settings" description="Configure master data, access control, numbering, notifications, and platform defaults." />

      {/* Tab bar */}
      <div className="mb-6 border-b border-border">
        <nav className="-mb-px flex gap-0 overflow-x-auto" aria-label="Settings tabs">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)} className={clsx('flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors', activeTab === key ? 'border-brand-600 text-brand-600' : 'border-transparent text-fg-tertiary hover:border-slate-300 dark:hover:border-slate-600 hover:text-fg-secondary')}>
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab panels */}
      {activeTab === 'commercial' && <CommercialTab />}
      {activeTab === 'roles' && <RolesTab />}
      {activeTab === 'permissions' && <PermissionsTab />}
      {activeTab === 'documentTypes' && <DocumentTypesTab />}
      {activeTab === 'notifications' && <NotificationsTab />}
      {activeTab === 'platform' && <PlatformTab />}
    </>
  );
}

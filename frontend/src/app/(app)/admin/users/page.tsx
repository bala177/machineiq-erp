'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { Users, Plus, Pencil, Trash2, AlertTriangle, Search, X, ChevronDown } from 'lucide-react';
import { ROLE_KEYS, roleColor, roleLabel } from '@/lib/roles';

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${roleColor(role)}`}>
      {roleLabel(role)}
    </span>
  );
}

function Avatar({ firstName, lastName }: { firstName?: string; lastName?: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">
      {firstName?.[0]}{lastName?.[0]}
    </div>
  );
}

/* ─── Add User Form ─── */
function AddUserForm({
  departments,
  onSuccess,
  onCancel,
}: {
  departments: any[];
  onSuccess: (user: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    role: 'designer', departmentId: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const created = await api.post<any>('/auth/register', form);
      onSuccess(created.user ?? created);
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5 px-5 py-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-fg-secondary">First Name <span className="text-red-500">*</span></label>
          <input autoComplete="off" className="input-field" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} required disabled={saving} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Last Name <span className="text-red-500">*</span></label>
          <input autoComplete="off" className="input-field" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} required disabled={saving} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Email <span className="text-red-500">*</span></label>
        <input type="email" autoComplete="off" className="input-field" value={form.email} onChange={(e) => set('email', e.target.value)} required disabled={saving} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-fg-secondary">
          Password <span className="text-red-500">*</span>
          <span className="ml-2 text-xs font-normal text-fg-muted">Min 10 chars, upper + lower + number</span>
        </label>
        <input type="password" autoComplete="new-password" className="input-field" value={form.password} onChange={(e) => set('password', e.target.value)} required disabled={saving} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Role <span className="text-red-500">*</span></label>
          <select className="input-field" value={form.role} onChange={(e) => set('role', e.target.value)} disabled={saving}>
            {ROLE_KEYS.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Department</label>
          <select className="input-field" value={form.departmentId} onChange={(e) => set('departmentId', e.target.value)} disabled={saving}>
            <option value="">No department</option>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <button type="button" onClick={onCancel} className="btn-ghost" disabled={saving}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Creating…' : 'Create User'}
        </button>
      </div>
    </form>
  );
}

/* ─── Edit User Form ─── */
function EditUserForm({
  user,
  departments,
  onSuccess,
  onCancel,
}: {
  user: any;
  departments: any[];
  onSuccess: (updated: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    firstName:    user.firstName  ?? '',
    lastName:     user.lastName   ?? '',
    role:         user.role       ?? 'designer',
    departmentId: user.departmentId?._id ?? user.departmentId ?? '',
    title:        user.title      ?? '',
    phone:        user.phone      ?? '',
    isActive:     user.isActive   ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await api.patch<any>(`/users/${user._id}`, form);
      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5 px-5 py-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-fg-secondary">First Name</label>
          <input autoComplete="off" className="input-field" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} disabled={saving} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Last Name</label>
          <input autoComplete="off" className="input-field" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} disabled={saving} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Role</label>
          <select className="input-field" value={form.role} onChange={(e) => set('role', e.target.value)} disabled={saving}>
            {ROLE_KEYS.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Department</label>
          <select className="input-field" value={form.departmentId} onChange={(e) => set('departmentId', e.target.value)} disabled={saving}>
            <option value="">No department</option>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Job Title</label>
          <input autoComplete="off" className="input-field" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Senior Engineer" disabled={saving} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Phone</label>
          <input autoComplete="off" className="input-field" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+1 555 000 0000" disabled={saving} />
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary/50 px-4 py-3">
        <input
          id="isActive"
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => set('isActive', e.target.checked)}
          disabled={saving}
          className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-fg-secondary">
          Account active — user can sign in
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <button type="button" onClick={onCancel} className="btn-ghost" disabled={saving}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

/* ─── Delete Confirm ─── */
function DeleteConfirm({
  user,
  onConfirm,
  onCancel,
}: {
  user: any;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await api.delete(`/users/${user._id}`);
      onConfirm();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
      setDeleting(false);
    }
  };

  return (
    <div className="px-5 py-5 space-y-4">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-fg">
            Deactivate {user.firstName} {user.lastName}?
          </p>
          <p className="mt-1 text-sm text-fg-muted">
            This soft-deletes the account and prevents future sign-in while preserving linked records and audit history. Admin users are protected.
          </p>
        </div>
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <button onClick={onCancel} className="btn-ghost" disabled={deleting}>Cancel</button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-60"
        >
          {deleting ? 'Deactivating…' : 'Deactivate User'}
        </button>
      </div>
    </div>
  );
}

/* ─── Highlight matching text ─── */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

/* ─── Main page ─── */
export default function AdminUsersPage() {
  const [users, setUsers]           = useState<any[]>([]);
  const [departments, setDeps]      = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [addOpen, setAddOpen]       = useState(false);
  const [editUser, setEditUser]     = useState<any | null>(null);
  const [deleteUser, setDeleteUser] = useState<any | null>(null);

  // Search & filter state
  const [query, setQuery]         = useState('');
  const [roleFilter, setRole]     = useState('');
  const [deptFilter, setDept]     = useState('');
  const [statusFilter, setStatus] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<any[]>('/users'),
      api.get<any[]>('/departments'),
    ])
      .then(([u, d]) => { setUsers(u); setDeps(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const fullName = `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase();
      const email    = (u.email ?? '').toLowerCase();
      const role     = u.role ?? '';
      const deptId   = u.departmentId?._id ?? u.departmentId ?? '';
      const active   = u.isActive !== false;

      if (q && !fullName.includes(q) && !email.includes(q) && !role.includes(q) && !(u.departmentId?.name ?? '').toLowerCase().includes(q) && !(u.title ?? '').toLowerCase().includes(q)) return false;
      if (roleFilter && role !== roleFilter) return false;
      if (deptFilter && deptId !== deptFilter) return false;
      if (statusFilter === 'active' && !active) return false;
      if (statusFilter === 'inactive' && active) return false;
      return true;
    });
  }, [users, query, roleFilter, deptFilter, statusFilter]);

  const hasFilters = query || roleFilter || deptFilter || statusFilter;
  const clearFilters = () => { setQuery(''); setRole(''); setDept(''); setStatus(''); };

  const handleAdded = (user: any) => {
    setUsers((prev) => [...prev, user].sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)));
    setAddOpen(false);
  };

  const handleUpdated = (updated: any) => {
    setUsers((prev) => prev.map((u) => u._id === updated._id ? updated : u));
    setEditUser(null);
  };

  const handleDeleted = () => {
    setUsers((prev) => prev.filter((u) => u._id !== deleteUser._id));
    setDeleteUser(null);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <PageHeader
        title="User Management"
        description="Manage user accounts and role assignments"
        actions={
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add User
          </button>
        }
      />

      {/* Search & filter bar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
          <input
            type="text"
            placeholder="Search by name, email, role, department…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field w-full pl-9 pr-8"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-fg-muted hover:text-fg"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Role filter */}
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRole(e.target.value)}
            className="input-field appearance-none pr-8 min-w-[140px]"
          >
            <option value="">All Roles</option>
            {ROLE_KEYS.map((r) => (
              <option key={r} value={r}>{roleLabel(r)}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted" />
        </div>

        {/* Department filter */}
        <div className="relative">
          <select
            value={deptFilter}
            onChange={(e) => setDept(e.target.value)}
            className="input-field appearance-none pr-8 min-w-[160px]"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted" />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value)}
            className="input-field appearance-none pr-8 min-w-[130px]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted" />
        </div>
      </div>

      {/* Results summary */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-fg-muted">
          {hasFilters ? (
            <><span className="font-semibold text-fg">{filtered.length}</span> of {users.length} users</>
          ) : (
            <><span className="font-semibold text-fg">{users.length}</span> users total</>
          )}
        </p>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
            <X className="h-3 w-3" /> Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        users.length === 0
          ? <EmptyState icon={<Users className="h-10 w-10" />} title="No users found" />
          : (
            <div className="card flex flex-col items-center gap-3 py-14 text-center">
              <Search className="h-8 w-8 text-fg-muted" />
              <p className="text-sm font-semibold text-fg">No users match your search</p>
              <p className="text-sm text-fg-muted">Try adjusting your filters or search query.</p>
              <button onClick={clearFilters} className="btn-ghost text-sm">Clear filters</button>
            </div>
          )
      ) : (
        <>
          {/* Mobile */}
          <div className="space-y-2 sm:hidden">
            {filtered.map((u) => (
              <div key={u._id} className="card p-4">
                <div className="flex items-center gap-3">
                  <Avatar firstName={u.firstName} lastName={u.lastName} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-fg">
                      <Highlight text={`${u.firstName} ${u.lastName}`} query={query} />
                    </p>
                    <p className="text-xs text-fg-muted">
                      <Highlight text={u.email} query={query} />
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditUser(u)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-secondary hover:text-brand-600 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteUser(u)}
                      disabled={u.role === 'admin'}
                      title={u.role === 'admin' ? 'Admin users cannot be deleted' : 'Delete user'}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <RoleBadge role={u.role} />
                  {u.departmentId?.name && (
                    <span className="text-xs text-fg-muted">{u.departmentId.name}</span>
                  )}
                  <span className={`ml-auto flex items-center gap-1 text-xs font-medium ${u.isActive !== false ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${u.isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    {u.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden sm:block">
            <div className="card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-fg-muted">Name</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-fg-muted">Email</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-fg-muted">Role</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-fg-muted">Department</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-fg-muted">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-fg-muted w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((u) => (
                    <tr key={u._id} className="table-row">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar firstName={u.firstName} lastName={u.lastName} />
                          <div>
                            <p className="font-semibold text-fg">
                              <Highlight text={`${u.firstName} ${u.lastName}`} query={query} />
                            </p>
                            {u.title && <p className="text-xs text-fg-muted">{u.title}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-fg-muted">
                        <Highlight text={u.email} query={query} />
                      </td>
                      <td className="px-5 py-3.5">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-5 py-3.5 text-fg-muted">{u.departmentId?.name || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${u.isActive !== false ? 'text-emerald-600' : 'text-slate-400'}`}>
                          <span className={`h-2 w-2 rounded-full ${u.isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          {u.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditUser(u)}
                            title="Edit user"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-secondary hover:text-brand-600 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteUser(u)}
                            disabled={u.role === 'admin'}
                            title={u.role === 'admin' ? 'Admin users cannot be deleted' : 'Delete user'}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add User modal */}
      {addOpen && (
        <Modal title="Add User" onClose={() => setAddOpen(false)} noPadding>
          <AddUserForm
            departments={departments}
            onSuccess={handleAdded}
            onCancel={() => setAddOpen(false)}
          />
        </Modal>
      )}

      {/* Edit User modal */}
      {editUser && (
        <Modal title={`Edit — ${editUser.firstName} ${editUser.lastName}`} onClose={() => setEditUser(null)} noPadding>
          <EditUserForm
            user={editUser}
            departments={departments}
            onSuccess={handleUpdated}
            onCancel={() => setEditUser(null)}
          />
        </Modal>
      )}

      {/* Delete confirm modal */}
      {deleteUser && (
        <Modal title="Delete User" onClose={() => setDeleteUser(null)}>
          <DeleteConfirm
            user={deleteUser}
            onConfirm={handleDeleted}
            onCancel={() => setDeleteUser(null)}
          />
        </Modal>
      )}
    </>
  );
}

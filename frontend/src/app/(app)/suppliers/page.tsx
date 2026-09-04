'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import { BadgeCheck, Clock3, Pencil, Plus, Power, Search, Trash2, Truck } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Modal } from '@/components/ui/modal';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { SupplierForm } from '@/components/suppliers/supplier-form';
import { SupplierPayload, SupplierRecord } from '@/lib/suppliers';

export default function SuppliersPage() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierRecord | null>(null);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const deferredSearch = useDeferredValue(search.trim());

  async function load() {
    try {
      const query = new URLSearchParams();
      if (deferredSearch) query.set('search', deferredSearch);
      if (status) query.set('qualificationStatus', status);
      setSuppliers(await api.get<SupplierRecord[]>(`/suppliers${query.size ? `?${query}` : ''}`));
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), deferredSearch ? 180 : 0);
    return () => window.clearTimeout(timer);
  }, [deferredSearch, status]);

  function closeForm() {
    setOpen(false);
    setEditingSupplier(null);
    setFormError('');
  }

  function openEdit(supplier: SupplierRecord) {
    setEditingSupplier(supplier);
    setFormError('');
    setOpen(true);
  }

  async function saveSupplier(values: Partial<SupplierPayload>) {
    setSaving(true); setFormError('');
    try {
      if (editingSupplier) await api.patch(`/suppliers/${editingSupplier._id}`, values);
      else await api.post('/suppliers', values);
      closeForm();
      await load();
      return true;
    } catch (err: any) {
      setFormError(err.message || `Failed to ${editingSupplier ? 'update' : 'create'} supplier`);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function toggleSupplier(supplier: SupplierRecord) {
    try { await api.patch(`/suppliers/${supplier._id}`, { isActive: !supplier.isActive }); await load(); }
    catch (err: any) { setError(err.message || 'Failed to update supplier status'); }
  }

  async function removeSupplier(supplier: SupplierRecord) {
    if (!window.confirm(`Remove ${supplier.name}? This keeps its audit history.`)) return;
    try { await api.delete(`/suppliers/${supplier._id}`); await load(); }
    catch (err: any) { setError(err.message || 'Failed to remove supplier'); }
  }

  if (loading) return <LoadingSpinner />;
  const activeSuppliers = suppliers.filter((supplier) => supplier.isActive);
  const qualified = activeSuppliers.filter((supplier) => supplier.qualificationStatus === 'qualified').length;
  const averageLeadTime = activeSuppliers.length ? Math.round(activeSuppliers.reduce((sum, supplier) => sum + supplier.defaultLeadTimeDays, 0) / activeSuppliers.length) : 0;

  return <>
    <PageHeader title="Supplier Master" description="Govern approved supply partners, commercial terms, banking references, and default lead times." actions={<button className="btn-primary" onClick={() => { setEditingSupplier(null); setFormError(''); setOpen(true); }}><Plus className="h-4 w-4" /> New Supplier</button>} />
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      {[
        { label: 'Active suppliers', value: activeSuppliers.length, icon: Truck, tone: 'bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300' },
        { label: 'Qualified', value: qualified, icon: BadgeCheck, tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' },
        { label: 'Average lead time', value: `${averageLeadTime} days`, icon: Clock3, tone: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' },
      ].map(({ label, value, icon: Icon, tone }) => <div key={label} className="card flex items-center justify-between p-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{label}</p><p className="mt-2 text-2xl font-bold text-fg">{value}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}><Icon className="h-5 w-5" /></div></div>)}
    </div>
    <div className="card mb-5 p-4"><div className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-center"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" /><input className="input-field pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search supplier code, name, contact, or category" /></div><select className="input-field" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All qualification states</option><option value="pending">Pending</option><option value="qualified">Qualified</option><option value="suspended">Suspended</option></select><span className="text-sm text-fg-muted">{suppliers.length} records</span></div></div>
    {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

    {!suppliers.length ? <EmptyState icon={<Truck className="h-10 w-10" />} title="No suppliers found" description="Create the first governed supplier record." action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Supplier</button>} /> : <div className="card overflow-hidden">
      <div className="hidden overflow-x-auto md:block"><table className="w-full text-left text-sm"><thead><tr className="table-header"><th>Supplier</th><th>Contact</th><th>Category</th><th>Terms</th><th>Lead time</th><th>Qualification</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody className="divide-y divide-border">{suppliers.map((supplier) => <tr key={supplier._id} className="table-row">
        <td className="px-4 py-3"><p className="font-semibold text-fg">{supplier.name}</p><p className="font-mono text-xs text-fg-muted">{supplier.code}</p></td>
        <td className="px-4 py-3 text-fg-secondary"><p>{supplier.contactPerson || '—'}</p><p className="text-xs text-fg-muted">{supplier.email || supplier.phone || 'No contact'}</p></td>
        <td className="px-4 py-3 text-fg-secondary">{supplier.category || '—'}</td><td className="px-4 py-3 text-fg-secondary">{supplier.paymentTerms || '—'} · {supplier.currencyCode}</td><td className="px-4 py-3 text-fg-secondary">{supplier.defaultLeadTimeDays} days</td>
        <td className="px-4 py-3"><span className={supplier.qualificationStatus === 'qualified' ? 'badge-green' : supplier.qualificationStatus === 'suspended' ? 'badge-red' : 'badge-amber'}>{supplier.qualificationStatus}</span></td><td className="px-4 py-3"><span className={supplier.isActive ? 'badge-green' : 'badge-gray'}>{supplier.isActive ? 'Active' : 'Inactive'}</span></td>
        <td className="px-4 py-3"><div className="flex justify-end gap-1"><button className="btn-ghost p-2" title="Edit supplier" onClick={() => openEdit(supplier)}><Pencil className="h-4 w-4" /></button><button className="btn-ghost p-2" title={supplier.isActive ? 'Deactivate supplier' : 'Activate supplier'} onClick={() => void toggleSupplier(supplier)}><Power className="h-4 w-4" /></button>{user?.role === 'admin' && <button className="btn-ghost p-2 text-red-600" title="Remove supplier" onClick={() => void removeSupplier(supplier)}><Trash2 className="h-4 w-4" /></button>}</div></td>
      </tr>)}</tbody></table></div>
      <div className="divide-y divide-border md:hidden">{suppliers.map((supplier) => <div key={supplier._id} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-fg">{supplier.name}</p><p className="font-mono text-xs text-fg-muted">{supplier.code}</p></div><div className="flex items-center gap-1"><span className={supplier.isActive ? 'badge-green' : 'badge-gray'}>{supplier.isActive ? 'Active' : 'Inactive'}</span><button className="btn-ghost p-2" title="Edit supplier" onClick={() => openEdit(supplier)}><Pencil className="h-4 w-4" /></button><button className="btn-ghost p-2" title={supplier.isActive ? 'Deactivate supplier' : 'Activate supplier'} onClick={() => void toggleSupplier(supplier)}><Power className="h-4 w-4" /></button>{user?.role === 'admin' && <button className="btn-ghost p-2 text-red-600" title="Remove supplier" onClick={() => void removeSupplier(supplier)}><Trash2 className="h-4 w-4" /></button>}</div></div><div className="mt-3 grid grid-cols-2 gap-2 text-sm text-fg-secondary"><span>{supplier.category || 'Uncategorized'}</span><span>{supplier.currencyCode}</span><span>{supplier.contactPerson || 'No contact'}</span><span>{supplier.defaultLeadTimeDays} days</span></div></div>)}</div>
    </div>}

    {open && <Modal title={editingSupplier ? `Edit ${editingSupplier.name}` : 'New Supplier'} onClose={closeForm} size="lg" noPadding><SupplierForm initialValues={editingSupplier} saving={saving} error={formError} onSubmit={saveSupplier} onCancel={closeForm} /></Modal>}
  </>;
}

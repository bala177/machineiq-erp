'use client';

import { FormEvent, useDeferredValue, useEffect, useState } from 'react';
import { BadgeCheck, Clock3, Plus, Search, Truck } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Modal } from '@/components/ui/modal';
import { api } from '@/lib/api';

type Supplier = {
  _id: string; code: string; name: string; contactPerson?: string; email?: string; phone?: string;
  category?: string; paymentTerms?: string; taxRegistrationNumber?: string; currencyCode: string;
  qualificationStatus: 'pending' | 'qualified' | 'suspended'; defaultLeadTimeDays: number; isActive: boolean;
};

const emptyForm = {
  name: '', contactPerson: '', email: '', phone: '', address: '', category: '', paymentTerms: '',
  taxRegistrationNumber: '', currencyCode: 'INR', qualificationStatus: 'pending', defaultLeadTimeDays: 0,
  bankDetails: { accountName: '', accountNumber: '', bankName: '', ifscSwiftCode: '' },
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const deferredSearch = useDeferredValue(search.trim());

  async function load() {
    try {
      const query = new URLSearchParams();
      if (deferredSearch) query.set('search', deferredSearch);
      if (status) query.set('qualificationStatus', status);
      const data = await api.get<Supplier[]>(`/suppliers${query.size ? `?${query}` : ''}`);
      setSuppliers(data); setError('');
    } catch (err: any) { setError(err.message || 'Failed to load suppliers'); }
    finally { setLoading(false); }
  }

  useEffect(() => { const timer = window.setTimeout(() => void load(), deferredSearch ? 180 : 0); return () => window.clearTimeout(timer); }, [deferredSearch, status]);

  async function createSupplier(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    try { await api.post('/suppliers', form); setOpen(false); setForm(emptyForm); await load(); }
    catch (err: any) { setError(err.message || 'Failed to create supplier'); }
    finally { setSaving(false); }
  }

  if (loading) return <LoadingSpinner />;
  const qualified = suppliers.filter((supplier) => supplier.qualificationStatus === 'qualified').length;
  const averageLeadTime = suppliers.length ? Math.round(suppliers.reduce((sum, supplier) => sum + supplier.defaultLeadTimeDays, 0) / suppliers.length) : 0;

  return <>
    <PageHeader title="Supplier Master" description="Govern approved supply partners, commercial terms, banking references, and default lead times." actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Supplier</button>} />
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      {[
        { label: 'Active suppliers', value: suppliers.length, icon: Truck, tone: 'bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300' },
        { label: 'Qualified', value: qualified, icon: BadgeCheck, tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' },
        { label: 'Average lead time', value: `${averageLeadTime} days`, icon: Clock3, tone: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' },
      ].map(({ label, value, icon: Icon, tone }) => <div key={label} className="card flex items-center justify-between p-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{label}</p><p className="mt-2 text-2xl font-bold text-fg">{value}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}><Icon className="h-5 w-5" /></div></div>)}
    </div>
    <div className="card mb-5 p-4"><div className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-center"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" /><input className="input-field pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search supplier code, name, contact, or category" /></div><select className="input-field" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All qualification states</option><option value="pending">Pending</option><option value="qualified">Qualified</option><option value="suspended">Suspended</option></select><span className="text-sm text-fg-muted">{suppliers.length} records</span></div></div>
    {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {!suppliers.length ? <EmptyState icon={<Truck className="h-10 w-10" />} title="No suppliers found" description="Create the first governed supplier record." action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Supplier</button>} /> : <div className="card overflow-hidden"><div className="hidden overflow-x-auto md:block"><table className="w-full text-left text-sm"><thead><tr className="table-header"><th>Supplier</th><th>Contact</th><th>Category</th><th>Terms</th><th>Lead time</th><th>Qualification</th></tr></thead><tbody className="divide-y divide-border">{suppliers.map((supplier) => <tr key={supplier._id} className="table-row"><td className="px-4 py-3"><p className="font-semibold text-fg">{supplier.name}</p><p className="font-mono text-xs text-fg-muted">{supplier.code}</p></td><td className="px-4 py-3 text-fg-secondary"><p>{supplier.contactPerson || '—'}</p><p className="text-xs text-fg-muted">{supplier.email || supplier.phone || 'No contact'}</p></td><td className="px-4 py-3 text-fg-secondary">{supplier.category || '—'}</td><td className="px-4 py-3 text-fg-secondary">{supplier.paymentTerms || '—'} · {supplier.currencyCode}</td><td className="px-4 py-3 text-fg-secondary">{supplier.defaultLeadTimeDays} days</td><td className="px-4 py-3"><span className={supplier.qualificationStatus === 'qualified' ? 'badge-green' : supplier.qualificationStatus === 'suspended' ? 'badge-red' : 'badge-amber'}>{supplier.qualificationStatus}</span></td></tr>)}</tbody></table></div><div className="divide-y divide-border md:hidden">{suppliers.map((supplier) => <div key={supplier._id} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-fg">{supplier.name}</p><p className="font-mono text-xs text-fg-muted">{supplier.code}</p></div><span className={supplier.qualificationStatus === 'qualified' ? 'badge-green' : 'badge-amber'}>{supplier.qualificationStatus}</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-sm text-fg-secondary"><span>{supplier.category || 'Uncategorised'}</span><span>{supplier.defaultLeadTimeDays} days</span><span>{supplier.paymentTerms || 'No terms'}</span><span>{supplier.currencyCode}</span></div></div>)}</div></div>}
    {open && <Modal title="Create supplier" onClose={() => setOpen(false)} size="lg"><form className="grid gap-4 sm:grid-cols-2" onSubmit={createSupplier}>
      <label className="text-sm font-medium text-fg">Supplier name<input className="input-field mt-1.5" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      <label className="text-sm font-medium text-fg">Category<input className="input-field mt-1.5" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
      <label className="text-sm font-medium text-fg">Contact person<input className="input-field mt-1.5" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></label>
      <label className="text-sm font-medium text-fg">Email<input className="input-field mt-1.5" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
      <label className="text-sm font-medium text-fg">Payment terms<input className="input-field mt-1.5" value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} /></label>
      <label className="text-sm font-medium text-fg">Tax registration<input className="input-field mt-1.5" value={form.taxRegistrationNumber} onChange={(e) => setForm({ ...form, taxRegistrationNumber: e.target.value })} /></label>
      <label className="text-sm font-medium text-fg">Currency<input className="input-field mt-1.5" required maxLength={8} value={form.currencyCode} onChange={(e) => setForm({ ...form, currencyCode: e.target.value.toUpperCase() })} /></label>
      <label className="text-sm font-medium text-fg">Default lead time<input className="input-field mt-1.5" type="number" min="0" value={form.defaultLeadTimeDays} onChange={(e) => setForm({ ...form, defaultLeadTimeDays: Number(e.target.value) })} /></label>
      <label className="text-sm font-medium text-fg">Qualification<select className="input-field mt-1.5" value={form.qualificationStatus} onChange={(e) => setForm({ ...form, qualificationStatus: e.target.value })}><option value="pending">Pending</option><option value="qualified">Qualified</option><option value="suspended">Suspended</option></select></label>
      <label className="text-sm font-medium text-fg">Bank name<input className="input-field mt-1.5" value={form.bankDetails.bankName} onChange={(e) => setForm({ ...form, bankDetails: { ...form.bankDetails, bankName: e.target.value } })} /></label>
      <div className="flex justify-end gap-2 border-t border-border pt-4 sm:col-span-2"><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create supplier'}</button></div>
    </form></Modal>}
  </>;
}

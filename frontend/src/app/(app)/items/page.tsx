'use client';

import { FormEvent, useDeferredValue, useEffect, useState } from 'react';
import { AlertTriangle, Boxes, CircleDollarSign, PackageCheck, Plus, Ruler, Search, Tags } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Modal } from '@/components/ui/modal';
import { api } from '@/lib/api';

type Reference = { _id: string; code: string; name: string };
type ItemRecord = {
  _id: string;
  code: string;
  name: string;
  description?: string;
  categoryId: Reference;
  uomId: Reference;
  itemType: 'raw' | 'component' | 'assembly' | 'service';
  standardCost: number;
  sellingPrice: number;
  isStockItem: boolean;
  reorderLevel: number;
  leadTimeDays: number;
  isActive: boolean;
};

const initialForm = {
  code: '', name: '', description: '', categoryId: '', uomId: '', itemType: 'component',
  standardCost: 0, sellingPrice: 0, taxPercent: 0, reorderLevel: 0, leadTimeDays: 0, isStockItem: true,
};
const initialCategoryForm = { code: '', name: '' };
const initialUomForm = { code: '', name: '', conversionFactor: 1 };

function money(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}

export default function ItemsPage() {
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [categories, setCategories] = useState<Reference[]>([]);
  const [uoms, setUoms] = useState<Reference[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [uomOpen, setUomOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialForm);
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm);
  const [uomForm, setUomForm] = useState(initialUomForm);
  const deferredSearch = useDeferredValue(search.trim());

  async function loadData() {
    try {
      const query = new URLSearchParams();
      if (deferredSearch) query.set('search', deferredSearch);
      if (typeFilter) query.set('itemType', typeFilter);
      const suffix = query.size ? `?${query.toString()}` : '';
      const [itemData, categoryData, uomData] = await Promise.all([
        api.get<ItemRecord[]>(`/items${suffix}`),
        api.get<Reference[]>('/items/categories'),
        api.get<Reference[]>('/items/uoms'),
      ]);
      setItems(itemData);
      setCategories(categoryData);
      setUoms(uomData);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load item master');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadData(), deferredSearch ? 180 : 0);
    return () => window.clearTimeout(timeout);
  }, [deferredSearch, typeFilter]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/items', form);
      setCreateOpen(false);
      setForm(initialForm);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create item');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCategory(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/items/categories', categoryForm);
      setCategoryOpen(false);
      setCategoryForm(initialCategoryForm);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create item category');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateUom(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/items/uoms', uomForm);
      setUomOpen(false);
      setUomForm(initialUomForm);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create UOM');
    } finally {
      setSaving(false);
    }
  }

  function openCreateItem() {
    if (!categories.length) setCategoryOpen(true);
    else if (!uoms.length) setUomOpen(true);
    else setCreateOpen(true);
  }

  if (loading) return <LoadingSpinner />;

  const stockItems = items.filter((item) => item.isStockItem).length;
  const reorderItems = items.filter((item) => item.isStockItem && item.reorderLevel > 0).length;
  const inventoryValue = items.reduce((sum, item) => sum + item.standardCost, 0);

  return (
    <>
      <PageHeader
        title="Item Master"
        description="Govern materials, bought-out components, assemblies, and services across engineering and ERP workflows."
        actions={
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => setCategoryOpen(true)}><Tags className="h-4 w-4" /> New Category</button>
            <button className="btn-secondary" onClick={() => setUomOpen(true)}><Ruler className="h-4 w-4" /> New UOM</button>
            <button className="btn-primary" onClick={openCreateItem}><Plus className="h-4 w-4" /> New Item</button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Active items', value: items.length, icon: Boxes, tone: 'bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300' },
          { label: 'Stock controlled', value: stockItems, icon: PackageCheck, tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' },
          { label: 'Reorder rules', value: reorderItems, icon: AlertTriangle, tone: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' },
          { label: 'Standard value', value: money(inventoryValue), icon: CircleDollarSign, tone: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="card flex items-center justify-between p-5">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{label}</p><p className="mt-2 text-2xl font-bold text-fg">{value}</p></div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}><Icon className="h-5 w-5" /></div>
          </div>
        ))}
      </div>

      <div className="card mb-5 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input className="input-field pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search item code, name, or description" />
          </div>
          <select className="input-field" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="">All item types</option>
            <option value="raw">Raw material</option><option value="component">Component</option><option value="assembly">Assembly</option><option value="service">Service</option>
          </select>
          <span className="text-sm text-fg-muted">{items.length} records</span>
        </div>
      </div>

      {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">{error}</div>}

      {!categories.length || !uoms.length ? (
        <EmptyState
          icon={<Boxes className="h-10 w-10" />}
          title="Item references need setup"
          description="Create at least one Item Category and UOM before adding items."
          action={<button className="btn-primary" onClick={openCreateItem}><Plus className="h-4 w-4" /> Continue setup</button>}
        />
      ) : items.length === 0 ? (
        <EmptyState icon={<Boxes className="h-10 w-10" />} title="No items found" description="Create the first governed item for your engineering and ERP workflows." action={<button className="btn-primary" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New Item</button>} />
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead><tr className="table-header"><th>Item</th><th>Category</th><th>Type</th><th>UOM</th><th>Standard cost</th><th>Reorder</th><th>Status</th></tr></thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => <tr key={item._id} className="hover:bg-surface-secondary/60">
                  <td className="px-4 py-3"><p className="font-semibold text-fg">{item.name}</p><p className="font-mono text-xs text-fg-muted">{item.code}</p></td>
                  <td className="px-4 py-3 text-fg-secondary">{item.categoryId?.name || '—'}</td>
                  <td className="px-4 py-3"><span className="badge-blue capitalize">{item.itemType}</span></td>
                  <td className="px-4 py-3 text-fg-secondary">{item.uomId?.code || '—'}</td>
                  <td className="px-4 py-3 font-medium text-fg">{money(item.standardCost)}</td>
                  <td className="px-4 py-3 text-fg-secondary">{item.reorderLevel}</td>
                  <td className="px-4 py-3"><span className={item.isActive ? 'badge-green' : 'badge-gray'}>{item.isActive ? 'Active' : 'Inactive'}</span></td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-border md:hidden">
            {items.map((item) => <div key={item._id} className="p-4"><div className="flex items-start justify-between"><div><p className="font-semibold text-fg">{item.name}</p><p className="font-mono text-xs text-fg-muted">{item.code}</p></div><span className="badge-blue capitalize">{item.itemType}</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-sm text-fg-secondary"><span>{item.categoryId?.name}</span><span>{item.uomId?.code}</span><span>{money(item.standardCost)}</span><span>Reorder {item.reorderLevel}</span></div></div>)}
          </div>
        </div>
      )}

      {createOpen && <Modal title="Create item" onClose={() => setCreateOpen(false)} size="lg">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleCreate}>
          <label className="text-sm font-medium text-fg">Item code<input className="input-field mt-1.5" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></label>
          <label className="text-sm font-medium text-fg">Item name<input className="input-field mt-1.5" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="text-sm font-medium text-fg">Category<select className="input-field mt-1.5" required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">Select category</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.code} — {category.name}</option>)}</select></label>
          <label className="text-sm font-medium text-fg">UOM<select className="input-field mt-1.5" required value={form.uomId} onChange={(e) => setForm({ ...form, uomId: e.target.value })}><option value="">Select UOM</option>{uoms.map((uom) => <option key={uom._id} value={uom._id}>{uom.code} — {uom.name}</option>)}</select></label>
          <label className="text-sm font-medium text-fg">Item type<select className="input-field mt-1.5" value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value })}><option value="raw">Raw material</option><option value="component">Component</option><option value="assembly">Assembly</option><option value="service">Service</option></select></label>
          <label className="text-sm font-medium text-fg">Standard cost<input className="input-field mt-1.5" type="number" min="0" value={form.standardCost} onChange={(e) => setForm({ ...form, standardCost: Number(e.target.value) })} /></label>
          <label className="text-sm font-medium text-fg">Selling price<input className="input-field mt-1.5" type="number" min="0" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })} /></label>
          <label className="text-sm font-medium text-fg">Reorder level<input className="input-field mt-1.5" type="number" min="0" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })} /></label>
          <label className="text-sm font-medium text-fg sm:col-span-2">Description<textarea className="input-field mt-1.5 min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <div className="flex justify-end gap-2 border-t border-border pt-4 sm:col-span-2"><button type="button" className="btn-ghost" onClick={() => setCreateOpen(false)}>Cancel</button><button className="btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create item'}</button></div>
        </form>
      </Modal>}

      {categoryOpen && <Modal title="Create item category" onClose={() => setCategoryOpen(false)}>
        <form className="space-y-4" onSubmit={handleCreateCategory}>
          <label className="block text-sm font-medium text-fg">Category code<input className="input-field mt-1.5" required value={categoryForm.code} onChange={(event) => setCategoryForm({ ...categoryForm, code: event.target.value.toUpperCase() })} /></label>
          <label className="block text-sm font-medium text-fg">Category name<input className="input-field mt-1.5" required value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} /></label>
          <div className="flex justify-end gap-2 border-t border-border pt-4"><button type="button" className="btn-ghost" onClick={() => setCategoryOpen(false)}>Cancel</button><button className="btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create category'}</button></div>
        </form>
      </Modal>}

      {uomOpen && <Modal title="Create unit of measure" onClose={() => setUomOpen(false)}>
        <form className="space-y-4" onSubmit={handleCreateUom}>
          <label className="block text-sm font-medium text-fg">UOM code<input className="input-field mt-1.5" required value={uomForm.code} onChange={(event) => setUomForm({ ...uomForm, code: event.target.value.toUpperCase() })} /></label>
          <label className="block text-sm font-medium text-fg">UOM name<input className="input-field mt-1.5" required value={uomForm.name} onChange={(event) => setUomForm({ ...uomForm, name: event.target.value })} /></label>
          <label className="block text-sm font-medium text-fg">Conversion factor<input className="input-field mt-1.5" type="number" min="0.000001" step="any" required value={uomForm.conversionFactor} onChange={(event) => setUomForm({ ...uomForm, conversionFactor: Number(event.target.value) })} /></label>
          <div className="flex justify-end gap-2 border-t border-border pt-4"><button type="button" className="btn-ghost" onClick={() => setUomOpen(false)}>Cancel</button><button className="btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create UOM'}</button></div>
        </form>
      </Modal>}
    </>
  );
}
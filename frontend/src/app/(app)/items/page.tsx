'use client';

import { FormEvent, useDeferredValue, useEffect, useState } from 'react';
import { AlertTriangle, Boxes, CircleDollarSign, PackageCheck, Pencil, Plus, Power, Ruler, Search, Tags, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Modal } from '@/components/ui/modal';
import { api } from '@/lib/api';

type Reference = { _id: string; code: string; name: string };
type UomReference = Reference & { conversionFactor: number };
type ItemRecord = {
  _id: string;
  code: string;
  name: string;
  description?: string;
  manufacturerPartNumber?: string;
  barcode?: string;
  salesDescription?: string;
  purchaseDescription?: string;
  salesEnabled: boolean;
  purchaseEnabled: boolean;
  categoryId: Reference;
  uomId: Reference;
  itemType: 'raw' | 'component' | 'assembly' | 'service';
  standardCost: number;
  sellingPrice: number;
  hsnSac?: string;
  taxPercent: number;
  isStockItem: boolean;
  reorderLevel: number;
  defaultSupplierId?: Reference | null;
  leadTimeDays: number;
  isActive: boolean;
};

const initialForm = {
  code: '', name: '', description: '', manufacturerPartNumber: '', barcode: '', salesDescription: '', purchaseDescription: '', salesEnabled: true, purchaseEnabled: true, categoryId: '', uomId: '', itemType: 'component',
  standardCost: 0, sellingPrice: 0, hsnSac: '', taxPercent: 0, reorderLevel: 0, leadTimeDays: 0,
  defaultSupplierId: '', isStockItem: true, isActive: true,
};
const initialCategoryForm = { code: '', name: '' };
const initialUomForm = { code: '', name: '', conversionFactor: 1 };

function money(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}

export default function ItemsPage() {
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [categories, setCategories] = useState<Reference[]>([]);
  const [uoms, setUoms] = useState<UomReference[]>([]);
  const [suppliers, setSuppliers] = useState<Reference[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemRecord | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [uomOpen, setUomOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState('');
  const [editingUomId, setEditingUomId] = useState('');
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
      const [itemData, categoryData, uomData, supplierData] = await Promise.all([
        api.get<ItemRecord[]>(`/items${suffix}`),
        api.get<Reference[]>('/items/categories'),
        api.get<UomReference[]>('/items/uoms'),
        api.get<Reference[]>('/suppliers'),
      ]);
      setItems(itemData);
      setCategories(categoryData);
      setUoms(uomData);
      setSuppliers(supplierData);
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
      const payload = { ...form, defaultSupplierId: form.defaultSupplierId || undefined };
      if (editingItem) {
        const { code: _code, ...updatePayload } = payload;
        await api.patch(`/items/${editingItem._id}`, updatePayload);
      } else await api.post('/items', payload);
      setCreateOpen(false);
      setEditingItem(null);
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
      if (editingCategoryId) await api.patch(`/items/categories/${editingCategoryId}`, { name: categoryForm.name });
      else await api.post('/items/categories', categoryForm);
      setCategoryOpen(false);
      setEditingCategoryId('');
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
      if (editingUomId) await api.patch(`/items/uoms/${editingUomId}`, { name: uomForm.name, conversionFactor: uomForm.conversionFactor });
      else await api.post('/items/uoms', uomForm);
      setUomOpen(false);
      setEditingUomId('');
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

  function openEditItem(item: ItemRecord) {
    setEditingItem(item);
    setForm({
      code: item.code, name: item.name, description: item.description || '', manufacturerPartNumber: item.manufacturerPartNumber || '', barcode: item.barcode || '', salesDescription: item.salesDescription || '', purchaseDescription: item.purchaseDescription || '', salesEnabled: item.salesEnabled ?? true, purchaseEnabled: item.purchaseEnabled ?? true,
      categoryId: item.categoryId?._id || '', uomId: item.uomId?._id || '', itemType: item.itemType,
      standardCost: item.standardCost, sellingPrice: item.sellingPrice, hsnSac: item.hsnSac || '',
      taxPercent: item.taxPercent || 0, reorderLevel: item.reorderLevel, leadTimeDays: item.leadTimeDays,
      defaultSupplierId: item.defaultSupplierId?._id || '', isStockItem: item.isStockItem, isActive: item.isActive,
    });
    setCreateOpen(true);
  }

  async function toggleItem(item: ItemRecord) {
    try {
      await api.patch(`/items/${item._id}`, { isActive: !item.isActive });
      await loadData();
    } catch (err: any) { setError(err.message || 'Failed to update item status'); }
  }

  async function removeItem(item: ItemRecord) {
    if (!window.confirm(`Remove ${item.name}? This keeps its audit history.`)) return;
    try {
      await api.delete(`/items/${item._id}`);
      await loadData();
    } catch (err: any) { setError(err.message || 'Failed to remove item'); }
  }

  async function removeReference(kind: 'categories' | 'uoms', id: string) {
    if (!window.confirm(`Remove this ${kind === 'categories' ? 'category' : 'UOM'}?`)) return;
    try {
      await api.delete(`/items/${kind}/${id}`);
      await loadData();
    } catch (err: any) { setError(err.message || `Failed to remove ${kind === 'categories' ? 'category' : 'UOM'}`); }
  }

  if (loading) return <LoadingSpinner />;

  const activeItems = items.filter((item) => item.isActive).length;
  const stockItems = items.filter((item) => item.isActive && item.isStockItem).length;
  const reorderItems = items.filter((item) => item.isActive && item.isStockItem && item.reorderLevel > 0).length;
  const averageStandardCost = activeItems ? items.filter((item) => item.isActive).reduce((sum, item) => sum + item.standardCost, 0) / activeItems : 0;

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
          { label: 'Active items', value: activeItems, icon: Boxes, tone: 'bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300' },
          { label: 'Stock controlled', value: stockItems, icon: PackageCheck, tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' },
          { label: 'Reorder rules', value: reorderItems, icon: AlertTriangle, tone: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' },
          { label: 'Avg. standard cost', value: money(averageStandardCost), icon: CircleDollarSign, tone: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300' },
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
              <thead><tr className="table-header"><th>Item</th><th>Category</th><th>Type</th><th>UOM</th><th>Standard cost</th><th>Reorder</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => <tr key={item._id} className="hover:bg-surface-secondary/60">
                  <td className="px-4 py-3"><p className="font-semibold text-fg">{item.name}</p><p className="font-mono text-xs text-fg-muted">{item.code}</p></td>
                  <td className="px-4 py-3 text-fg-secondary">{item.categoryId?.name || '—'}</td>
                  <td className="px-4 py-3"><span className="badge-blue capitalize">{item.itemType}</span></td>
                  <td className="px-4 py-3 text-fg-secondary">{item.uomId?.code || '—'}</td>
                  <td className="px-4 py-3 font-medium text-fg">{money(item.standardCost)}</td>
                  <td className="px-4 py-3 text-fg-secondary">{item.reorderLevel}</td>
                  <td className="px-4 py-3"><span className={item.isActive ? 'badge-green' : 'badge-gray'}>{item.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-1"><button className="btn-ghost p-2" title="Edit item" onClick={() => openEditItem(item)}><Pencil className="h-4 w-4" /></button><button className="btn-ghost p-2" title={item.isActive ? 'Deactivate item' : 'Activate item'} onClick={() => void toggleItem(item)}><Power className="h-4 w-4" /></button><button className="btn-ghost p-2 text-red-600" title="Remove item" onClick={() => void removeItem(item)}><Trash2 className="h-4 w-4" /></button></div></td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-border md:hidden">
            {items.map((item) => <div key={item._id} className="p-4"><div className="flex items-start justify-between"><div><p className="font-semibold text-fg">{item.name}</p><p className="font-mono text-xs text-fg-muted">{item.code}</p></div><div className="flex items-center gap-1"><span className={item.isActive ? 'badge-green' : 'badge-gray'}>{item.isActive ? 'Active' : 'Inactive'}</span><button className="btn-ghost p-2" title="Edit item" onClick={() => openEditItem(item)}><Pencil className="h-4 w-4" /></button><button className="btn-ghost p-2" title={item.isActive ? 'Deactivate item' : 'Activate item'} onClick={() => void toggleItem(item)}><Power className="h-4 w-4" /></button><button className="btn-ghost p-2 text-red-600" title="Remove item" onClick={() => void removeItem(item)}><Trash2 className="h-4 w-4" /></button></div></div><div className="mt-3 grid grid-cols-2 gap-2 text-sm text-fg-secondary"><span>{item.categoryId?.name}</span><span>{item.uomId?.code}</span><span>{money(item.standardCost)}</span><span>Reorder {item.reorderLevel}</span></div></div>)}
          </div>
        </div>
      )}

      {createOpen && <Modal title={editingItem ? 'Edit item' : 'Create item'} onClose={() => { setCreateOpen(false); setEditingItem(null); setForm(initialForm); }} size="lg">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleCreate}>
          <label className="text-sm font-medium text-fg">Item code<input className="input-field mt-1.5" required disabled={!!editingItem} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></label>
          <label className="text-sm font-medium text-fg">Item name<input className="input-field mt-1.5" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="text-sm font-medium text-fg">Category<select className="input-field mt-1.5" required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">Select category</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.code} — {category.name}</option>)}</select></label>
          <label className="text-sm font-medium text-fg">UOM<select className="input-field mt-1.5" required value={form.uomId} onChange={(e) => setForm({ ...form, uomId: e.target.value })}><option value="">Select UOM</option>{uoms.map((uom) => <option key={uom._id} value={uom._id}>{uom.code} — {uom.name}</option>)}</select></label>
          <label className="text-sm font-medium text-fg">Item type<select className="input-field mt-1.5" value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value })}><option value="raw">Raw material</option><option value="component">Component</option><option value="assembly">Assembly</option><option value="service">Service</option></select></label>
          <label className="text-sm font-medium text-fg">Manufacturer part number<input className="input-field mt-1.5" value={form.manufacturerPartNumber} onChange={(e) => setForm({ ...form, manufacturerPartNumber: e.target.value })} placeholder="OEM / MPN identifier" /></label>
          <label className="text-sm font-medium text-fg">Barcode / EAN / UPC<input className="input-field mt-1.5" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="Scan or enter identifier" /></label>
          <label className="text-sm font-medium text-fg">Standard cost<input className="input-field mt-1.5" type="number" min="0" value={form.standardCost} onChange={(e) => setForm({ ...form, standardCost: Number(e.target.value) })} /></label>
          <label className="text-sm font-medium text-fg">Selling price<input className="input-field mt-1.5" type="number" min="0" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })} /></label>
          <label className="text-sm font-medium text-fg">HSN / SAC<input className="input-field mt-1.5" value={form.hsnSac} onChange={(e) => setForm({ ...form, hsnSac: e.target.value })} /></label>
          <label className="text-sm font-medium text-fg">Tax rate (%)<input className="input-field mt-1.5" type="number" min="0" max="100" value={form.taxPercent} onChange={(e) => setForm({ ...form, taxPercent: Number(e.target.value) })} /></label>
          <label className="text-sm font-medium text-fg">Reorder level<input className="input-field mt-1.5" type="number" min="0" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })} /></label>
          <label className="text-sm font-medium text-fg">Lead time (days)<input className="input-field mt-1.5" type="number" min="0" value={form.leadTimeDays} onChange={(e) => setForm({ ...form, leadTimeDays: Number(e.target.value) })} /></label>
          <label className="text-sm font-medium text-fg">Preferred supplier<select className="input-field mt-1.5" value={form.defaultSupplierId} onChange={(e) => setForm({ ...form, defaultSupplierId: e.target.value })}><option value="">No preferred supplier</option>{suppliers.map((supplier) => <option key={supplier._id} value={supplier._id}>{supplier.code} — {supplier.name}</option>)}</select></label>
          <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-fg"><input type="checkbox" checked={form.isStockItem} onChange={(e) => setForm({ ...form, isStockItem: e.target.checked })} /> Stock-controlled item</label>
          <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-fg"><input type="checkbox" checked={form.salesEnabled} onChange={(e) => setForm({ ...form, salesEnabled: e.target.checked })} /> Available on sales documents</label>
          <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-fg"><input type="checkbox" checked={form.purchaseEnabled} onChange={(e) => setForm({ ...form, purchaseEnabled: e.target.checked })} /> Available on purchase documents</label>
          <label className="text-sm font-medium text-fg sm:col-span-2">Description<textarea className="input-field mt-1.5 min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label className="text-sm font-medium text-fg">Sales description<textarea className="input-field mt-1.5 min-h-20" value={form.salesDescription} onChange={(e) => setForm({ ...form, salesDescription: e.target.value })} placeholder="Default description on quotes and invoices" /></label>
          <label className="text-sm font-medium text-fg">Purchase description<textarea className="input-field mt-1.5 min-h-20" value={form.purchaseDescription} onChange={(e) => setForm({ ...form, purchaseDescription: e.target.value })} placeholder="Default description on purchase orders" /></label>
          <div className="flex justify-end gap-2 border-t border-border pt-4 sm:col-span-2"><button type="button" className="btn-ghost" onClick={() => { setCreateOpen(false); setEditingItem(null); setForm(initialForm); }}>Cancel</button><button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : editingItem ? 'Save changes' : 'Create item'}</button></div>
        </form>
      </Modal>}

      {categoryOpen && <Modal title="Manage item categories" onClose={() => { setCategoryOpen(false); setEditingCategoryId(''); setCategoryForm(initialCategoryForm); }}>
        <form className="space-y-4" onSubmit={handleCreateCategory}>
          <label className="block text-sm font-medium text-fg">Category code<input className="input-field mt-1.5" required disabled={!!editingCategoryId} value={categoryForm.code} onChange={(event) => setCategoryForm({ ...categoryForm, code: event.target.value.toUpperCase() })} /></label>
          <label className="block text-sm font-medium text-fg">Category name<input className="input-field mt-1.5" required value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} /></label>
          <div className="max-h-48 divide-y divide-border overflow-y-auto border-y border-border">{categories.map((category) => <div key={category._id} className="flex items-center gap-2 py-2"><span className="min-w-0 flex-1 truncate text-sm">{category.code} — {category.name}</span><button type="button" className="btn-ghost p-2" title="Edit category" onClick={() => { setEditingCategoryId(category._id); setCategoryForm({ code: category.code, name: category.name }); }}><Pencil className="h-4 w-4" /></button><button type="button" className="btn-ghost p-2 text-red-600" title="Remove category" onClick={() => void removeReference('categories', category._id)}><Trash2 className="h-4 w-4" /></button></div>)}</div>
          <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => { setEditingCategoryId(''); setCategoryForm(initialCategoryForm); }}>{editingCategoryId ? 'Cancel edit' : 'Clear'}</button><button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : editingCategoryId ? 'Save changes' : 'Create category'}</button></div>
        </form>
      </Modal>}

      {uomOpen && <Modal title="Manage units of measure" onClose={() => { setUomOpen(false); setEditingUomId(''); setUomForm(initialUomForm); }}>
        <form className="space-y-4" onSubmit={handleCreateUom}>
          <label className="block text-sm font-medium text-fg">UOM code<input className="input-field mt-1.5" required disabled={!!editingUomId} value={uomForm.code} onChange={(event) => setUomForm({ ...uomForm, code: event.target.value.toUpperCase() })} /></label>
          <label className="block text-sm font-medium text-fg">UOM name<input className="input-field mt-1.5" required value={uomForm.name} onChange={(event) => setUomForm({ ...uomForm, name: event.target.value })} /></label>
          <label className="block text-sm font-medium text-fg">Conversion factor<input className="input-field mt-1.5" type="number" min="0.000001" step="any" required value={uomForm.conversionFactor} onChange={(event) => setUomForm({ ...uomForm, conversionFactor: Number(event.target.value) })} /></label>
          <div className="max-h-48 divide-y divide-border overflow-y-auto border-y border-border">{uoms.map((uom) => <div key={uom._id} className="flex items-center gap-2 py-2"><span className="min-w-0 flex-1 truncate text-sm">{uom.code} — {uom.name}</span><button type="button" className="btn-ghost p-2" title="Edit UOM" onClick={() => { setEditingUomId(uom._id); setUomForm({ code: uom.code, name: uom.name, conversionFactor: uom.conversionFactor }); }}><Pencil className="h-4 w-4" /></button><button type="button" className="btn-ghost p-2 text-red-600" title="Remove UOM" onClick={() => void removeReference('uoms', uom._id)}><Trash2 className="h-4 w-4" /></button></div>)}</div>
          <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => { setEditingUomId(''); setUomForm(initialUomForm); }}>{editingUomId ? 'Cancel edit' : 'Clear'}</button><button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : editingUomId ? 'Save changes' : 'Create UOM'}</button></div>
        </form>
      </Modal>}
    </>
  );
}

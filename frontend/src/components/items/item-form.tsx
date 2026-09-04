'use client';

import { FormEvent, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Info } from 'lucide-react';

type Reference = { _id: string; code: string; name: string };
type ItemType = 'raw' | 'component' | 'assembly' | 'service';
type ItemTab = 'Overview' | 'Sales & Purchase' | 'Inventory & Tax';

const TABS: ItemTab[] = ['Overview', 'Sales & Purchase', 'Inventory & Tax'];

export type ItemFormPayload = {
  code: string;
  name: string;
  description: string;
  manufacturerPartNumber: string;
  barcode: string;
  salesDescription: string;
  purchaseDescription: string;
  salesEnabled: boolean;
  purchaseEnabled: boolean;
  categoryId: string;
  uomId: string;
  itemType: ItemType;
  standardCost: number;
  sellingPrice: number;
  hsnSac: string;
  taxPercent: number;
  isStockItem: boolean;
  reorderLevel: number;
  defaultSupplierId?: string;
  leadTimeDays: number;
};

type ItemInitialValues = Partial<Omit<ItemFormPayload, 'standardCost' | 'sellingPrice' | 'taxPercent' | 'reorderLevel' | 'leadTimeDays' | 'categoryId' | 'uomId' | 'defaultSupplierId'>> & {
  standardCost?: number;
  sellingPrice?: number;
  taxPercent?: number;
  reorderLevel?: number;
  leadTimeDays?: number;
  categoryId?: Reference | string;
  uomId?: Reference | string;
  defaultSupplierId?: Reference | string | null;
};

type ItemFormValues = Omit<ItemFormPayload, 'standardCost' | 'sellingPrice' | 'taxPercent' | 'reorderLevel' | 'leadTimeDays'> & {
  standardCost: string;
  sellingPrice: string;
  taxPercent: string;
  reorderLevel: string;
  leadTimeDays: string;
  defaultSupplierId: string;
};

type FieldErrors = Partial<Record<keyof ItemFormValues | 'availability', string>>;

const emptyItem: ItemFormValues = {
  code: '', name: '', description: '', manufacturerPartNumber: '', barcode: '', salesDescription: '', purchaseDescription: '',
  salesEnabled: true, purchaseEnabled: true, categoryId: '', uomId: '', itemType: 'component', standardCost: '', sellingPrice: '',
  hsnSac: '', taxPercent: '', isStockItem: true, reorderLevel: '', defaultSupplierId: '', leadTimeDays: '',
};

function referenceId(value: Reference | string | null | undefined) {
  return typeof value === 'string' ? value : value?._id || '';
}

function normalize(values?: ItemInitialValues): ItemFormValues {
  if (!values) return { ...emptyItem };
  return {
    ...emptyItem,
    ...values,
    categoryId: referenceId(values.categoryId),
    uomId: referenceId(values.uomId),
    defaultSupplierId: referenceId(values.defaultSupplierId),
    standardCost: values.standardCost == null ? '' : String(values.standardCost),
    sellingPrice: values.sellingPrice == null ? '' : String(values.sellingPrice),
    taxPercent: values.taxPercent == null ? '' : String(values.taxPercent),
    reorderLevel: values.reorderLevel == null ? '' : String(values.reorderLevel),
    leadTimeDays: values.leadTimeDays == null ? '' : String(values.leadTimeDays),
  };
}

function validate(values: ItemFormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.name.trim()) errors.name = 'Item name is required.';
  if (!values.code.trim()) errors.code = 'Item code / SKU is required.';
  if (!values.categoryId) errors.categoryId = 'Select an item category.';
  if (!values.uomId) errors.uomId = 'Select the unit used to measure this item.';
  if (!values.salesEnabled && !values.purchaseEnabled) errors.availability = 'Enable sales information, purchase information, or both.';

  const nonNegative: Array<[keyof ItemFormValues, string]> = [
    ['sellingPrice', 'Selling price'], ['standardCost', 'Purchase cost'], ['reorderLevel', 'Reorder point'], ['leadTimeDays', 'Lead time'],
  ];
  for (const [field, label] of nonNegative) {
    const raw = values[field];
    if (typeof raw === 'string' && raw !== '' && (!Number.isFinite(Number(raw)) || Number(raw) < 0)) errors[field] = `${label} must be zero or greater.`;
  }
  if (values.leadTimeDays && !Number.isInteger(Number(values.leadTimeDays))) errors.leadTimeDays = 'Lead time must be a whole number of days.';
  if (values.taxPercent && (!Number.isFinite(Number(values.taxPercent)) || Number(values.taxPercent) < 0 || Number(values.taxPercent) > 100)) errors.taxPercent = 'Tax rate must be between 0 and 100.';
  return errors;
}

function prepare(values: ItemFormValues): ItemFormPayload {
  return {
    ...values,
    code: values.code.trim().toUpperCase(),
    name: values.name.trim(),
    description: values.description.trim(),
    manufacturerPartNumber: values.manufacturerPartNumber.trim(),
    barcode: values.barcode.trim(),
    salesDescription: values.salesDescription.trim(),
    purchaseDescription: values.purchaseDescription.trim(),
    standardCost: Number(values.standardCost || 0),
    sellingPrice: Number(values.sellingPrice || 0),
    hsnSac: values.hsnSac.trim(),
    taxPercent: Number(values.taxPercent || 0),
    isStockItem: values.itemType === 'service' ? false : values.isStockItem,
    reorderLevel: values.itemType === 'service' || !values.isStockItem ? 0 : Number(values.reorderLevel || 0),
    defaultSupplierId: values.defaultSupplierId || undefined,
    leadTimeDays: Number(values.leadTimeDays || 0),
  };
}

function FieldLabel({ children, required, tooltip }: { children: React.ReactNode; required?: boolean; tooltip?: string }) {
  return <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-fg-secondary">
    <span>{children}{required && <span className="text-red-500"> *</span>}</span>
    {tooltip && <span title={tooltip} aria-label={tooltip} className="inline-flex cursor-help text-fg-muted"><Info className="h-3.5 w-3.5" /></span>}
  </span>;
}

type Props = {
  initialValues?: ItemInitialValues | null;
  categories: Reference[];
  uoms: Reference[];
  suppliers: Reference[];
  saving?: boolean;
  error?: string;
  onSubmit: (values: ItemFormPayload) => Promise<boolean | void> | boolean | void;
  onCancel: () => void;
};

export function ItemForm({ initialValues, categories, uoms, suppliers, saving = false, error, onSubmit, onCancel }: Props) {
  const isCreate = !initialValues;
  const [activeTab, setActiveTab] = useState<ItemTab>('Overview');
  const [form, setForm] = useState<ItemFormValues>(() => normalize(initialValues || undefined));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const isService = form.itemType === 'service';

  useEffect(() => {
    setForm(normalize(initialValues || undefined));
    setActiveTab('Overview');
    setFieldErrors({});
  }, [initialValues]);

  const set = <K extends keyof ItemFormValues>(field: K, value: ItemFormValues[K]) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => ({ ...previous, [field]: undefined, ...(field === 'salesEnabled' || field === 'purchaseEnabled' ? { availability: undefined } : {}) }));
  };
  const fc = (field: keyof FieldErrors) => clsx('input-field', fieldErrors[field] && 'border-red-300 focus:border-red-500 focus:ring-red-500/20');
  const err = (field: keyof FieldErrors) => fieldErrors[field] ? <p className="mt-1 text-xs text-red-600">{fieldErrors[field]}</p> : null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      const fields = Object.keys(errors);
      if (fields.some((field) => ['name', 'code', 'categoryId', 'uomId'].includes(field))) setActiveTab('Overview');
      else if (fields.some((field) => ['availability', 'sellingPrice', 'standardCost', 'leadTimeDays'].includes(field))) setActiveTab('Sales & Purchase');
      else setActiveTab('Inventory & Tax');
      return;
    }
    await onSubmit(prepare(form));
  };

  return <form onSubmit={handleSubmit} noValidate className="flex flex-col">
    {error && <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">{error}</div>}

    <div className="flex overflow-x-auto border-b border-border px-6 pt-4">
      {TABS.map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={clsx('whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors', activeTab === tab ? 'border-brand-600 text-brand-600' : 'border-transparent text-fg-muted hover:text-fg-secondary')}>{tab}</button>)}
    </div>

    <div className="min-h-[400px] space-y-5 p-6">
      {activeTab === 'Overview' && <div className="grid gap-4 md:grid-cols-2">
        <fieldset className="md:col-span-2">
          <legend className="mb-2 text-sm font-medium text-fg-secondary">Type <span className="text-red-500">*</span></legend>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-fg"><input type="radio" name="productKind" checked={!isService} onChange={() => setForm((previous) => ({ ...previous, itemType: 'component' }))} /> Goods</label>
            <label className="flex items-center gap-2 text-sm text-fg"><input type="radio" name="productKind" checked={isService} onChange={() => setForm((previous) => ({ ...previous, itemType: 'service', isStockItem: false, reorderLevel: '' }))} /> Service</label>
          </div>
          <p className="mt-1.5 text-xs text-fg-muted">Goods are physical items. Services represent labour, expertise, or other non-physical work.</p>
        </fieldset>
        <label className="md:col-span-2"><FieldLabel required>Item name</FieldLabel><input className={fc('name')} autoFocus value={form.name} onChange={(event) => set('name', event.target.value)} placeholder={isService ? 'e.g. Commissioning support' : 'e.g. Servo drive 2 kW'} />{err('name')}</label>
        <label><FieldLabel required tooltip="A unique internal identifier, equivalent to an SKU.">Item code / SKU</FieldLabel><input className={fc('code')} disabled={!isCreate} value={form.code} onChange={(event) => set('code', event.target.value.toUpperCase())} placeholder="e.g. DRV-002KW" />{err('code')}</label>
        <label><FieldLabel required tooltip="How this item is grouped for search, reporting, and procurement.">Category</FieldLabel><select className={fc('categoryId')} value={form.categoryId} onChange={(event) => set('categoryId', event.target.value)}><option value="">Select category</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.code} — {category.name}</option>)}</select>{err('categoryId')}</label>
        <label><FieldLabel required tooltip="Unit of measure: how the quantity is counted or measured.">Base unit</FieldLabel><select className={fc('uomId')} value={form.uomId} onChange={(event) => set('uomId', event.target.value)}><option value="">Select unit</option>{uoms.map((uom) => <option key={uom._id} value={uom._id}>{uom.code} — {uom.name}</option>)}</select><p className="mt-1 text-xs text-fg-muted">For example: EA = each, M = metre, KG = kilogram, HR = hour.</p>{err('uomId')}</label>
        {!isService && <label><FieldLabel required tooltip="The item's role in engineering and manufacturing workflows.">Goods classification</FieldLabel><select className="input-field" value={form.itemType} onChange={(event) => set('itemType', event.target.value as ItemType)}><option value="raw">Raw material</option><option value="component">Bought-out component</option><option value="assembly">Manufactured assembly</option></select></label>}
        <label className="md:col-span-2"><FieldLabel>Internal description</FieldLabel><textarea className="input-field min-h-24" maxLength={1000} value={form.description} onChange={(event) => set('description', event.target.value)} placeholder="Specification, application, or internal notes used to identify the item" /><p className="mt-1 text-right text-xs text-fg-muted">{form.description.length}/1000</p></label>
      </div>}

      {activeTab === 'Sales & Purchase' && <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-border p-4">
          <label className="flex items-start gap-3"><input className="mt-1" type="checkbox" checked={form.salesEnabled} onChange={(event) => set('salesEnabled', event.target.checked)} /><span><span className="block text-sm font-semibold text-fg">Sales information</span><span className="block text-xs leading-5 text-fg-muted">Make this item available on quotes and invoices.</span></span></label>
          {form.salesEnabled && <div className="mt-4 space-y-4">
            <label><FieldLabel tooltip="Default price per base unit. It can be changed on a transaction.">Selling price</FieldLabel><input className={fc('sellingPrice')} type="number" min="0" step="0.01" inputMode="decimal" value={form.sellingPrice} onChange={(event) => set('sellingPrice', event.target.value)} placeholder="0.00" />{err('sellingPrice')}</label>
            <label><FieldLabel>Sales description</FieldLabel><textarea className="input-field min-h-28" maxLength={2000} value={form.salesDescription} onChange={(event) => set('salesDescription', event.target.value)} placeholder="Default description shown on customer documents" /></label>
          </div>}
        </section>
        <section className="rounded-xl border border-border p-4">
          <label className="flex items-start gap-3"><input className="mt-1" type="checkbox" checked={form.purchaseEnabled} onChange={(event) => set('purchaseEnabled', event.target.checked)} /><span><span className="block text-sm font-semibold text-fg">Purchase information</span><span className="block text-xs leading-5 text-fg-muted">Make this item available for sourcing and purchasing.</span></span></label>
          {form.purchaseEnabled && <div className="mt-4 space-y-4">
            <label><FieldLabel tooltip="Expected cost per base unit used for estimates and BOM costing.">Purchase cost</FieldLabel><input className={fc('standardCost')} type="number" min="0" step="0.01" inputMode="decimal" value={form.standardCost} onChange={(event) => set('standardCost', event.target.value)} placeholder="0.00" />{err('standardCost')}</label>
            <label><FieldLabel>Preferred supplier</FieldLabel><select className="input-field" value={form.defaultSupplierId} onChange={(event) => set('defaultSupplierId', event.target.value)}><option value="">No preferred supplier</option>{suppliers.map((supplier) => <option key={supplier._id} value={supplier._id}>{supplier.code} — {supplier.name}</option>)}</select></label>
            <label><FieldLabel tooltip="Expected calendar days from placing the order until delivery.">Lead time</FieldLabel><div className="relative"><input className={clsx(fc('leadTimeDays'), 'pr-14')} aria-label="Lead time (days)" type="number" min="0" step="1" inputMode="numeric" value={form.leadTimeDays} onChange={(event) => set('leadTimeDays', event.target.value)} placeholder="0" /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fg-muted">days</span></div>{err('leadTimeDays')}</label>
            <label><FieldLabel>Purchase description</FieldLabel><textarea className="input-field min-h-28" maxLength={2000} value={form.purchaseDescription} onChange={(event) => set('purchaseDescription', event.target.value)} placeholder="Default specification shown on purchase documents" /></label>
          </div>}
        </section>
        {err('availability') && <div className="lg:col-span-2">{err('availability')}</div>}
      </div>}

      {activeTab === 'Inventory & Tax' && <div className="space-y-5">
        {!isService && <section className="rounded-xl border border-border p-4">
          <label className="flex items-start gap-3"><input className="mt-1" type="checkbox" checked={form.isStockItem} onChange={(event) => set('isStockItem', event.target.checked)} /><span><span className="block text-sm font-semibold text-fg">Inventory item</span><span className="block text-xs leading-5 text-fg-muted">Use this item in stock and replenishment workflows.</span></span></label>
          {form.isStockItem && <div className="mt-4 md:max-w-[calc(50%-0.5rem)]"><label><FieldLabel tooltip="The quantity at which replenishment should begin, expressed in the base unit.">Reorder point</FieldLabel><input className={fc('reorderLevel')} aria-label="Reorder level" type="number" min="0" step="0.01" inputMode="decimal" value={form.reorderLevel} onChange={(event) => set('reorderLevel', event.target.value)} placeholder="0" /><p className="mt-1 text-xs text-fg-muted">Set to zero when no low-stock alert is required.</p>{err('reorderLevel')}</label></div>}
        </section>}
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">Tax defaults</p>
          <div className="grid gap-4 md:grid-cols-2">
            <label><FieldLabel tooltip={isService ? 'Services Accounting Code used for Indian GST documents.' : 'Harmonised System of Nomenclature code used for goods on Indian GST documents.'}>{isService ? 'SAC code' : 'HSN code'}</FieldLabel><input className="input-field" value={form.hsnSac} onChange={(event) => set('hsnSac', event.target.value)} placeholder={isService ? 'e.g. 998719' : 'e.g. 850440'} /></label>
            <label><FieldLabel tooltip="Default only. The applicable tax can change with the transaction and jurisdiction.">Default tax rate</FieldLabel><div className="relative"><input className={clsx(fc('taxPercent'), 'pr-10')} aria-label="Tax rate (%)" type="number" min="0" max="100" step="0.01" inputMode="decimal" value={form.taxPercent} onChange={(event) => set('taxPercent', event.target.value)} placeholder="0" /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fg-muted">%</span></div>{err('taxPercent')}</label>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-surface-secondary p-4 text-sm text-fg-muted"><strong className="text-fg-secondary">How this default is used:</strong> it prefills commercial documents, but users can adjust tax according to the transaction and place of supply.</div>
        </section>
        {!isService && <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">Product identifiers</p>
          <div className="grid gap-4 md:grid-cols-2">
            <label><FieldLabel tooltip="Part number assigned by the original equipment manufacturer.">Manufacturer part number</FieldLabel><input className="input-field" value={form.manufacturerPartNumber} onChange={(event) => set('manufacturerPartNumber', event.target.value)} placeholder="e.g. 6SL3210-1KE15-8UF2" /></label>
            <label><FieldLabel>Barcode / EAN / UPC</FieldLabel><input className="input-field" value={form.barcode} onChange={(event) => set('barcode', event.target.value)} placeholder="Scan or enter an identifier" /></label>
          </div>
        </section>}
      </div>}
    </div>

    <div className="flex flex-col gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-fg-muted">Required: item name, item code, category, and base unit.</p>
      <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : isCreate ? 'Create item' : 'Save changes'}</button></div>
    </div>
  </form>;
}

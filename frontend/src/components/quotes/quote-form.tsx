'use client';

import { Plus, Save, Trash2 } from 'lucide-react';
import { CustomerRecord } from '@/lib/customers';
import {
  calculateQuoteTotals,
  CommercialItem,
  CommercialPreferences,
  emptyQuoteLineItem,
  formatMoney,
  QuoteFormValues,
} from '@/lib/quotes';

type QuoteFormProps = {
  form: QuoteFormValues;
  customers: CustomerRecord[];
  opportunities: any[];
  preferences: CommercialPreferences;
  saving: boolean;
  locked?: boolean;
  submitLabel: string;
  savingLabel: string;
  onChange: (form: QuoteFormValues) => void;
  onSubmit: () => void;
};

export function QuoteForm({
  form,
  customers,
  opportunities,
  preferences,
  saving,
  locked = false,
  submitLabel,
  savingLabel,
  onChange,
  onSubmit,
}: QuoteFormProps) {
  const totals = calculateQuoteTotals(form.lineItems, {
    shippingCharge: form.shippingCharge,
    adjustment: form.adjustment,
  });
  const units = preferences.units?.length ? preferences.units : ['Nos', 'Set', 'Lot', 'Hour', 'Day'];
  const taxes = preferences.taxes?.length ? preferences.taxes : [];
  const catalogItems = preferences.items?.length ? preferences.items : [];

  const set = <K extends keyof QuoteFormValues>(key: K, value: QuoteFormValues[K]) => {
    onChange({ ...form, [key]: value });
  };

  const updateLine = (index: number, patch: Partial<QuoteFormValues['lineItems'][number]>) => {
    set(
      'lineItems',
      form.lineItems.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const addLine = () => {
    set('lineItems', [
      ...form.lineItems,
      {
        ...emptyQuoteLineItem,
        taxName: preferences.defaultTaxName || '',
        taxPercent: Number(preferences.defaultTaxPercent || 0),
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (form.lineItems.length === 1) return;
    set('lineItems', form.lineItems.filter((_, i) => i !== index));
  };

  const applyCatalogItem = (index: number, itemName: string) => {
    const catalogItem = catalogItems.find((item) => item.name === itemName);
    if (!catalogItem) {
      updateLine(index, { itemName });
      return;
    }
    updateLine(index, {
      itemName: catalogItem.name,
      sku: catalogItem.sku || '',
      hsnSac: catalogItem.hsnSac || '',
      unit: catalogItem.unit || 'Nos',
      unitPrice: Number(catalogItem.rate || 0),
      taxName: catalogItem.taxName || preferences.defaultTaxName || '',
      taxPercent: Number(catalogItem.taxPercent ?? preferences.defaultTaxPercent ?? 0),
      description: catalogItem.description || catalogItem.name,
    });
  };

  const applyTax = (index: number, taxName: string) => {
    const tax = taxes.find((item) => item.name === taxName);
    updateLine(index, { taxName, taxPercent: Number(tax?.rate ?? 0) });
  };

  return (
    <fieldset disabled={locked || saving} className="grid gap-5 lg:grid-cols-[1fr_300px] disabled:opacity-80">
      <div className="space-y-5">
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-fg">Customer and quote details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-fg-secondary">Customer</span>
              <select
                className="input-field"
                value={form.customerId}
                onChange={(e) => onChange({ ...form, customerId: e.target.value, opportunityId: '' })}
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-fg-secondary">Machine Inquiry</span>
              <select
                className="input-field"
                value={form.opportunityId}
                onChange={(e) => set('opportunityId', e.target.value)}
                disabled={!form.customerId}
              >
                <option value="">No linked machine inquiry</option>
                {opportunities.map((opp) => (
                  <option key={opp._id} value={opp._id}>
                    {opp.requestNo ? `${opp.requestNo} - ${opp.title}` : opp.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-xs font-medium text-fg-secondary">Subject</span>
              <input
                className="input-field"
                value={form.subject}
                onChange={(e) => set('subject', e.target.value)}
                placeholder="e.g. Dry Leak Test Machine for new machining line"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-fg-secondary">Quote Date</span>
              <input className="input-field" type="date" value={form.quoteDate} onChange={(e) => set('quoteDate', e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-fg-secondary">Valid Until</span>
              <input className="input-field" type="date" value={form.validUntil} onChange={(e) => set('validUntil', e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-fg-secondary">Currency</span>
              <input className="input-field uppercase" value={form.currency} maxLength={8} onChange={(e) => set('currency', e.target.value.toUpperCase())} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-fg-secondary">Sales Person</span>
              <input className="input-field" value={form.salesPerson} onChange={(e) => set('salesPerson', e.target.value)} />
            </label>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-fg">Line items</h2>
            <button type="button" onClick={addLine} className="btn-secondary px-3 py-2">
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
          <div className="divide-y divide-border">
            {form.lineItems.map((item, index) => (
              <div key={index} className="space-y-3 p-4">
                <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr_90px_100px_120px]">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-fg-secondary">Item</span>
                    <input
                      className="input-field"
                      value={item.itemName || ''}
                      onChange={(e) => applyCatalogItem(index, e.target.value)}
                      list="quote-catalog-items"
                      placeholder="Select or type item"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-fg-secondary">Description</span>
                    <input
                      className="input-field"
                      value={item.description}
                      onChange={(e) => updateLine(index, { description: e.target.value })}
                      placeholder="Machine, module, service, or commercial item"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-fg-secondary">Qty</span>
                    <input className="input-field" type="number" min="0" value={item.quantity} onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-fg-secondary">Unit</span>
                    <input className="input-field" value={item.unit || ''} list="quote-units" onChange={(e) => updateLine(index, { unit: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-fg-secondary">Rate</span>
                    <input className="input-field" type="number" min="0" value={item.unitPrice} onChange={(e) => updateLine(index, { unitPrice: Number(e.target.value) })} />
                  </label>
                </div>

                <div className="grid gap-3 lg:grid-cols-[120px_120px_120px_1fr_120px_120px]">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-fg-secondary">SKU</span>
                    <input className="input-field" value={item.sku || ''} onChange={(e) => updateLine(index, { sku: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-fg-secondary">HSN/SAC</span>
                    <input className="input-field" value={item.hsnSac || ''} onChange={(e) => updateLine(index, { hsnSac: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-fg-secondary">Cost</span>
                    <input className="input-field" type="number" min="0" value={item.costPrice || 0} onChange={(e) => updateLine(index, { costPrice: Number(e.target.value) })} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-fg-secondary">Tax</span>
                    <input className="input-field" value={item.taxName || ''} list="quote-taxes" onChange={(e) => applyTax(index, e.target.value)} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-fg-secondary">Disc</span>
                    <div className="flex gap-1">
                      <input className="input-field" type="number" min="0" value={item.discountValue ?? item.discountPercent ?? 0} onChange={(e) => updateLine(index, { discountValue: Number(e.target.value), discountPercent: item.discountType === 'amount' ? 0 : Number(e.target.value) })} />
                      <select className="input-field w-16 px-2" value={item.discountType || 'percentage'} onChange={(e) => updateLine(index, { discountType: e.target.value as 'percentage' | 'amount' })}>
                        <option value="percentage">%</option>
                        <option value="amount">Amt</option>
                      </select>
                    </div>
                  </label>
                  <div className="flex items-end justify-between gap-2">
                    <div className="pb-2 text-right">
                      <p className="text-[11px] font-medium text-fg-muted">Total</p>
                      <p className="font-semibold text-fg">{formatMoney(totals.lineItems[index]?.lineTotal, form.currency)}</p>
                    </div>
                    <button type="button" onClick={() => removeLine(index)} className="btn-ghost mb-1 p-2 text-red-600" disabled={form.lineItems.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <datalist id="quote-catalog-items">
            {catalogItems.map((item: CommercialItem) => <option key={item.name} value={item.name} />)}
          </datalist>
          <datalist id="quote-units">
            {units.map((unit) => <option key={unit} value={unit} />)}
          </datalist>
          <datalist id="quote-taxes">
            {taxes.map((tax) => <option key={tax.name} value={tax.name} />)}
          </datalist>
        </div>

        <div className="card p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-fg-secondary">Customer Notes</span>
              <textarea className="input-field min-h-[120px]" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-fg-secondary">Terms and Conditions</span>
              <textarea className="input-field min-h-[120px]" value={form.terms} onChange={(e) => set('terms', e.target.value)} />
            </label>
          </div>
        </div>
      </div>

      <aside className="card p-5 lg:sticky lg:top-4">
        <h2 className="mb-4 text-sm font-semibold text-fg">Totals</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-fg-muted">Subtotal</span><span>{formatMoney(totals.subtotal, form.currency)}</span></div>
          <div className="flex justify-between"><span className="text-fg-muted">Discount</span><span>{formatMoney(totals.discountTotal, form.currency)}</span></div>
          <div className="flex justify-between"><span className="text-fg-muted">Tax</span><span>{formatMoney(totals.taxTotal, form.currency)}</span></div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fg-secondary">Shipping / Handling</span>
            <input className="input-field" type="number" min="0" value={form.shippingCharge} onChange={(e) => set('shippingCharge', Number(e.target.value))} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fg-secondary">Adjustment</span>
            <input className="input-field" type="number" value={form.adjustment} onChange={(e) => set('adjustment', Number(e.target.value))} />
          </label>
          <div className="border-t border-border pt-3 flex justify-between text-base font-bold text-fg">
            <span>Grand Total</span>
            <span>{formatMoney(totals.grandTotal, form.currency)}</span>
          </div>
        </div>
        <button type="button" onClick={onSubmit} disabled={saving || locked} className="btn-primary mt-5 w-full justify-center">
          <Save className="h-4 w-4" />
          {saving ? savingLabel : submitLabel}
        </button>
      </aside>
    </fieldset>
  );
}

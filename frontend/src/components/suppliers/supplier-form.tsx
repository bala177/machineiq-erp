'use client';

import { FormEvent, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Check, Info, Save, ShieldCheck, Trash2 } from 'lucide-react';
import {
  CURRENCY_OPTIONS,
  PAYMENT_TERM_OPTIONS,
  SUPPLIER_CATEGORIES,
  SupplierBankDetails,
  SupplierFieldErrors,
  SupplierFormValues,
  SupplierPayload,
  SupplierRecord,
  emptySupplierForm,
  normalizeSupplierFormValues,
  prepareSupplierPayload,
  validateSupplierForm,
} from '@/lib/suppliers';

type SupplierTab = 'Overview' | 'Contact & Address' | 'Commercial' | 'Banking';
const TABS: SupplierTab[] = ['Overview', 'Contact & Address', 'Commercial', 'Banking'];
const DRAFT_KEY = 'machineiq:supplier-draft:v1';

type SupplierDraft = { version: 1; values: SupplierFormValues; activeTab: SupplierTab };

type Props = {
  initialValues?: SupplierRecord | null;
  saving?: boolean;
  error?: string;
  onSubmit: (values: Partial<SupplierPayload>) => Promise<boolean | void> | boolean | void;
  onCancel: () => void;
};

function FieldLabel({ children, required, tooltip }: { children: React.ReactNode; required?: boolean; tooltip?: string }) {
  return <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-fg-secondary">
    <span>{children}{required && <span className="text-red-500"> *</span>}</span>
    {tooltip && <span title={tooltip} aria-label={tooltip} className="inline-flex cursor-help text-fg-muted"><Info className="h-3.5 w-3.5" /></span>}
  </label>;
}

export function SupplierForm({ initialValues, saving = false, error, onSubmit, onCancel }: Props) {
  const isCreate = !initialValues?.code;
  const [activeTab, setActiveTab] = useState<SupplierTab>('Overview');
  const [form, setForm] = useState(() => normalizeSupplierFormValues(initialValues || undefined));
  const [fieldErrors, setFieldErrors] = useState<SupplierFieldErrors>({});
  const [dirtyFields, setDirtyFields] = useState<Set<keyof SupplierFormValues>>(() => new Set());
  const [dirtyBankFields, setDirtyBankFields] = useState<Set<keyof SupplierBankDetails>>(() => new Set());
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftCurrent, setDraftCurrent] = useState(false);
  const hasContent = JSON.stringify(form) !== JSON.stringify(emptySupplierForm);

  useEffect(() => {
    if (isCreate) {
      try {
        const stored = window.localStorage.getItem(DRAFT_KEY);
        if (stored) {
          const draft = JSON.parse(stored) as Partial<SupplierDraft>;
          if (draft.version === 1 && draft.values) {
            setForm(normalizeSupplierFormValues(draft.values));
            if (draft.activeTab && TABS.includes(draft.activeTab)) setActiveTab(draft.activeTab);
            setDraftRestored(true);
            setDraftCurrent(true);
            return;
          }
        }
      } catch {
        window.localStorage.removeItem(DRAFT_KEY);
      }
    }
    setForm(normalizeSupplierFormValues(initialValues || undefined));
    setActiveTab('Overview');
    setDraftRestored(false);
    setDraftCurrent(false);
    setDirtyFields(new Set());
    setDirtyBankFields(new Set());
    setFieldErrors({});
  }, [initialValues, isCreate]);

  const set = (field: keyof SupplierFormValues, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setDirtyFields((previous) => new Set(previous).add(field));
    setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
    setDraftCurrent(false);
  };

  const setBank = (field: keyof SupplierBankDetails, value: string) => {
    setForm((previous) => ({ ...previous, bankDetails: { ...previous.bankDetails, [field]: value } }));
    setDirtyFields((previous) => new Set(previous).add('bankDetails'));
    setDirtyBankFields((previous) => new Set(previous).add(field));
    setDraftCurrent(false);
  };

  const saveDraft = () => {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 1, values: form, activeTab } satisfies SupplierDraft));
    setDraftCurrent(true);
    setDraftRestored(false);
  };

  const discardDraft = () => {
    window.localStorage.removeItem(DRAFT_KEY);
    setForm(normalizeSupplierFormValues());
    setActiveTab('Overview');
    setDraftRestored(false);
    setDraftCurrent(false);
    setDirtyFields(new Set());
    setDirtyBankFields(new Set());
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const allErrors = validateSupplierForm(form);
    const errors = isCreate
      ? allErrors
      : Object.fromEntries(Object.entries(allErrors).filter(([field]) => dirtyFields.has(field as keyof SupplierFormValues))) as SupplierFieldErrors;
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      const fields = Object.keys(errors);
      if (fields.some((field) => ['name', 'displayName', 'website', 'notes', 'category', 'qualificationStatus', 'defaultLeadTimeDays'].includes(field))) setActiveTab('Overview');
      else if (fields.some((field) => ['contactPerson', 'email', 'phone', 'mobile', 'designation', 'department', 'address', 'city', 'stateProvince', 'postalCode', 'country'].includes(field))) setActiveTab('Contact & Address');
      else setActiveTab('Commercial');
      return;
    }

    const prepared = prepareSupplierPayload(form);
    const payload = isCreate
      ? prepared
      : Object.fromEntries(Object.entries(prepared).filter(([field]) => dirtyFields.has(field as keyof SupplierFormValues))) as Partial<SupplierPayload>;
    if (!isCreate && dirtyFields.has('bankDetails')) {
      payload.bankDetails = Object.fromEntries(
        Object.entries(prepared.bankDetails).filter(([field]) => dirtyBankFields.has(field as keyof SupplierBankDetails)),
      ) as SupplierBankDetails;
    }
    const submitted = await onSubmit(payload);
    if (isCreate && submitted !== false) window.localStorage.removeItem(DRAFT_KEY);
  };

  const fc = (field: keyof SupplierFieldErrors) => clsx('input-field', fieldErrors[field] && 'border-red-300 focus:border-red-500 focus:ring-red-500/20');
  const err = (field: keyof SupplierFieldErrors) => fieldErrors[field] ? <p className="mt-1 text-xs text-red-600">{fieldErrors[field]}</p> : null;

  return <form onSubmit={handleSubmit} noValidate className="flex flex-col">
    {error && <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">{error}</div>}
    {isCreate && draftRestored && <div className="mx-6 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm text-brand-800 dark:border-brand-800 dark:bg-brand-950/30 dark:text-brand-200">
      <span>Your saved supplier draft was restored, including every section.</span>
      <button type="button" onClick={discardDraft} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold hover:bg-brand-100"><Trash2 className="h-3.5 w-3.5" /> Discard draft</button>
    </div>}

    <div className="flex overflow-x-auto border-b border-border px-6 pt-4">
      {TABS.map((tab) => <button key={tab} type="button" onClick={() => { setActiveTab(tab); setDraftCurrent(false); }} className={clsx('whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors', activeTab === tab ? 'border-brand-600 text-brand-600' : 'border-transparent text-fg-muted hover:text-fg-secondary')}>{tab}</button>)}
    </div>

    <div className="min-h-[380px] space-y-4 p-6">
      {activeTab === 'Overview' && <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2"><FieldLabel required>Supplier name</FieldLabel><input className={fc('name')} value={form.name} onChange={(event) => set('name', event.target.value)} placeholder="e.g. Precision Drives Pvt Ltd" autoFocus />{err('name')}</div>
        <div><FieldLabel tooltip="Name shown on purchase orders and supplier lists when different from the legal name.">Display name</FieldLabel><input className={fc('displayName')} value={form.displayName} onChange={(event) => set('displayName', event.target.value)} placeholder="Trading or short name" /></div>
        <div><FieldLabel tooltip="Generated automatically when the supplier is created.">Supplier number</FieldLabel><input className="input-field bg-surface-secondary text-fg-muted" value={initialValues?.code || 'Assigned automatically on creation'} readOnly aria-label="Supplier number" /></div>
        <div><FieldLabel tooltip="Groups suppliers for sourcing, filtering, and spend analysis.">Procurement category</FieldLabel><input className={fc('category')} list="supplier-category-options" value={form.category} onChange={(event) => set('category', event.target.value)} placeholder="Select or enter a category" /><datalist id="supplier-category-options">{SUPPLIER_CATEGORIES.map((item) => <option key={item} value={item} />)}</datalist></div>
        <div><FieldLabel tooltip="Pending means onboarding is incomplete. Qualified suppliers are approved for sourcing. Suspended suppliers should not receive new orders.">Qualification status</FieldLabel><select className={fc('qualificationStatus')} value={form.qualificationStatus} onChange={(event) => set('qualificationStatus', event.target.value)}><option value="pending">Pending review</option><option value="qualified">Qualified</option><option value="suspended">Suspended</option></select></div>
        <div><FieldLabel tooltip="Default calendar days from purchase order placement to expected delivery.">Default lead time</FieldLabel><div className="relative"><input className={clsx(fc('defaultLeadTimeDays'), 'pr-14')} type="number" min="0" step="1" inputMode="numeric" value={form.defaultLeadTimeDays} onChange={(event) => set('defaultLeadTimeDays', event.target.value)} aria-label="Default lead time" /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fg-muted">days</span></div>{err('defaultLeadTimeDays')}</div>
        <div><FieldLabel>Website</FieldLabel><input className={fc('website')} value={form.website} onChange={(event) => set('website', event.target.value)} placeholder="https://supplier.example" />{err('website')}</div>
        <div className="md:col-span-2"><FieldLabel>Internal notes</FieldLabel><textarea className={clsx(fc('notes'), 'min-h-20')} maxLength={2000} value={form.notes} onChange={(event) => set('notes', event.target.value)} placeholder="Capabilities, quality notes, sourcing context…" /><p className="mt-1 text-right text-xs text-fg-muted">{form.notes.length}/2000</p></div>
      </div>}

      {activeTab === 'Contact & Address' && <div className="space-y-5">
        <div><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">Primary contact</p><div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><FieldLabel tooltip="Main person for quotations, orders, and delivery coordination.">Contact person</FieldLabel><input className={fc('contactPerson')} value={form.contactPerson} onChange={(event) => set('contactPerson', event.target.value)} placeholder="Full name" /></div>
          <div><FieldLabel>Email address</FieldLabel><input className={fc('email')} type="email" inputMode="email" value={form.email} onChange={(event) => set('email', event.target.value)} placeholder="purchasing@supplier.com" aria-label="Email" />{err('email')}</div>
          <div><FieldLabel>Phone number</FieldLabel><input className={fc('phone')} type="tel" inputMode="tel" value={form.phone} onChange={(event) => set('phone', event.target.value)} placeholder="+91 98765 43210" aria-label="Phone" /></div>
          <div><FieldLabel>Mobile number</FieldLabel><input className={fc('mobile')} type="tel" inputMode="tel" value={form.mobile} onChange={(event) => set('mobile', event.target.value)} placeholder="+91 98765 43210" /></div>
          <div><FieldLabel>Designation</FieldLabel><input className={fc('designation')} value={form.designation} onChange={(event) => set('designation', event.target.value)} placeholder="Sales manager, account manager…" /></div>
          <div><FieldLabel>Department</FieldLabel><input className={fc('department')} value={form.department} onChange={(event) => set('department', event.target.value)} placeholder="Sales, dispatch, accounts…" /></div>
        </div></div>
        <hr className="border-border" />
        <div><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">Business address</p><div className="grid gap-4 md:grid-cols-2"><div className="md:col-span-2"><FieldLabel tooltip="Primary billing, purchase-order, and remittance address for this supplier.">Street address</FieldLabel><textarea className={clsx(fc('address'), 'min-h-20')} value={form.address} onChange={(event) => set('address', event.target.value)} placeholder="Street, building, district" aria-label="Address" /></div><div><FieldLabel>City</FieldLabel><input className={fc('city')} value={form.city} onChange={(e) => set('city', e.target.value)} /></div><div><FieldLabel>State / province</FieldLabel><input className={fc('stateProvince')} value={form.stateProvince} onChange={(e) => set('stateProvince', e.target.value)} /></div><div><FieldLabel>Postal code</FieldLabel><input className={fc('postalCode')} value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} /></div><div><FieldLabel>Country</FieldLabel><input className={fc('country')} value={form.country} onChange={(e) => set('country', e.target.value)} /></div></div></div>
      </div>}

      {activeTab === 'Commercial' && <div className="grid gap-4 md:grid-cols-2">
        <div><FieldLabel required tooltip="Currency used by default on purchase transactions with this supplier.">Transaction currency</FieldLabel><input className={fc('currencyCode')} list="supplier-currency-options" maxLength={8} value={form.currencyCode} onChange={(event) => set('currencyCode', event.target.value.toUpperCase())} placeholder="INR" /><datalist id="supplier-currency-options">{CURRENCY_OPTIONS.map((item) => <option key={item} value={item} />)}</datalist>{err('currencyCode')}</div>
        <div><FieldLabel tooltip="When supplier invoices are normally due, for example Net 30.">Payment terms</FieldLabel><input className={fc('paymentTerms')} list="supplier-payment-options" value={form.paymentTerms} onChange={(event) => set('paymentTerms', event.target.value)} placeholder="Select or enter terms" /><datalist id="supplier-payment-options">{PAYMENT_TERM_OPTIONS.map((item) => <option key={item} value={item} />)}</datalist></div>
        <div className="md:col-span-2"><FieldLabel tooltip="GSTIN, VAT number, or other jurisdiction-specific tax registration identifier.">Tax registration number</FieldLabel><input className={fc('taxRegistrationNumber')} value={form.taxRegistrationNumber} onChange={(event) => set('taxRegistrationNumber', event.target.value)} placeholder="GSTIN, VAT, or Tax ID" /></div>
        <div><FieldLabel tooltip="How this supplier is treated for indirect tax in its jurisdiction.">Tax treatment</FieldLabel><input className={fc('taxTreatment')} value={form.taxTreatment} onChange={(e) => set('taxTreatment', e.target.value)} placeholder="Registered, exempt, overseas…" /></div>
        <div><FieldLabel tooltip="State, province, or jurisdiction used as source of supply on purchases.">Place of supply</FieldLabel><input className={fc('placeOfSupply')} value={form.placeOfSupply} onChange={(e) => set('placeOfSupply', e.target.value)} placeholder="State or jurisdiction" /></div>
        <div className="md:col-span-2 rounded-xl border border-border bg-surface-secondary p-4 text-sm text-fg-muted"><strong className="text-fg-secondary">How these defaults are used:</strong> currency and payment terms prefill future purchase documents. Tax treatment remains transaction- and jurisdiction-specific.</div>
      </div>}

      {activeTab === 'Banking' && <div className="space-y-4">
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Payment details</p><p className="mt-1 text-xs leading-relaxed">Verify bank changes outside the ERP before making payment. Access to supplier banking data should remain limited to authorized users.</p></div></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><FieldLabel tooltip="Legal beneficiary name shown on the supplier’s bank account.">Beneficiary / account name</FieldLabel><input className={fc('accountName')} value={form.bankDetails.accountName} onChange={(event) => setBank('accountName', event.target.value)} placeholder="Legal account holder name" aria-label="Account name" /></div>
          <div><FieldLabel>Bank name</FieldLabel><input className={fc('bankName')} value={form.bankDetails.bankName} onChange={(event) => setBank('bankName', event.target.value)} placeholder="Bank and branch" aria-label="Bank name" /></div>
          <div><FieldLabel>Account number / IBAN</FieldLabel><input className={fc('accountNumber')} value={form.bankDetails.accountNumber} onChange={(event) => setBank('accountNumber', event.target.value)} placeholder="Account number or IBAN" autoComplete="off" aria-label="Account number" /></div>
          <div><FieldLabel tooltip="Use IFSC for Indian bank accounts or SWIFT/BIC for international payments.">IFSC / SWIFT / BIC</FieldLabel><input className={fc('ifscSwiftCode')} value={form.bankDetails.ifscSwiftCode} onChange={(event) => setBank('ifscSwiftCode', event.target.value.toUpperCase())} placeholder="e.g. HDFC0001234" autoComplete="off" aria-label="IFSC / SWIFT code" /></div>
        </div>
      </div>}
    </div>

    <div className="flex flex-col gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs text-fg-muted" aria-live="polite">{draftCurrent ? <span className="inline-flex items-center gap-1.5 text-emerald-700"><Check className="h-3.5 w-3.5" /> Draft saved in this browser</span> : isCreate ? 'Only supplier name and transaction currency are required.' : 'Only changed fields will be updated.'}</div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button type="button" className="btn-ghost whitespace-nowrap" onClick={onCancel}>Cancel</button>
        {isCreate && <button type="button" className="btn-secondary whitespace-nowrap" disabled={saving || !hasContent || draftCurrent} onClick={saveDraft}>{draftCurrent ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}{draftCurrent ? 'Draft saved' : 'Save draft'}</button>}
        <button type="submit" className="btn-primary whitespace-nowrap" disabled={saving || (isCreate && !form.name.trim())}>{saving ? 'Saving…' : isCreate ? 'Create supplier' : 'Save changes'}</button>
      </div>
    </div>
  </form>;
}

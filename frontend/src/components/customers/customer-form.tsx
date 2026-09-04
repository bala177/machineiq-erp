'use client';

import { FormEvent, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Check, Info, Save, Trash2 } from 'lucide-react';
import { getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  COMPANY_SIZES,
  COUNTRY_OPTIONS,
  CUSTOMER_TYPES,
  CustomerFieldErrors,
  CustomerFormValues,
  emptyCustomerForm,
  INDUSTRY_OPTIONS,
  countryCodeForName,
  normalizeCustomerFormValues,
  prepareCustomerPayload,
  validateCustomerForm,
} from '@/lib/customers';

export type { CustomerFormValues, CustomerRecord } from '@/lib/customers';

interface CustomerFormProps {
  initialValues?: Partial<CustomerFormValues> & { code?: string };
  submitLabel: string;
  savingLabel: string;
  error?: string;
  saving?: boolean;
  onSubmit: (values: Partial<CustomerFormValues>) => Promise<boolean | void> | boolean | void;
  onCancel?: () => void;
  draftStorageKey?: string;
}

const TABS = ['Overview', 'Contacts', 'Address', 'Commercial'] as const;
type FormTab = (typeof TABS)[number];

type CustomerDraft = {
  version: 1;
  values: CustomerFormValues;
  activeTab: FormTab;
  savedAt: string;
};

const DEFAULT_DRAFT_STORAGE_KEY = 'machineiq:customer-draft:v1';

function hasDraftContent(values: CustomerFormValues) {
  return (Object.keys(values) as (keyof CustomerFormValues)[])
    .some((field) => values[field] !== emptyCustomerForm[field]);
}

function FieldLabel({ children, required, tooltip }: { children: React.ReactNode; required?: boolean; tooltip?: string }) {
  return <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-fg-secondary">
    <span>{children}{required && <span className="text-red-500"> *</span>}</span>
    {tooltip && <span title={tooltip} aria-label={tooltip} className="inline-flex cursor-help text-fg-muted"><Info className="h-3.5 w-3.5" /></span>}
  </label>;
}

function PhoneField({ label, field, value, countryName, error, onChange }: {
  label: string;
  field: keyof CustomerFormValues;
  value: string;
  countryName: string;
  error?: string;
  onChange: (field: keyof CustomerFormValues, value: string) => void;
}) {
  const parsed = value ? parsePhoneNumberFromString(value) : undefined;
  const countryCode = parsed?.country || countryCodeForName(countryName) || 'IN';
  const callingCode = getCountryCallingCode(countryCode);
  const prefix = `+${callingCode}`;
  const nationalValue = parsed?.nationalNumber || (value.startsWith(prefix) ? value.slice(prefix.length).trim() : value);

  return <div>
    <FieldLabel tooltip="Select the dialing code, then enter the national number. It is saved in international E.164 format.">{label}</FieldLabel>
    <div className="grid grid-cols-[128px_1fr] gap-2">
      <select
        className={clsx('input-field px-2', error && 'border-red-300')}
        value={countryCode}
        onChange={(event) => onChange(field, nationalValue ? `+${getCountryCallingCode(event.target.value as typeof countryCode)} ${nationalValue}` : '')}
        aria-label={`${label} country code`}
      >
        {COUNTRY_OPTIONS.map((country) => <option key={country.code} value={country.code}>{country.code} +{getCountryCallingCode(country.code)}</option>)}
      </select>
      <input
        className={clsx('input-field min-w-0', error && 'border-red-300 focus:border-red-500 focus:ring-red-500/20')}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={nationalValue}
        onChange={(event) => onChange(field, event.target.value.trim() ? `${prefix} ${event.target.value}` : '')}
        placeholder="National number"
        aria-invalid={!!error}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>;
}

export function CustomerForm({
  initialValues,
  submitLabel,
  savingLabel,
  error,
  saving = false,
  onSubmit,
  onCancel,
  draftStorageKey = DEFAULT_DRAFT_STORAGE_KEY,
}: CustomerFormProps) {
  const [activeTab, setActiveTab] = useState<FormTab>('Overview');
  const [form, setForm] = useState<CustomerFormValues>(() => normalizeCustomerFormValues(initialValues));
  const [fieldErrors, setFieldErrors] = useState<CustomerFieldErrors>({});
  const [dirtyFields, setDirtyFields] = useState<Set<keyof CustomerFormValues>>(() => new Set());
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftSaveError, setDraftSaveError] = useState('');
  const [draftIsCurrent, setDraftIsCurrent] = useState(false);
  const isCreate = !initialValues?.code;
  const missingRequired = [
    !form.name.trim() && 'company name',
    !form.industry.trim() && 'industry',
    !form.contactPerson.trim() && 'primary contact',
    !(form.email.trim() || form.phone.trim() || form.mobile.trim()) && 'contact method',
    !form.country.trim() && 'billing country',
  ].filter(Boolean) as string[];
  const createReady = missingRequired.length === 0;

  useEffect(() => {
    if (isCreate) {
      try {
        const storedDraft = window.localStorage.getItem(draftStorageKey);
        if (storedDraft) {
          const parsed = JSON.parse(storedDraft) as Partial<CustomerDraft>;
          if (parsed.version === 1 && parsed.values && typeof parsed.values === 'object') {
            setForm(normalizeCustomerFormValues(parsed.values));
            if (parsed.activeTab && TABS.includes(parsed.activeTab)) setActiveTab(parsed.activeTab);
            setDraftSavedAt(typeof parsed.savedAt === 'string' ? parsed.savedAt : null);
            setDraftRestored(true);
            setDraftIsCurrent(true);
            setFieldErrors({});
            setDirtyFields(new Set());
            return;
          }
        }
      } catch {
        window.localStorage.removeItem(draftStorageKey);
      }
    }

    setForm(normalizeCustomerFormValues(initialValues));
    setFieldErrors({});
    setDirtyFields(new Set());
    setDraftSavedAt(null);
    setDraftRestored(false);
    setDraftIsCurrent(false);
  }, [draftStorageKey, initialValues, isCreate]);

  const set = (field: keyof CustomerFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirtyFields((prev) => new Set(prev).add(field));
    setDraftIsCurrent(false);
    setDraftSaveError('');
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      if (field === 'email' || field === 'phone' || field === 'mobile') {
        delete next.email;
        delete next.phone;
        delete next.mobile;
      }
      return next;
    });
  };

  const saveDraft = () => {
    const savedAt = new Date().toISOString();
    const draft: CustomerDraft = { version: 1, values: form, activeTab, savedAt };
    try {
      window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
      setDraftSavedAt(savedAt);
      setDraftRestored(false);
      setDraftIsCurrent(true);
      setDraftSaveError('');
    } catch {
      setDraftSaveError('Draft could not be saved in this browser.');
    }
  };

  const discardDraft = () => {
    window.localStorage.removeItem(draftStorageKey);
    setForm(normalizeCustomerFormValues(initialValues));
    setActiveTab('Overview');
    setFieldErrors({});
    setDirtyFields(new Set());
    setDraftSavedAt(null);
    setDraftRestored(false);
    setDraftIsCurrent(false);
    setDraftSaveError('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validateCustomerForm(form, { requireComplete: isCreate });
    const errors = isCreate
      ? validationErrors
      : Object.fromEntries(
          Object.entries(validationErrors).filter(([field]) => dirtyFields.has(field as keyof CustomerFormValues)),
        ) as CustomerFieldErrors;
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      // Switch to tab with first error
      const errorFields = Object.keys(errors) as (keyof CustomerFormValues)[];
      const overviewFields = ['name', 'accountType', 'customerType', 'displayName', 'companySize', 'industry', 'website'];
      const contactFields = ['contactPerson', 'email', 'phone', 'mobile', 'designation', 'department', 'secondaryContactName', 'secondaryContactEmail', 'secondaryContactPhone'];
      const addressFields = ['address', 'city', 'stateProvince', 'postalCode', 'country', 'shippingAddress', 'shippingCity', 'shippingStateProvince', 'shippingPostalCode', 'shippingCountry'];
      if (errorFields.some((f) => overviewFields.includes(f))) setActiveTab('Overview');
      else if (errorFields.some((f) => contactFields.includes(f))) setActiveTab('Contacts');
      else if (errorFields.some((f) => addressFields.includes(f))) setActiveTab('Address');
      else setActiveTab('Commercial');
      return;
    }
    const prepared = prepareCustomerPayload(form);
    const payload = isCreate
      ? prepared
      : Object.fromEntries(
          Object.entries(prepared).filter(([field]) => dirtyFields.has(field as keyof CustomerFormValues)),
        ) as Partial<CustomerFormValues>;
    const submitted = await onSubmit(payload);
    if (isCreate && submitted !== false) {
      window.localStorage.removeItem(draftStorageKey);
    }
  };

  const fc = (field: keyof CustomerFormValues) =>
    clsx('input-field', fieldErrors[field] && 'border-red-300 focus:border-red-500 focus:ring-red-500/20');

  const err = (field: keyof CustomerFormValues) =>
    fieldErrors[field] ? <p className="mt-1 text-xs text-red-600">{fieldErrors[field]}</p> : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-0">
      {error && (
        <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {isCreate && draftRestored && (
        <div className="mx-6 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm text-brand-800 dark:border-brand-800 dark:bg-brand-950/30 dark:text-brand-200">
          <span>Your saved draft was restored, including details from every section.</span>
          <button type="button" onClick={discardDraft} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold hover:bg-brand-100 dark:hover:bg-brand-900/50">
            <Trash2 className="h-3.5 w-3.5" /> Discard draft
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-border px-6 pt-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => { setActiveTab(tab); setDraftIsCurrent(false); }}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-fg-muted hover:text-fg-secondary',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-4">

        {/* ── Overview ── */}
        {activeTab === 'Overview' && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <FieldLabel required>Company Name</FieldLabel>
              <input className={fc('name')} value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Atlas Beverage Systems" />
              {err('name')}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Account Type</label>
              <select className="input-field" value={form.accountType}
                onChange={(e) => set('accountType', e.target.value)}>
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Customer Type</label>
              <select className="input-field" value={form.customerType}
                onChange={(e) => set('customerType', e.target.value)}>
                {CUSTOMER_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/\b\w/g, (char) => char.toUpperCase())}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Display Name</label>
              <input className={fc('displayName')} value={form.displayName}
                onChange={(e) => set('displayName', e.target.value)}
                placeholder="Name shown on quotes and reports" />
            </div>

            <div>
              <FieldLabel tooltip="Customer numbers are generated from the central sequence when the record is created and cannot be changed here.">Customer Number</FieldLabel>
              <input
                className="input-field bg-surface-secondary text-fg-muted"
                value={initialValues?.code || 'Assigned automatically on creation'}
                readOnly
                aria-label="Customer Number"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Company Size</label>
              <select className="input-field" value={form.companySize}
                onChange={(e) => set('companySize', e.target.value)}>
                <option value="">Select range…</option>
                {COMPANY_SIZES.map((s) => (
                  <option key={s} value={s}>{s} employees</option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel required tooltip="Used for customer segmentation and dashboard reporting. Choose a suggestion or enter a specific industry.">Industry</FieldLabel>
              <input className={fc('industry')} value={form.industry} list="customer-industry-options"
                onChange={(e) => set('industry', e.target.value)}
                placeholder="Select or enter an industry" />
              <datalist id="customer-industry-options">{INDUSTRY_OPTIONS.map((industry) => <option key={industry} value={industry} />)}</datalist>
              {err('industry')}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Website</label>
              <input className={fc('website')} value={form.website}
                onChange={(e) => set('website', e.target.value)}
                placeholder="https://www.customer.com" />
              {err('website')}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Notes</label>
              <textarea className={clsx(fc('notes'), 'min-h-24')} value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Preferred site, buying team notes, regional context…" />
              <div className="mt-1 flex justify-between">
                {err('notes')}
                <p className="ml-auto text-xs text-fg-muted">{form.notes.length}/2000</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Contacts ── */}
        {activeTab === 'Contacts' && (
          <div className="space-y-5">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">Primary Contact</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-fg-secondary">
                    Contact Name <span className="text-red-500">*</span>
                  </label>
                  <input className={fc('contactPerson')} value={form.contactPerson}
                    onChange={(e) => set('contactPerson', e.target.value)}
                    placeholder="Who owns the relationship?" />
                  {err('contactPerson')}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Email</label>
                  <input type="email" inputMode="email" autoComplete="email" className={fc('email')} value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="name@company.com" aria-invalid={!!fieldErrors.email} />
                  {err('email')}
                </div>

                <PhoneField label="Work phone" field="phone" value={form.phone} countryName={form.country} error={fieldErrors.phone} onChange={set} />
                <PhoneField label="Mobile" field="mobile" value={form.mobile} countryName={form.country} error={fieldErrors.mobile} onChange={set} />

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Designation</label>
                  <input className={fc('designation')} value={form.designation}
                    onChange={(e) => set('designation', e.target.value)}
                    placeholder="Purchase Manager, Plant Head…" />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Department</label>
                  <input className={fc('department')} value={form.department}
                    onChange={(e) => set('department', e.target.value)}
                    placeholder="Procurement, Engineering…" />
                </div>
              </div>
            </div>

            <hr className="border-border" />

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">Secondary Contact</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Contact Name</label>
                  <input className={fc('secondaryContactName')} value={form.secondaryContactName}
                    onChange={(e) => set('secondaryContactName', e.target.value)}
                    placeholder="Backup contact or technical lead" />
                  {err('secondaryContactName')}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Email</label>
                  <input type="email" inputMode="email" autoComplete="email" className={fc('secondaryContactEmail')} value={form.secondaryContactEmail}
                    onChange={(e) => set('secondaryContactEmail', e.target.value)}
                    placeholder="name@company.com" aria-invalid={!!fieldErrors.secondaryContactEmail} />
                  {err('secondaryContactEmail')}
                </div>

                <PhoneField label="Phone" field="secondaryContactPhone" value={form.secondaryContactPhone} countryName={form.country} error={fieldErrors.secondaryContactPhone} onChange={set} />
              </div>
            </div>
          </div>
        )}

        {/* ── Address ── */}
        {activeTab === 'Address' && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Billing Address</p>
              </div>
            <div>
              <FieldLabel required tooltip="Country drives phone validation and future tax and currency defaults.">Country</FieldLabel>
              <input className={fc('country')} value={form.country} list="customer-country-options" autoComplete="country-name"
                onChange={(e) => set('country', e.target.value)}
                placeholder="Select a country" />
              <datalist id="customer-country-options">{COUNTRY_OPTIONS.map((country) => <option key={country.code} value={country.name} />)}</datalist>
              {err('country')}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">City</label>
              <input className={fc('city')} value={form.city} autoComplete="address-level2"
                onChange={(e) => set('city', e.target.value)}
                placeholder="Munich" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">State / Province</label>
              <input className={fc('stateProvince')} value={form.stateProvince} autoComplete="address-level1"
                onChange={(e) => set('stateProvince', e.target.value)}
                placeholder="Bavaria" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Postal Code</label>
              <input className={fc('postalCode')} value={form.postalCode} autoComplete="postal-code"
                onChange={(e) => set('postalCode', e.target.value)}
                placeholder="80331" />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Street Address</label>
              <textarea className={clsx(fc('address'), 'min-h-20')} value={form.address} autoComplete="street-address"
                onChange={(e) => set('address', e.target.value)}
                placeholder="Street, building, district, or site details" />
            </div>
            </div>

            <hr className="border-border" />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Shipping Address</p>
                <button
                  type="button"
                  className="btn-ghost px-3 py-1.5 text-xs"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      shippingAddress: prev.address,
                      shippingCity: prev.city,
                      shippingStateProvince: prev.stateProvince,
                      shippingPostalCode: prev.postalCode,
                      shippingCountry: prev.country,
                    }));
                    setDirtyFields((prev) => new Set([
                      ...prev,
                      'shippingAddress',
                      'shippingCity',
                      'shippingStateProvince',
                      'shippingPostalCode',
                      'shippingCountry',
                    ]));
                    setDraftIsCurrent(false);
                  }}
                >
                  Copy Billing
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Country</label>
                <input className={fc('shippingCountry')} value={form.shippingCountry} list="customer-country-options" autoComplete="country-name"
                  onChange={(e) => set('shippingCountry', e.target.value)}
                  placeholder="Germany" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-fg-secondary">City</label>
                <input className={fc('shippingCity')} value={form.shippingCity}
                  onChange={(e) => set('shippingCity', e.target.value)}
                  placeholder="Munich" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-fg-secondary">State / Province</label>
                <input className={fc('shippingStateProvince')} value={form.shippingStateProvince}
                  onChange={(e) => set('shippingStateProvince', e.target.value)}
                  placeholder="Bavaria" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Postal Code</label>
                <input className={fc('shippingPostalCode')} value={form.shippingPostalCode}
                  onChange={(e) => set('shippingPostalCode', e.target.value)}
                  placeholder="80331" />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Street Address</label>
                <textarea className={clsx(fc('shippingAddress'), 'min-h-20')} value={form.shippingAddress}
                  onChange={(e) => set('shippingAddress', e.target.value)}
                  placeholder="Shipping location, dock, plant, or delivery site details" />
              </div>
            </div>
          </div>
        )}

        {/* ── Commercial ── */}
        {activeTab === 'Commercial' && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Currency</label>
              <input className={fc('currencyCode')} value={form.currencyCode}
                onChange={(e) => set('currencyCode', e.target.value.toUpperCase())}
                placeholder="INR" maxLength={8} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Payment Terms</label>
              <input className={fc('paymentTerms')} value={form.paymentTerms}
                onChange={(e) => set('paymentTerms', e.target.value)}
                placeholder="Net 30, 50% advance, milestone based…" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Tax Treatment</label>
              <input className={fc('taxTreatment')} value={form.taxTreatment}
                onChange={(e) => set('taxTreatment', e.target.value)}
                placeholder="Registered business, SEZ, overseas…" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Tax / VAT / GST Number</label>
              <input className={fc('vatNumber')} value={form.vatNumber}
                onChange={(e) => set('vatNumber', e.target.value)}
                placeholder="GSTIN, VAT, or Tax ID" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Place of Supply</label>
              <input className={fc('placeOfSupply')} value={form.placeOfSupply}
                onChange={(e) => set('placeOfSupply', e.target.value)}
                placeholder="State, province, or export region" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Registration Number</label>
              <input className={fc('registrationNumber')} value={form.registrationNumber}
                onChange={(e) => set('registrationNumber', e.target.value)}
                placeholder="Company registration number" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Credit Limit</label>
              <input className={fc('creditLimit')} value={form.creditLimit}
                type="number" min="0"
                onChange={(e) => set('creditLimit', e.target.value)}
                placeholder="0" />
              {err('creditLimit')}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Price List</label>
              <input className={fc('priceList')} value={form.priceList}
                onChange={(e) => set('priceList', e.target.value)}
                placeholder="Standard, OEM, export…" />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Delivery Terms</label>
              <input className={fc('deliveryTerms')} value={form.deliveryTerms}
                onChange={(e) => set('deliveryTerms', e.target.value)}
                placeholder="Ex works, FOB, installation included…" />
            </div>
          </div>
        )}

      </div>

      <div className="flex flex-col gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-xs text-fg-muted" aria-live="polite">
          {draftSaveError ? (
            <span className="text-red-600 dark:text-red-400">{draftSaveError}</span>
          ) : draftIsCurrent && draftSavedAt ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
              <Check className="h-3.5 w-3.5" /> Draft saved in this browser
            </span>
          ) : isCreate ? (
            createReady
              ? <span className="text-emerald-700 dark:text-emerald-300">Required customer information is complete.</span>
              : <span>{missingRequired.length} required {missingRequired.length === 1 ? 'item' : 'items'} remaining: {missingRequired.join(', ')}.</span>
          ) : (
            <span>Customer number is retained when changes are saved.</span>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
        )}
        {isCreate && (
          <button
            type="button"
            onClick={saveDraft}
            disabled={saving || !hasDraftContent(form) || draftIsCurrent}
            className="btn-secondary whitespace-nowrap"
            title={!hasDraftContent(form) ? 'Enter at least one detail to save a draft' : 'Save all fields from every section in this browser'}
          >
            {draftIsCurrent ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {draftIsCurrent ? 'Draft saved' : 'Save draft'}
          </button>
        )}
        <button
          type="submit"
          disabled={saving || (isCreate && !createReady)}
          className="btn-primary whitespace-nowrap"
          title={isCreate && !createReady ? 'Complete the required fields in Overview, Contacts, and Address' : undefined}
        >
          {saving ? savingLabel : submitLabel}
        </button>
        </div>
      </div>
    </form>
  );
}

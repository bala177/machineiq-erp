'use client';

import { FormEvent, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  COMPANY_SIZES,
  CUSTOMER_TYPES,
  CustomerFieldErrors,
  CustomerFormValues,
  emptyCustomerForm,
  normalizeCustomerFormValues,
  prepareCustomerPayload,
  validateCustomerForm,
} from '@/lib/customers';

export type { CustomerFormValues, CustomerRecord } from '@/lib/customers';

interface CustomerFormProps {
  initialValues?: Partial<CustomerFormValues>;
  submitLabel: string;
  savingLabel: string;
  error?: string;
  saving?: boolean;
  onSubmit: (values: Partial<CustomerFormValues>) => Promise<void> | void;
  onCancel?: () => void;
}

const TABS = ['Overview', 'Contacts', 'Address', 'Commercial'] as const;
type FormTab = (typeof TABS)[number];

export function CustomerForm({
  initialValues,
  submitLabel,
  savingLabel,
  error,
  saving = false,
  onSubmit,
  onCancel,
}: CustomerFormProps) {
  const [activeTab, setActiveTab] = useState<FormTab>('Overview');
  const [form, setForm] = useState<CustomerFormValues>({
    ...emptyCustomerForm,
    ...initialValues,
  });
  const [fieldErrors, setFieldErrors] = useState<CustomerFieldErrors>({});

  useEffect(() => {
    setForm(normalizeCustomerFormValues(initialValues));
    setFieldErrors({});
  }, [initialValues]);

  const set = (field: keyof CustomerFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      if (field === 'email' || field === 'phone') {
        delete next.email;
        delete next.phone;
      }
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const errors = validateCustomerForm(form);
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
    await onSubmit(prepareCustomerPayload(form));
  };

  const fc = (field: keyof CustomerFormValues) =>
    clsx('input-field', fieldErrors[field] && 'border-red-300 focus:border-red-500 focus:ring-red-500/20');

  const err = (field: keyof CustomerFormValues) =>
    fieldErrors[field] ? <p className="mt-1 text-xs text-red-600">{fieldErrors[field]}</p> : null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-0">
      {error && (
        <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-border px-6 pt-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
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
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">
                Company Name <span className="text-red-500">*</span>
              </label>
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
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">
                Industry <span className="text-red-500">*</span>
              </label>
              <input className={fc('industry')} value={form.industry}
                onChange={(e) => set('industry', e.target.value)}
                placeholder="Food & Beverage, Automotive, Pharma…" />
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
                  <input type="email" className={fc('email')} value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="contact@customer.com" />
                  {err('email')}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Phone</label>
                  <input className={fc('phone')} value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="+1 555 010 2450" />
                  {err('phone')}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Mobile</label>
                  <input className={fc('mobile')} value={form.mobile}
                    onChange={(e) => set('mobile', e.target.value)}
                    placeholder="+1 555 010 2452" />
                  {err('mobile')}
                </div>

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
                  <input type="email" className={fc('secondaryContactEmail')} value={form.secondaryContactEmail}
                    onChange={(e) => set('secondaryContactEmail', e.target.value)}
                    placeholder="secondary@customer.com" />
                  {err('secondaryContactEmail')}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Phone</label>
                  <input className={fc('secondaryContactPhone')} value={form.secondaryContactPhone}
                    onChange={(e) => set('secondaryContactPhone', e.target.value)}
                    placeholder="+1 555 010 2451" />
                  {err('secondaryContactPhone')}
                </div>
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
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">
                Country <span className="text-red-500">*</span>
              </label>
              <input className={fc('country')} value={form.country}
                onChange={(e) => set('country', e.target.value)}
                placeholder="Germany" />
              {err('country')}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">City</label>
              <input className={fc('city')} value={form.city}
                onChange={(e) => set('city', e.target.value)}
                placeholder="Munich" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">State / Province</label>
              <input className={fc('stateProvince')} value={form.stateProvince}
                onChange={(e) => set('stateProvince', e.target.value)}
                placeholder="Bavaria" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Postal Code</label>
              <input className={fc('postalCode')} value={form.postalCode}
                onChange={(e) => set('postalCode', e.target.value)}
                placeholder="80331" />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Street Address</label>
              <textarea className={clsx(fc('address'), 'min-h-20')} value={form.address}
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
                  onClick={() => setForm((prev) => ({
                    ...prev,
                    shippingAddress: prev.address,
                    shippingCity: prev.city,
                    shippingStateProvince: prev.stateProvince,
                    shippingPostalCode: prev.postalCode,
                    shippingCountry: prev.country,
                  }))}
                >
                  Copy Billing
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-fg-secondary">Country</label>
                <input className={fc('shippingCountry')} value={form.shippingCountry}
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

      <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
        )}
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? savingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}

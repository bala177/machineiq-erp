'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, FileText, FolderKanban, Pencil, Plus, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Modal } from '@/components/ui/modal';
import { CustomerForm } from '@/components/customers/customer-form';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  ACCOUNT_TYPE_COLORS,
  ACCOUNT_TYPE_LABELS,
  CustomerFormValues,
  CustomerRecord,
  formatCustomerLocation,
} from '@/lib/customers';
import { formatMoney, QuoteRecord } from '@/lib/quotes';
import { formatDate } from '@/lib/utils';

const TABS = ['Overview', 'Contacts', 'Commercial', 'Quotes'] as const;
type DetailTab = (typeof TABS)[number];

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">{label}</p>
      <p className="mt-1 text-sm text-fg">{value || <span className="text-fg-muted">—</span>}</p>
    </div>
  );
}

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<DetailTab>('Overview');
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      const data = await api.get<CustomerRecord>(`/customers/${params.id}`);
      setCustomer(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [params.id]);

  useEffect(() => {
    setQuotesLoading(true);
    api.get<{ data: QuoteRecord[] }>(`/quotes?customerId=${params.id}&limit=100`)
      .then((res) => setQuotes(res.data))
      .catch(() => setQuotes([]))
      .finally(() => setQuotesLoading(false));
  }, [params.id]);

  const handleSave = async (values: Partial<CustomerFormValues>) => {
    setSaving(true);
    setSaveError('');
    try {
      const updated = await api.patch<CustomerRecord>(`/customers/${params.id}`, values);
      setCustomer(updated);
      setEditOpen(false);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/customers/${params.id}`);
      router.push('/customers');
    } catch (err: any) {
      setError(err.message || 'Failed to delete customer');
      setDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-fg-muted">{error || 'Customer not found'}</p>
        <Link href="/customers" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </Link>
      </div>
    );
  }

  const accountTypeColor = ACCOUNT_TYPE_COLORS[customer.accountType] ?? 'bg-surface-tertiary text-fg-muted';

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <Link href="/customers" className="btn-back mb-4">
          <ArrowLeft className="h-4 w-4" /> Customers
        </Link>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
              <Building2 className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-fg">{customer.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', accountTypeColor)}>
                  {ACCOUNT_TYPE_LABELS[customer.accountType] ?? customer.accountType}
                </span>
                {customer.industry && (
                  <span className="text-xs text-fg-muted">{customer.industry}</span>
                )}
                {customer.companySize && (
                  <span className="text-xs text-fg-muted">{customer.companySize} employees</span>
                )}
                {(customer.city || customer.country) && (
                  <span className="text-xs text-fg-muted">{formatCustomerLocation(customer)}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/opportunities?customerId=${customer._id}&customerName=${encodeURIComponent(customer.name)}`}
              className="btn-ghost px-3 py-2 text-sm"
            >
              <Building2 className="h-4 w-4" /> Machine Inquiries
            </Link>
            <Link
              href={`/projects?customerId=${customer._id}&customerName=${encodeURIComponent(customer.name)}`}
              className="btn-ghost px-3 py-2 text-sm"
            >
              <FolderKanban className="h-4 w-4" /> Projects
            </Link>
            <Link
              href={`/quotes/new?customerId=${customer._id}`}
              className="btn-ghost px-3 py-2 text-sm"
            >
              <FileText className="h-4 w-4" /> New Quote
            </Link>
            <button onClick={() => setEditOpen(true)} className="btn-secondary px-3 py-2">
              <Pencil className="h-4 w-4" /> Edit
            </button>
            <button onClick={() => setDeleteConfirm(true)} className="btn-ghost px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-border bg-surface-secondary/40 px-4">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-fg-muted hover:text-fg-secondary',
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'Overview' && (
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Company Name" value={customer.name} />
              <Field label="Display Name" value={customer.displayName} />
              <Field label="Customer Type" value={customer.customerType?.replace(/\b\w/g, (char) => char.toUpperCase())} />
              <Field label="Industry" value={customer.industry} />
              <Field label="Company Size" value={customer.companySize ? `${customer.companySize} employees` : undefined} />
              <Field label="Website" value={customer.website} />
              {customer.website && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Website Link</p>
                  <a href={customer.website} target="_blank" rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
                    {customer.website}
                  </a>
                </div>
              )}
              {customer.notes && (
                <div className="md:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Notes</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-fg">{customer.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Contacts' && (
            <div className="space-y-6">
              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-fg-muted">Primary Contact</p>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Name" value={customer.contactPerson} />
                  <Field label="Email" value={customer.email} />
                  <Field label="Phone" value={customer.phone} />
                  <Field label="Mobile" value={customer.mobile} />
                  <Field label="Designation" value={customer.designation} />
                  <Field label="Department" value={customer.department} />
                </div>
              </div>

              {(customer.secondaryContactName || customer.secondaryContactEmail || customer.secondaryContactPhone) && (
                <>
                  <hr className="border-border" />
                  <div>
                    <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-fg-muted">Secondary Contact</p>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field label="Name" value={customer.secondaryContactName} />
                      <Field label="Email" value={customer.secondaryContactEmail} />
                      <Field label="Phone" value={customer.secondaryContactPhone} />
                    </div>
                  </div>
                </>
              )}

              <hr className="border-border" />
              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-fg-muted">Billing Address</p>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Country" value={customer.country} />
                  <Field label="City" value={customer.city} />
                  <Field label="State / Province" value={customer.stateProvince} />
                  <Field label="Postal Code" value={customer.postalCode} />
                  <div className="md:col-span-2">
                    <Field label="Street Address" value={customer.address} />
                  </div>
                </div>
              </div>

              {(customer.shippingAddress || customer.shippingCity || customer.shippingCountry) && (
                <>
                  <hr className="border-border" />
                  <div>
                    <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-fg-muted">Shipping Address</p>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field label="Country" value={customer.shippingCountry} />
                      <Field label="City" value={customer.shippingCity} />
                      <Field label="State / Province" value={customer.shippingStateProvince} />
                      <Field label="Postal Code" value={customer.shippingPostalCode} />
                      <div className="md:col-span-2">
                        <Field label="Street Address" value={customer.shippingAddress} />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'Commercial' && (
            <div className="space-y-6">
              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-fg-muted">Commercial Details</p>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="VAT Number" value={customer.vatNumber} />
                  <Field label="Tax Treatment" value={customer.taxTreatment} />
                  <Field label="Place of Supply" value={customer.placeOfSupply} />
                  <Field label="Registration Number" value={customer.registrationNumber} />
                  <Field label="Payment Terms" value={customer.paymentTerms} />
                  <Field label="Currency" value={customer.currencyCode} />
                  <Field label="Credit Limit" value={customer.creditLimit ? formatMoney(Number(customer.creditLimit), customer.currencyCode || 'INR') : undefined} />
                  <Field label="Price List" value={customer.priceList} />
                  <Field label="Delivery Terms" value={customer.deliveryTerms} />
                </div>
              </div>
              {!(customer.vatNumber || customer.registrationNumber || customer.paymentTerms || customer.taxTreatment || customer.creditLimit) && (
                <p className="text-sm text-fg-muted">No commercial details recorded. Use Edit to add them.</p>
              )}
            </div>
          )}

          {activeTab === 'Quotes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Commercial Quotes</p>
                  <p className="mt-1 text-sm text-fg-secondary">{quotes.length} active quote{quotes.length === 1 ? '' : 's'}</p>
                </div>
                <Link href={`/quotes/new?customerId=${customer._id}`} className="btn-primary">
                  <Plus className="h-4 w-4" />
                  New Quote
                </Link>
              </div>
              {quotesLoading ? (
                <p className="text-sm text-fg-muted">Loading quotes...</p>
              ) : quotes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-fg-muted">
                  No quotes recorded for this customer.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="table-header">
                        <th>Quote</th>
                        <th>Status</th>
                        <th>Valid Until</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {quotes.map((quote) => (
                        <tr key={quote._id} className="table-row">
                          <td>
                            <Link href={`/quotes/${quote._id}`} className="font-semibold text-fg hover:text-brand-600">
                              {quote.quoteNo}
                            </Link>
                            <p className="mt-0.5 text-xs text-fg-muted">{formatDate(quote.quoteDate)}</p>
                          </td>
                          <td><StatusBadge status={quote.status} /></td>
                          <td className="text-fg-secondary">{formatDate(quote.validUntil)}</td>
                          <td className="text-right font-semibold">{formatMoney(quote.grandTotal, quote.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Edit modal */}
      {editOpen && (
        <Modal title="Edit Customer" onClose={() => setEditOpen(false)} size="lg" noPadding>
          <CustomerForm
            initialValues={customer}
            submitLabel="Save Changes"
            savingLabel="Saving…"
            saving={saving}
            error={saveError}
            onSubmit={handleSave}
            onCancel={() => setEditOpen(false)}
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <Modal title="Delete Customer" onClose={() => setDeleteConfirm(false)}>
          <div className="p-6 space-y-4">
            <p className="text-sm text-fg-secondary">
              Are you sure you want to delete <strong className="text-fg">{customer.name}</strong>? This action soft-deletes the record and cannot be undone from the UI.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(false)} className="btn-ghost">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="btn-primary bg-red-600 hover:bg-red-700 focus:ring-red-500/20">
                {deleting ? 'Deleting…' : 'Delete Customer'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

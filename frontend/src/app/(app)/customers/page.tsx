'use client';

import { useDeferredValue, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { Building2, BookOpen, Download, FileSpreadsheet, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { generateCustomerTemplate } from '@/lib/generate-customer-template';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Modal } from '@/components/ui/modal';
import { api } from '@/lib/api';
import {
  ACCOUNT_TYPE_COLORS,
  ACCOUNT_TYPE_LABELS,
  CustomerFormValues,
  CustomerRecord,
  formatCustomerLocation,
} from '@/lib/customers';
import { CustomerForm } from '@/components/customers/customer-form';
import { ImportCustomersModal } from '@/components/customers/import-customers-modal';

const CSV_COLUMNS = [
  { col: 'name',                     required: true,  note: 'Company name' },
  { col: 'account type',             required: false, note: 'prospect · active · inactive · churned' },
  { col: 'company size',             required: false, note: '1-10 · 11-50 · 51-200 · 201-1000 · 1001+' },
  { col: 'industry',                 required: false, note: 'Free text, e.g. "Industrial Automation"' },
  { col: 'website',                  required: false, note: 'Full URL' },
  { col: 'contact person',           required: false, note: 'Primary contact full name' },
  { col: 'email',                    required: false, note: 'Primary contact email' },
  { col: 'phone',                    required: false, note: 'Primary contact phone' },
  { col: 'secondary contact name',   required: false, note: 'Secondary contact full name' },
  { col: 'secondary contact email',  required: false, note: '' },
  { col: 'secondary contact phone',  required: false, note: '' },
  { col: 'address',                  required: false, note: 'Street address' },
  { col: 'city',                     required: false, note: '' },
  { col: 'state/province',           required: false, note: '' },
  { col: 'postal code',              required: false, note: '' },
  { col: 'country',                  required: false, note: '' },
  { col: 'vat number',               required: false, note: '' },
  { col: 'registration number',      required: false, note: '' },
  { col: 'payment terms',            required: false, note: 'e.g. "Net 30"' },
  { col: 'notes',                    required: false, note: 'Free text' },
];

const SAMPLE_ROWS = [
  { name: 'Acme Automation GmbH', accountType: 'active', companySize: '201-1000', industry: 'Industrial Automation', contactPerson: 'Klaus Weber', email: 'k.weber@acmeautomation.de', country: 'Germany' },
  { name: 'Nordic CNC Solutions',  accountType: 'prospect', companySize: '11-50',   industry: 'CNC Manufacturing',     contactPerson: 'Lars Eriksson',  email: 'l.eriksson@nordiccnc.se',   country: 'Sweden'  },
  { name: 'TechForge Industries',  accountType: 'active',   companySize: '1001+',   industry: 'Heavy Machinery',       contactPerson: 'Maria Santos',   email: 'm.santos@techforge.com',    country: 'United States' },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomerRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeSearch, setActiveSearch] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [csvGuideOpen, setCsvGuideOpen] = useState(false);

  const deferredSearch = useDeferredValue(search.trim());
  const latestRequestRef = useRef(0);

  const loadCustomers = async (searchTerm = search) => {
    const requestId = ++latestRequestRef.current;
    const normalizedSearch = searchTerm.trim();

    if (loading && customers.length === 0) {
      setLoading(true);
    } else {
      setSearching(true);
    }

    try {
      const query = normalizedSearch ? `?search=${encodeURIComponent(normalizedSearch)}` : '';
      const data = await api.get<CustomerRecord[]>(`/customers${query}`);
      if (requestId !== latestRequestRef.current) return;
      setCustomers(data);
      setActiveSearch(normalizedSearch);
    } catch (err: any) {
      if (requestId !== latestRequestRef.current) return;
      setError(err.message || 'Failed to load customers');
    } finally {
      if (requestId !== latestRequestRef.current) return;
      setLoading(false);
      setSearching(false);
    }
  };

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadCustomers(deferredSearch);
    }, deferredSearch ? 180 : 0);
    return () => window.clearTimeout(id);
  }, [deferredSearch]);

  const handleCreate = async (values: Partial<CustomerFormValues>) => {
    setSaving(true);
    setError('');
    try {
      await api.post('/customers', values);
      setCreateOpen(false);
      await loadCustomers(activeSearch);
    } catch (err: any) {
      setError(err.message || 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/customers/${deleteTarget._id}`);
      setDeleteTarget(null);
      await loadCustomers(activeSearch);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <PageHeader
        title="Customers"
        description="Manage customer records reused across machine inquiries and projects."
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setCsvGuideOpen(true)} className="btn-ghost">
              <BookOpen className="h-4 w-4" />
              Import Guide
            </button>
            <button onClick={() => setImportOpen(true)} className="btn-ghost">
              <Upload className="h-4 w-4" />
              Import
            </button>
            <button onClick={() => { setError(''); setCreateOpen(true); }} className="btn-primary">
              <Plus className="h-4 w-4" />
              New Customer
            </button>
          </div>
        }
      />

      <div className="mb-6 card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input
              className="input-field pl-9 pr-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer code, name, contact, email, or country"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-fg-muted hover:bg-surface-tertiary hover:text-fg"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex min-w-[220px] items-center justify-between rounded-2xl border border-border bg-surface-tertiary/40 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Results</p>
              <p className="mt-1 text-sm font-medium text-fg">
                {customers.length} {customers.length === 1 ? 'customer' : 'customers'}
              </p>
            </div>
            <p className="text-sm text-fg-muted">
              {searching ? 'Searching…' : activeSearch ? `for "${activeSearch}"` : 'All records'}
            </p>
          </div>
        </div>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-10 w-10" />}
          title={activeSearch ? 'No customers match this search' : 'No customers found'}
          description={
            activeSearch
              ? 'Try a different name, email, contact, or country keyword.'
              : 'Create your first customer record.'
          }
          action={
            <button onClick={() => { setError(''); setCreateOpen(true); }} className="btn-primary">
              <Plus className="h-4 w-4" />
              New Customer
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="table-header">
                  <th>Company</th>
                  <th>Primary Contact</th>
                  <th>Location</th>
                  <th>Industry</th>
                  <th className="w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((customer) => {
                  const typeColor = ACCOUNT_TYPE_COLORS[customer.accountType] ?? 'bg-surface-tertiary text-fg-muted';
                  return (
                    <tr key={customer._id} className="table-row">
                      <td className="px-5 py-4">
                        <Link href={`/customers/${customer._id}`}
                          className="font-semibold text-fg hover:text-brand-600 transition-colors">
                          {customer.name}
                        </Link>
                        <p className="mt-0.5 font-mono text-xs text-fg-muted">{customer.code}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', typeColor)}>
                            {ACCOUNT_TYPE_LABELS[customer.accountType] ?? customer.accountType}
                          </span>
                          {customer.companySize && (
                            <span className="text-xs text-fg-muted">{customer.companySize} emp.</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-fg-secondary">
                        <p>{customer.contactPerson || '—'}</p>
                        <p className="mt-0.5 text-xs text-fg-muted">{customer.email || customer.phone || 'No contact'}</p>
                      </td>
                      <td className="px-5 py-4 text-fg-secondary">
                        {formatCustomerLocation(customer)}
                      </td>
                      <td className="px-5 py-4 text-fg-secondary">{customer.industry || '—'}</td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setDeleteTarget(customer)}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-fg-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 transition-colors"
                          aria-label={`Delete ${customer.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create modal */}
      {createOpen && (
        <Modal title="New Customer" onClose={() => setCreateOpen(false)} size="lg" noPadding>
          <CustomerForm
            submitLabel="Create Customer"
            savingLabel="Creating…"
            saving={saving}
            error={error}
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
          />
        </Modal>
      )}

      {/* CSV Import Guide modal */}
      {csvGuideOpen && (
        <Modal title="CSV Import Guide" onClose={() => setCsvGuideOpen(false)} size="xl">
          <div className="space-y-6">
            {/* Download actions */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="/sample-data/customers_sample.csv"
                download="customers_sample.csv"
                className="btn-ghost flex-1 justify-center gap-2 py-3 text-sm"
              >
                <Download className="h-4 w-4" />
                <span>
                  <span className="font-semibold">Sample CSV</span>
                  <span className="ml-1.5 text-fg-muted font-normal">5 filled rows, all columns</span>
                </span>
              </a>
              <button
                type="button"
                onClick={() => generateCustomerTemplate()}
                className="btn-ghost flex-1 justify-center gap-2 py-3 text-sm border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>
                  <span className="font-semibold">Excel Template</span>
                  <span className="ml-1.5 text-fg-muted font-normal">headers + Field Guide sheet</span>
                </span>
              </button>
            </div>

            {/* Column reference */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">Column Reference</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {CSV_COLUMNS.map(({ col, required, note }) => (
                  <div key={col} className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-secondary/40 px-3 py-2.5">
                    <span className={clsx(
                      'mt-0.5 inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                      required
                        ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                        : 'bg-surface-tertiary text-fg-muted'
                    )}>
                      {required ? 'req' : 'opt'}
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold text-fg">{col}</p>
                      {note && <p className="mt-0.5 text-[11px] text-fg-muted leading-tight">{note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample rows preview */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">Sample Rows</p>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface-secondary">
                      {['name', 'account type', 'company size', 'industry', 'contact person', 'email', 'country'].map(h => (
                        <th key={h} className="px-3 py-2.5 font-mono font-semibold text-fg-muted whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {SAMPLE_ROWS.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-surface' : 'bg-surface-secondary/30'}>
                        <td className="px-3 py-2.5 font-medium text-fg whitespace-nowrap">{row.name}</td>
                        <td className="px-3 py-2.5 text-fg-secondary whitespace-nowrap">{row.accountType}</td>
                        <td className="px-3 py-2.5 text-fg-secondary whitespace-nowrap">{row.companySize}</td>
                        <td className="px-3 py-2.5 text-fg-secondary whitespace-nowrap">{row.industry}</td>
                        <td className="px-3 py-2.5 text-fg-secondary whitespace-nowrap">{row.contactPerson}</td>
                        <td className="px-3 py-2.5 text-fg-secondary whitespace-nowrap">{row.email}</td>
                        <td className="px-3 py-2.5 text-fg-secondary whitespace-nowrap">{row.country}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Import rules */}
            <div className="rounded-xl border border-border bg-surface-secondary/50 px-4 py-3.5 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted mb-2">Import Rules</p>
              {[
                'The first row must be the header row — column order does not matter.',
                'Only the name column is required. Rows with a blank name are skipped.',
                'Duplicate company names are skipped (existing records are not overwritten).',
                'Invalid account type or company size values are silently cleared.',
                'Accepts .csv, .xlsx, and .xls files up to 10 MB.',
              ].map((rule, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-fg-secondary">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fg-muted" />
                  {rule}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Import modal */}
      {importOpen && (
        <ImportCustomersModal
          onClose={() => setImportOpen(false)}
          onImported={() => void loadCustomers(activeSearch)}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <Modal title="Delete Customer" onClose={() => { setDeleteTarget(null); setDeleteError(''); }}>
          <div className="space-y-4">
            {deleteError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                {deleteError}
              </div>
            )}
            <p className="text-sm text-fg-secondary">
              Delete <strong className="text-fg">{deleteTarget.name}</strong>? The record will be soft-deleted and removed from all lists.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setDeleteTarget(null); setDeleteError(''); }} className="btn-ghost">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="btn-primary bg-red-600 hover:bg-red-700 focus:ring-red-500/20">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

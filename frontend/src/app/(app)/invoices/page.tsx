'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import Link from 'next/link';
import { ReceiptText, Search, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StatusBadge } from '@/components/ui/status-badge';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { formatMoney, INVOICE_STATUSES, invoiceCustomerName, InvoiceRecord } from '@/lib/invoices';

const PAGE_SIZE = 20;

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const fetchInvoices = async (newSkip: number, replace: boolean) => {
    if (replace) setLoading(true);
    else setLoadingMore(true);
    const query = new URLSearchParams();
    query.set('limit', String(PAGE_SIZE));
    query.set('skip', String(newSkip));
    if (status) query.set('status', status);

    try {
      const res = await api.get<{ data: InvoiceRecord[]; total: number }>(`/invoices?${query.toString()}`);
      setInvoices((prev) => (replace ? res.data : [...prev, ...res.data]));
      setTotal(res.total);
      setSkip(newSkip);
    } finally {
      if (replace) setLoading(false);
      else setLoadingMore(false);
    }
  };

  useEffect(() => {
    void fetchInvoices(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const visibleInvoices = deferredSearch
    ? invoices.filter((invoice) => {
        const haystack = `${invoice.invoiceNo} ${invoiceCustomerName(invoice)} ${invoice.sourceQuoteId?.quoteNo || ''}`.toLowerCase();
        return haystack.includes(deferredSearch);
      })
    : invoices;

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <PageHeader title="Invoices" description="Billing records created from accepted quotations." />

      <div className="mb-6 card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input className="input-field pl-9 pr-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice, customer, or quote" />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-fg-muted hover:bg-surface-tertiary hover:text-fg">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field">
            <option value="">All statuses</option>
            {INVOICE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <div className="rounded-lg border border-border bg-surface-tertiary px-3 py-2 text-sm text-fg-secondary">
            {visibleInvoices.length} of {total}
          </div>
        </div>
      </div>

      {visibleInvoices.length === 0 ? (
        <EmptyState icon={<ReceiptText className="h-10 w-10" />} title="No invoices found" description="Create an invoice from an accepted quote when billing should begin." />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="table-header">
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Source Quote</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th className="text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibleInvoices.map((invoice) => (
                    <tr key={invoice._id} className="table-row">
                      <td>
                        <Link href={`/invoices/${invoice._id}`} className="font-semibold text-fg hover:text-brand-600">
                          {invoice.invoiceNo}
                        </Link>
                        <p className="mt-0.5 text-xs text-fg-muted">{formatDate(invoice.invoiceDate)}</p>
                      </td>
                      <td className="text-fg-secondary">{invoiceCustomerName(invoice)}</td>
                      <td className="text-fg-secondary">
                        {invoice.sourceQuoteId?._id ? (
                          <Link href={`/quotes/${invoice.sourceQuoteId._id}`} className="hover:text-brand-600">
                            {invoice.sourceQuoteId.quoteNo}
                          </Link>
                        ) : (
                          invoice.sourceQuoteId?.quoteNo || '-'
                        )}
                      </td>
                      <td className="text-fg-secondary">{formatDate(invoice.dueDate)}</td>
                      <td><StatusBadge status={invoice.status} /></td>
                      <td className="text-right font-semibold text-fg">{formatMoney(invoice.balanceDue, invoice.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {invoices.length < total && (
            <div className="mt-4 flex justify-center">
              <button type="button" onClick={() => void fetchInvoices(skip + PAGE_SIZE, false)} disabled={loadingMore} className="btn-secondary">
                {loadingMore ? 'Loading...' : `Load more (${total - invoices.length} remaining)`}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

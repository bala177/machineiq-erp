'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FileText, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { api } from '@/lib/api';
import { CustomerRecord } from '@/lib/customers';
import { customerNameFromQuote, formatMoney, QuoteRecord, QUOTE_STATUSES } from '@/lib/quotes';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';

const PAGE_SIZE = 20;

export default function QuotesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') || '';
  const opportunityId = searchParams.get('opportunityId') || '';
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [status, setStatus] = useState('');
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<QuoteRecord | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const deferredSearch = useDeferredValue(search.trim());
  const canCreate = ['admin', 'sales'].includes(user?.role || '');
  const canDeleteQuote = ['admin', 'manager'].includes(user?.role || '');
  const canEditQuote = (quote: QuoteRecord) => ['admin', 'sales'].includes(user?.role || '') && quote.status === 'draft';

  const fetchQuotes = async (newSkip: number, replace: boolean) => {
    if (replace) setLoading(true);
    else setLoadingMore(true);
    const query = new URLSearchParams();
    query.set('limit', String(PAGE_SIZE));
    query.set('skip', String(newSkip));
    if (status) query.set('status', status);
    if (customerId) query.set('customerId', customerId);
    if (opportunityId) query.set('opportunityId', opportunityId);
    if (deferredSearch) query.set('search', deferredSearch);

    try {
      const res = await api.get<{ data: QuoteRecord[]; total: number }>(`/quotes?${query.toString()}`);
      setQuotes((prev) => (replace ? res.data : [...prev, ...res.data]));
      setTotal(res.total);
      setSkip(newSkip);
    } finally {
      if (replace) setLoading(false);
      else setLoadingMore(false);
    }
  };

  useEffect(() => {
    api
      .get<CustomerRecord[]>('/customers')
      .then(setCustomers)
      .catch(() => {});
  }, []);

  useEffect(() => {
    void fetchQuotes(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, customerId, opportunityId, deferredSearch]);

  const handleDeleteQuote = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    setDeleteError('');
    try {
      await api.delete(`/quotes/${deleteTarget._id}`);
      setQuotes((prev) => prev.filter((quote) => quote._id !== deleteTarget._id));
      setTotal((prev) => Math.max(0, prev - 1));
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete quote');
    } finally {
      setDeleteBusy(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <PageHeader
        title="Quotes"
        description="Customer-linked commercial quotes for machine requests."
        actions={
          canCreate ? (
            <Link href="/quotes/new" className="btn-primary">
              <Plus className="h-4 w-4" />
              New Quote
            </Link>
          ) : undefined
        }
      />

      <div className="mb-6 card p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_260px_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input className="input-field pl-9 pr-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by quote number, customer, notes, or terms" />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-fg-muted hover:bg-surface-tertiary hover:text-fg">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field">
            <option value="">All statuses</option>
            {QUOTE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="input-field">
            <option value="">All customers</option>
            {customers.map((customer) => (
              <option key={customer._id} value={customer._id}>
                {customer.name}
              </option>
            ))}
          </select>
          <div className="rounded-lg border border-border bg-surface-tertiary px-3 py-2 text-sm text-fg-secondary">
            {quotes.length} of {total}
          </div>
        </div>
      </div>

      {quotes.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title="No quotes found"
          description="Create a quote from a customer or machine inquiry to start commercial tracking."
          action={
            canCreate ? (
              <Link href="/quotes/new" className="btn-primary">
                <Plus className="h-4 w-4" /> New Quote
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="table-header">
                    <th>Quote</th>
                    <th>Customer</th>
                    <th>Machine Inquiry</th>
                    <th>Valid Until</th>
                    <th>Status</th>
                    <th className="text-right">Total</th>
                    <th className="w-28 text-right">Actions</th>
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
                      <td className="text-fg-secondary">{customerNameFromQuote(quote)}</td>
                      <td className="text-fg-secondary">
                        {quote.opportunityId?._id ? (
                          <Link href={`/opportunities/${quote.opportunityId._id}`} className="hover:text-brand-600">
                            {quote.opportunityId.requestNo || quote.opportunityId.title}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="text-fg-secondary">{formatDate(quote.validUntil)}</td>
                      <td>
                        <StatusBadge status={quote.status} />
                      </td>
                      <td className="text-right font-semibold text-fg">{formatMoney(quote.grandTotal, quote.currency)}</td>
                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          {canEditQuote(quote) && (
                            <Link href={`/quotes/${quote._id}/edit`} className="btn-ghost p-2" aria-label="Edit quote">
                              <Pencil className="h-4 w-4" />
                            </Link>
                          )}
                          {canDeleteQuote && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteError('');
                                setDeleteTarget(quote);
                              }}
                              className="btn-ghost p-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                              aria-label="Delete quote"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {quotes.length < total && (
            <div className="mt-4 flex justify-center">
              <button type="button" onClick={() => void fetchQuotes(skip + PAGE_SIZE, false)} disabled={loadingMore} className="btn-secondary">
                {loadingMore ? 'Loading...' : `Load more (${total - quotes.length} remaining)`}
              </button>
            </div>
          )}
        </>
      )}

      {deleteTarget && (
        <Modal title="Delete Quote" onClose={() => !deleteBusy && setDeleteTarget(null)} size="md">
          <div className="space-y-4">
            <p className="text-sm text-fg-secondary">
              Delete <span className="font-semibold text-fg">{deleteTarget.quoteNo}</span>? This action removes the quote from active records.
            </p>
            {deleteError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{deleteError}</div>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleteBusy} className="btn-ghost">
                Cancel
              </button>
              <button type="button" onClick={() => void handleDeleteQuote()} disabled={deleteBusy} className="btn-danger">
                {deleteBusy ? 'Deleting...' : 'Delete Quote'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

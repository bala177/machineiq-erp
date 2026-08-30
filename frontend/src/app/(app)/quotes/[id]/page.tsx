'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Copy, FilePenLine, FileText, FolderKanban, Printer, ReceiptText, Send, ThumbsDown, ThumbsUp, TimerOff, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { InvoiceRecord } from '@/lib/invoices';
import { formatMoney, QuoteRecord } from '@/lib/quotes';
import { formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/providers/auth-provider';

function SnapshotField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{label}</p>
      <p className="mt-1 text-sm text-fg">{value || <span className="text-fg-muted">-</span>}</p>
    </div>
  );
}

export default function QuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [quote, setQuote] = useState<QuoteRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [convertForm, setConvertForm] = useState({ projectManagerId: '', targetDeliveryDate: '', startDate: '' });
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);

  const role = user?.role || '';
  const canSend = ['admin', 'sales'].includes(role) && quote?.status === 'draft';
  const canResolve = ['admin', 'manager', 'sales'].includes(role) && quote?.status === 'sent';
  const canDuplicate = ['admin', 'sales'].includes(role);
  const canDelete = ['admin', 'manager'].includes(role);
  const canEdit = ['admin', 'sales'].includes(role) && quote?.status === 'draft';
  const canConvert = ['admin', 'manager', 'sales'].includes(role) && quote?.status === 'accepted' && !quote?.convertedProjectId;
  const canCreateInvoice = ['admin', 'manager', 'sales'].includes(role) && quote?.status === 'accepted' && invoices.length === 0;

  const load = async () => {
    try {
      const data = await api.get<QuoteRecord>(`/quotes/${params.id}`);
      setQuote(data);
      const invoiceRes = await api.get<{ data: InvoiceRecord[] }>(`/invoices?sourceQuoteId=${params.id}&limit=20`).catch(() => ({ data: [] }));
      setInvoices(invoiceRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [params.id]);

  useEffect(() => {
    if (!convertOpen) return;
    api.get<any[]>('/users')
      .then((data) => {
        setUsers(data);
        setConvertForm((cur) => ({ ...cur, projectManagerId: cur.projectManagerId || data[0]?._id || '' }));
      })
      .catch(() => setUsers([]));
  }, [convertOpen]);

  const setStatus = async (status: string) => {
    setBusy(status);
    setError('');
    try {
      const updated = await api.patch<QuoteRecord>(`/quotes/${params.id}/status`, { status });
      setQuote(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setBusy('');
    }
  };

  const duplicate = async () => {
    setBusy('duplicate');
    try {
      const created = await api.post<QuoteRecord>(`/quotes/${params.id}/duplicate`, {});
      router.push(`/quotes/${created._id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate quote');
      setBusy('');
    }
  };

  const remove = async () => {
    setBusy('delete');
    try {
      await api.delete(`/quotes/${params.id}`);
      router.push('/quotes');
    } catch (err: any) {
      setError(err.message || 'Failed to delete quote');
      setBusy('');
    }
  };

  const convertToProject = async () => {
    if (!quote) return;
    setBusy('convert');
    setError('');
    try {
      const result = await api.post<any>(`/quotes/${params.id}/convert-to-project`, {
        name: quote.opportunityId?.title || quote.customerSnapshot?.name || quote.quoteNo,
        description: `Project converted from quote ${quote.quoteNo}`,
        projectManagerId: convertForm.projectManagerId,
        targetDeliveryDate: convertForm.targetDeliveryDate || undefined,
        startDate: convertForm.startDate || undefined,
      });
      router.push(`/projects/${result.project._id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to convert quote');
      setBusy('');
    }
  };

  const createInvoice = async () => {
    setBusy('invoice');
    setError('');
    try {
      const created = await api.post<InvoiceRecord>(`/invoices/from-quote/${params.id}`, {
        projectId: quote?.convertedProjectId?._id,
      });
      setInvoices([created]);
    } catch (err: any) {
      setError(err.message || 'Failed to create invoice');
    } finally {
      setBusy('');
    }
  };

  if (loading) return <p className="p-8 text-sm text-fg-muted">Loading quote...</p>;
  if (!quote) {
    return (
      <div className="card p-5">
        <p className="text-sm text-fg-muted">{error || 'Quote not found'}</p>
      </div>
    );
  }

  const billing = quote.customerSnapshot?.billingAddress || {};

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/quotes" className="btn-back mb-3">
            <ArrowLeft className="h-4 w-4" />
            Quotes
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={quote.status} />
            <span className="rounded-md bg-bg-subtle px-2 py-0.5 font-mono text-xs text-fg-secondary">{quote.quoteNo}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-fg">{quote.customerSnapshot?.name || quote.customerId?.name}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canSend && (
            <button type="button" onClick={() => void setStatus('sent')} disabled={!!busy} className="btn-primary">
              <Send className="h-4 w-4" />
              {busy === 'sent' ? 'Sending...' : 'Send'}
            </button>
          )}
          {canResolve && (
            <>
              <button type="button" onClick={() => void setStatus('accepted')} disabled={!!busy} className="btn-primary bg-emerald-600 hover:bg-emerald-700">
                <ThumbsUp className="h-4 w-4" />
                Accept
              </button>
              <button type="button" onClick={() => void setStatus('declined')} disabled={!!busy} className="btn-secondary">
                <ThumbsDown className="h-4 w-4" />
                Decline
              </button>
              <button type="button" onClick={() => void setStatus('expired')} disabled={!!busy} className="btn-secondary">
                <TimerOff className="h-4 w-4" />
                Expire
              </button>
            </>
          )}
          {canEdit && (
            <Link href={`/quotes/${quote._id}/edit`} className="btn-secondary">
              <FilePenLine className="h-4 w-4" />
              Edit
            </Link>
          )}
          <Link href={`/quotes/${quote._id}/print`} className="btn-secondary">
            <Printer className="h-4 w-4" />
            Print
          </Link>
          {canConvert && (
            <button type="button" onClick={() => setConvertOpen(true)} disabled={!!busy} className="btn-primary">
              <FolderKanban className="h-4 w-4" />
              Create Project
            </button>
          )}
          {canCreateInvoice && (
            <button type="button" onClick={() => void createInvoice()} disabled={!!busy} className="btn-primary">
              <ReceiptText className="h-4 w-4" />
              {busy === 'invoice' ? 'Creating...' : 'Create Invoice'}
            </button>
          )}
          {invoices[0]?._id && (
            <Link href={`/invoices/${invoices[0]._id}`} className="btn-secondary">
              <ReceiptText className="h-4 w-4" />
              Invoice
            </Link>
          )}
          {quote.convertedProjectId?._id && (
            <Link href={`/projects/${quote.convertedProjectId._id}`} className="btn-secondary">
              <FolderKanban className="h-4 w-4" />
              Project
            </Link>
          )}
          {canDuplicate && (
            <button type="button" onClick={() => void duplicate()} disabled={!!busy} className="btn-secondary">
              <Copy className="h-4 w-4" />
              Duplicate
            </button>
          )}
          {canDelete && (
            <button type="button" onClick={() => setDeleteOpen(true)} disabled={!!busy} className="btn-danger">
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="card p-5">
            <div className="grid gap-5 md:grid-cols-3">
              <SnapshotField label="Subject" value={quote.subject} />
              <SnapshotField label="Quote Date" value={formatDate(quote.quoteDate)} />
              <SnapshotField label="Valid Until" value={formatDate(quote.validUntil)} />
              <SnapshotField label="Currency" value={quote.currency} />
              <SnapshotField label="Sales Person" value={quote.salesPerson} />
              <SnapshotField label="Contact" value={quote.customerSnapshot?.contactPerson} />
              <SnapshotField label="Email" value={quote.customerSnapshot?.email} />
              <SnapshotField label="Phone" value={quote.customerSnapshot?.phone} />
              <SnapshotField label="Payment Terms" value={quote.customerSnapshot?.paymentTerms} />
              <SnapshotField label="Accepted On" value={quote.acceptedAt ? formatDate(quote.acceptedAt) : ''} />
              <SnapshotField label="Customer PO" value={quote.customerPoNumber} />
              <SnapshotField label="Billing Address" value={[billing.address, billing.city, billing.stateProvince, billing.postalCode, billing.country].filter(Boolean).join(', ')} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Links</p>
                <div className="mt-1 flex flex-wrap gap-2 text-sm">
                  {quote.customerId?._id && <Link href={`/customers/${quote.customerId._id}`} className="text-brand-600 hover:underline">Customer</Link>}
                  {quote.opportunityId?._id && <Link href={`/opportunities/${quote.opportunityId._id}`} className="text-brand-600 hover:underline">Machine Inquiry</Link>}
                  {!quote.customerId?._id && !quote.opportunityId?._id && <span className="text-fg-muted">-</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-fg">Line items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="table-header">
                    <th>Description</th>
                    <th>SKU</th>
                    <th>HSN/SAC</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Rate</th>
                    <th>Disc</th>
                    <th>Tax</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {quote.lineItems.map((item, index) => (
                    <tr key={index} className="table-row">
                      <td>
                        <p className="font-medium text-fg">{item.itemName || item.description}</p>
                        {item.itemName && <p className="text-xs text-fg-muted">{item.description}</p>}
                      </td>
                      <td>{item.sku || '-'}</td>
                      <td>{item.hsnSac || '-'}</td>
                      <td>{item.quantity}</td>
                      <td>{item.unit || '-'}</td>
                      <td>{formatMoney(item.unitPrice, quote.currency)}</td>
                      <td>{item.discountType === 'amount' ? formatMoney(item.discountValue, quote.currency) : `${item.discountValue ?? item.discountPercent ?? 0}%`}</td>
                      <td>{item.taxName || `${item.taxPercent || 0}%`}</td>
                      <td className="text-right font-semibold">{formatMoney(item.lineTotal, quote.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {(quote.notes || quote.terms) && (
            <div className="grid gap-5 md:grid-cols-2">
              {quote.notes && (
                <div className="card p-5">
                  <h2 className="mb-2 text-sm font-semibold text-fg">Notes</h2>
                  <p className="whitespace-pre-wrap text-sm text-fg-secondary">{quote.notes}</p>
                </div>
              )}
              {quote.terms && (
                <div className="card p-5">
                  <h2 className="mb-2 text-sm font-semibold text-fg">Terms</h2>
                  <p className="whitespace-pre-wrap text-sm text-fg-secondary">{quote.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="card p-5 lg:sticky lg:top-4">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-fg-muted" />
            <h2 className="text-sm font-semibold text-fg">Commercial Summary</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-fg-muted">Subtotal</span><span>{formatMoney(quote.subtotal, quote.currency)}</span></div>
            <div className="flex justify-between"><span className="text-fg-muted">Discount</span><span>{formatMoney(quote.discountTotal, quote.currency)}</span></div>
            <div className="flex justify-between"><span className="text-fg-muted">Tax</span><span>{formatMoney(quote.taxTotal, quote.currency)}</span></div>
            <div className="flex justify-between"><span className="text-fg-muted">Shipping / Handling</span><span>{formatMoney(quote.shippingCharge, quote.currency)}</span></div>
            <div className="flex justify-between"><span className="text-fg-muted">Adjustment</span><span>{formatMoney(quote.adjustment, quote.currency)}</span></div>
            <div className="border-t border-border pt-3 flex justify-between text-base font-bold text-fg">
              <span>Grand Total</span>
              <span>{formatMoney(quote.grandTotal, quote.currency)}</span>
            </div>
          </div>
          {quote.status === 'accepted' && (
            <div className="mt-5 rounded-lg border border-border bg-surface-secondary p-3 text-sm">
              <p className="font-semibold text-fg">Accepted quote flow</p>
              <div className="mt-3 space-y-2 text-fg-secondary">
                <div className="flex items-center justify-between gap-3">
                  <span>Project kickoff</span>
                  {quote.convertedProjectId?._id ? (
                    <Link href={`/projects/${quote.convertedProjectId._id}`} className="text-brand-600 hover:underline">{quote.convertedProjectId.projectNo || 'Open project'}</Link>
                  ) : (
                    <span className="text-fg-muted">Not created</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Invoice</span>
                  {invoices[0]?._id ? (
                    <Link href={`/invoices/${invoices[0]._id}`} className="text-brand-600 hover:underline">{invoices[0].invoiceNo}</Link>
                  ) : (
                    <span className="text-fg-muted">Not created</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {deleteOpen && (
        <Modal title="Delete Quote" onClose={() => setDeleteOpen(false)} size="md">
          <div className="space-y-4">
            <p className="text-sm text-fg-secondary">Delete <span className="font-semibold text-fg">{quote.quoteNo}</span>? It will be removed from active quote lists.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteOpen(false)} className="btn-ghost">Cancel</button>
              <button type="button" onClick={() => void remove()} disabled={busy === 'delete'} className="btn-danger">
                {busy === 'delete' ? 'Deleting...' : 'Delete Quote'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {convertOpen && (
        <Modal title="Convert Quote to Project" onClose={() => setConvertOpen(false)} size="md">
          <div className="space-y-4">
            <p className="text-sm text-fg-secondary">Create a project from <span className="font-semibold text-fg">{quote.quoteNo}</span> and keep the quote linked as the commercial source.</p>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-fg-secondary">Project Lead</span>
              <select className="input-field" value={convertForm.projectManagerId} onChange={(e) => setConvertForm((cur) => ({ ...cur, projectManagerId: e.target.value }))}>
                <option value="">Select project lead</option>
                {users.map((user) => <option key={user._id} value={user._id}>{user.firstName} {user.lastName}</option>)}
              </select>
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-fg-secondary">Start Date</span>
                <input className="input-field" type="date" value={convertForm.startDate} onChange={(e) => setConvertForm((cur) => ({ ...cur, startDate: e.target.value }))} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-fg-secondary">Target Delivery</span>
                <input className="input-field" type="date" value={convertForm.targetDeliveryDate} onChange={(e) => setConvertForm((cur) => ({ ...cur, targetDeliveryDate: e.target.value }))} />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConvertOpen(false)} className="btn-ghost">Cancel</button>
              <button type="button" onClick={() => void convertToProject()} disabled={busy === 'convert' || !convertForm.projectManagerId} className="btn-primary">
                {busy === 'convert' ? 'Converting...' : 'Convert to Project'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

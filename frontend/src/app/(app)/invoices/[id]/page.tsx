'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, ReceiptText, Send } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { formatMoney, InvoiceRecord } from '@/lib/invoices';
import { useAuth } from '@/providers/auth-provider';

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{label}</p>
      <p className="mt-1 text-sm text-fg">{value || <span className="text-fg-muted">-</span>}</p>
    </div>
  );
}

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const canManage = ['admin', 'manager', 'sales'].includes(user?.role || '');
  const canRecordPayment = ['admin', 'manager'].includes(user?.role || '') && invoice && !['draft', 'paid', 'void'].includes(invoice.status);

  const load = async () => {
    try {
      const data = await api.get<InvoiceRecord>(`/invoices/${params.id}`);
      setInvoice(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [params.id]);

  const setStatus = async (status: string) => {
    setBusy(status);
    setError('');
    try {
      const updated = await api.patch<InvoiceRecord>(`/invoices/${params.id}/status`, { status });
      setInvoice(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to update invoice');
    } finally {
      setBusy('');
    }
  };

  const recordFullPayment = async () => {
    if (!invoice) return;
    setBusy('payment');
    setError('');
    try {
      const updated = await api.post<InvoiceRecord>(`/invoices/${params.id}/payments`, { amount: invoice.balanceDue });
      setInvoice(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setBusy('');
    }
  };

  if (loading) return <p className="p-8 text-sm text-fg-muted">Loading invoice...</p>;
  if (!invoice) return <div className="card p-5 text-sm text-fg-muted">{error || 'Invoice not found'}</div>;

  const billing = invoice.customerSnapshot?.billingAddress || {};

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/invoices" className="btn-back mb-3">
            <ArrowLeft className="h-4 w-4" />
            Invoices
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={invoice.status} />
            <span className="rounded-md bg-bg-subtle px-2 py-0.5 font-mono text-xs text-fg-secondary">{invoice.invoiceNo}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-fg">{invoice.customerSnapshot?.name || invoice.customerId?.name}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManage && invoice.status === 'draft' && (
            <button type="button" onClick={() => void setStatus('sent')} disabled={!!busy} className="btn-primary">
              <Send className="h-4 w-4" />
              {busy === 'sent' ? 'Sending...' : 'Mark Sent'}
            </button>
          )}
          {canManage && invoice.status === 'sent' && (
            <button type="button" onClick={() => void setStatus('unpaid')} disabled={!!busy} className="btn-secondary">
              <ReceiptText className="h-4 w-4" />
              Mark Unpaid
            </button>
          )}
          {canRecordPayment && (
            <button type="button" onClick={() => void recordFullPayment()} disabled={!!busy} className="btn-primary">
              <CheckCircle2 className="h-4 w-4" />
              {busy === 'payment' ? 'Recording...' : 'Record Full Payment'}
            </button>
          )}
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="card p-5">
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Invoice Date" value={formatDate(invoice.invoiceDate)} />
              <Field label="Due Date" value={formatDate(invoice.dueDate)} />
              <Field label="Currency" value={invoice.currency} />
              <Field label="Contact" value={invoice.customerSnapshot?.contactPerson} />
              <Field label="Email" value={invoice.customerSnapshot?.email} />
              <Field label="Phone" value={invoice.customerSnapshot?.phone} />
              <Field label="Billing Address" value={[billing.address, billing.city, billing.stateProvince, billing.postalCode, billing.country].filter(Boolean).join(', ')} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Links</p>
                <div className="mt-1 flex flex-wrap gap-2 text-sm">
                  {invoice.sourceQuoteId?._id && <Link href={`/quotes/${invoice.sourceQuoteId._id}`} className="text-brand-600 hover:underline">Quote</Link>}
                  {invoice.projectId?._id && <Link href={`/projects/${invoice.projectId._id}`} className="text-brand-600 hover:underline">Project</Link>}
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
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Rate</th>
                    <th>Tax</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoice.lineItems.map((item, index) => (
                    <tr key={index} className="table-row">
                      <td>
                        <p className="font-medium text-fg">{item.itemName || item.description}</p>
                        {item.itemName && <p className="text-xs text-fg-muted">{item.description}</p>}
                      </td>
                      <td>{item.quantity}</td>
                      <td>{item.unit || '-'}</td>
                      <td>{formatMoney(item.unitPrice, invoice.currency)}</td>
                      <td>{item.taxName || `${item.taxPercent || 0}%`}</td>
                      <td className="text-right font-semibold">{formatMoney(item.lineTotal, invoice.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="card p-5 lg:sticky lg:top-4">
          <div className="mb-4 flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-fg-muted" />
            <h2 className="text-sm font-semibold text-fg">Invoice Summary</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-fg-muted">Subtotal</span><span>{formatMoney(invoice.subtotal, invoice.currency)}</span></div>
            <div className="flex justify-between"><span className="text-fg-muted">Discount</span><span>{formatMoney(invoice.discountTotal, invoice.currency)}</span></div>
            <div className="flex justify-between"><span className="text-fg-muted">Tax</span><span>{formatMoney(invoice.taxTotal, invoice.currency)}</span></div>
            <div className="flex justify-between"><span className="text-fg-muted">Grand Total</span><span>{formatMoney(invoice.grandTotal, invoice.currency)}</span></div>
            <div className="flex justify-between"><span className="text-fg-muted">Paid</span><span>{formatMoney(invoice.amountPaid, invoice.currency)}</span></div>
            <div className="border-t border-border pt-3 flex justify-between text-base font-bold text-fg">
              <span>Balance Due</span>
              <span>{formatMoney(invoice.balanceDue, invoice.currency)}</span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

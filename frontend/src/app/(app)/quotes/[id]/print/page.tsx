'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import { api } from '@/lib/api';
import { formatMoney, QuoteRecord } from '@/lib/quotes';
import { formatDate } from '@/lib/utils';

function addressText(address: any) {
  return [address?.address, address?.city, address?.stateProvince, address?.postalCode, address?.country].filter(Boolean).join(', ');
}

export default function PrintQuotePage() {
  const params = useParams<{ id: string }>();
  const [quote, setQuote] = useState<QuoteRecord | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<QuoteRecord>(`/quotes/${params.id}`)
      .then(setQuote)
      .catch((err: any) => setError(err.message || 'Failed to load quote'));
  }, [params.id]);

  if (error) return <div className="card p-5 text-sm text-red-600">{error}</div>;
  if (!quote) return <p className="p-8 text-sm text-fg-muted">Loading quote...</p>;
  const organization = quote.organizationSnapshot || {};

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href={`/quotes/${quote._id}`} className="btn-back"><ArrowLeft className="h-4 w-4" /> Quote</Link>
        <button type="button" onClick={() => window.print()} className="btn-primary"><Printer className="h-4 w-4" /> Print</button>
      </div>

      <div className="bg-white p-8 text-slate-900 shadow-sm print:p-0 print:shadow-none">
        <header className="flex items-start justify-between border-b border-slate-300 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{organization.organizationName || 'MachineIQ'}</p>
            <h1 className="mt-1 text-2xl font-bold">Quotation</h1>
            <p className="mt-2 text-sm text-slate-600">{quote.subject || 'Commercial offer for custom machine and automation requirements.'}</p>
            {organization.billingAddress && <p className="mt-2 max-w-md text-xs text-slate-500">{organization.billingAddress}</p>}
            {organization.taxRegistrationNumber && <p className="mt-1 text-xs text-slate-500">Tax ID: {organization.taxRegistrationNumber}</p>}
          </div>
          <div className="text-right text-sm">
            <p className="font-mono font-semibold">{quote.quoteNo}</p>
            <p>Quote Date: {formatDate(quote.quoteDate)}</p>
            <p>Valid Until: {formatDate(quote.validUntil)}</p>
            {quote.salesPerson && <p>Sales Person: {quote.salesPerson}</p>}
          </div>
        </header>

        <section className="grid gap-8 border-b border-slate-200 py-6 md:grid-cols-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bill To</h2>
            <p className="mt-2 font-semibold">{quote.customerSnapshot?.name || quote.customerId?.name}</p>
            <p className="text-sm text-slate-600">{quote.customerSnapshot?.contactPerson}</p>
            <p className="text-sm text-slate-600">{quote.customerSnapshot?.email}</p>
            <p className="text-sm text-slate-600">{quote.customerSnapshot?.phone}</p>
            <p className="mt-2 text-sm text-slate-600">{addressText(quote.customerSnapshot?.billingAddress)}</p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ship To</h2>
            <p className="mt-2 text-sm text-slate-600">{addressText(quote.customerSnapshot?.shippingAddress) || addressText(quote.customerSnapshot?.billingAddress) || '-'}</p>
            {quote.customerSnapshot?.taxRegistrationNumber && <p className="mt-2 text-sm text-slate-600">Tax ID: {quote.customerSnapshot.taxRegistrationNumber}</p>}
            {quote.customerSnapshot?.paymentTerms && <p className="text-sm text-slate-600">Payment: {quote.customerSnapshot.paymentTerms}</p>}
          </div>
        </section>

        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2">Description</th>
              <th className="py-2">HSN/SAC</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Unit</th>
              <th className="py-2 text-right">Rate</th>
              <th className="py-2 text-right">Disc</th>
              <th className="py-2 text-right">Tax</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {quote.lineItems.map((item, index) => (
              <tr key={index} className="border-b border-slate-200">
                <td className="py-3">
                  <p className="font-medium">{item.itemName || item.description}</p>
                  {item.itemName && <p className="text-xs text-slate-500">{item.description}</p>}
                  {item.sku && <p className="text-xs text-slate-500">SKU: {item.sku}</p>}
                </td>
                <td className="py-3">{item.hsnSac || '-'}</td>
                <td className="py-3 text-right">{item.quantity}</td>
                <td className="py-3 text-right">{item.unit || '-'}</td>
                <td className="py-3 text-right">{formatMoney(item.unitPrice, quote.currency)}</td>
                <td className="py-3 text-right">{item.discountType === 'amount' ? formatMoney(item.discountValue, quote.currency) : `${item.discountValue ?? item.discountPercent ?? 0}%`}</td>
                <td className="py-3 text-right">{item.taxName || `${item.taxPercent || 0}%`}</td>
                <td className="py-3 text-right font-semibold">{formatMoney(item.lineTotal, quote.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="ml-auto mt-6 w-full max-w-sm space-y-2 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(quote.subtotal, quote.currency)}</span></div>
          <div className="flex justify-between"><span>Discount</span><span>{formatMoney(quote.discountTotal, quote.currency)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>{formatMoney(quote.taxTotal, quote.currency)}</span></div>
          <div className="flex justify-between"><span>Shipping / Handling</span><span>{formatMoney(quote.shippingCharge, quote.currency)}</span></div>
          <div className="flex justify-between"><span>Adjustment</span><span>{formatMoney(quote.adjustment, quote.currency)}</span></div>
          <div className="flex justify-between border-t border-slate-300 pt-3 text-base font-bold"><span>Grand Total</span><span>{formatMoney(quote.grandTotal, quote.currency)}</span></div>
        </section>

        {(quote.notes || quote.terms) && (
          <section className="mt-8 grid gap-6 md:grid-cols-2">
            {quote.notes && <div><h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</h2><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{quote.notes}</p></div>}
            {quote.terms && <div><h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Terms</h2><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{quote.terms}</p></div>}
          </section>
        )}
        {organization.bankDetails && (
          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bank Details</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{organization.bankDetails}</p>
          </section>
        )}
      </div>
    </div>
  );
}

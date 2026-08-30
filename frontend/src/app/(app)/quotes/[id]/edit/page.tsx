'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { CustomerRecord } from '@/lib/customers';
import {
  buildQuotePayload,
  CommercialPreferences,
  QuoteFormValues,
  QuoteRecord,
  quoteToForm,
} from '@/lib/quotes';
import { QuoteForm } from '@/components/quotes/quote-form';

export default function EditQuotePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<QuoteFormValues | null>(null);
  const [quote, setQuote] = useState<QuoteRecord | null>(null);
  const [preferences, setPreferences] = useState<CommercialPreferences>({});
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<QuoteRecord>(`/quotes/${params.id}`),
      api.get<CustomerRecord[]>('/customers'),
      api.get<{ value: CommercialPreferences }>('/settings/commercial_preferences').catch(() => ({ value: {} })),
    ])
      .then(([quoteData, customerData, prefData]) => {
        setQuote(quoteData);
        setForm(quoteToForm(quoteData));
        setCustomers(customerData);
        setPreferences(prefData.value || {});
      })
      .catch((err: any) => setError(err.message || 'Failed to load quote'))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (!form?.customerId) {
      setOpportunities([]);
      return;
    }
    api.get<{ data: any[] }>(`/opportunities?customerId=${form.customerId}&limit=100`)
      .then((res) => setOpportunities(res.data))
      .catch(() => setOpportunities([]));
  }, [form?.customerId]);

  const submit = async () => {
    if (!form) return;
    setSaving(true);
    setError('');
    try {
      const payload = buildQuotePayload(form);
      if (!payload.customerId) throw new Error('Select a customer');
      if (payload.lineItems.length === 0) throw new Error('Add at least one line item');
      const updated = await api.patch<QuoteRecord>(`/quotes/${params.id}`, payload);
      router.push(`/quotes/${updated._id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save quote');
      setSaving(false);
    }
  };

  if (loading) return <p className="p-8 text-sm text-fg-muted">Loading quote...</p>;
  if (!form || !quote) return <div className="card p-5 text-sm text-fg-muted">{error || 'Quote not found'}</div>;

  const locked = quote.status !== 'draft';

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-5">
        <Link href={`/quotes/${params.id}`} className="btn-back mb-3">
          <ArrowLeft className="h-4 w-4" />
          Quote
        </Link>
        <h1 className="text-2xl font-bold text-fg">Edit {quote.quoteNo}</h1>
      </div>

      {locked && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Only draft quotes can be edited.</div>}
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <QuoteForm
        form={form}
        customers={customers}
        opportunities={opportunities}
        preferences={preferences}
        saving={saving}
        locked={locked}
        submitLabel="Save Quote"
        savingLabel="Saving..."
        onChange={setForm}
        onSubmit={submit}
      />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { CustomerRecord } from '@/lib/customers';
import {
  buildQuotePayload,
  CommercialPreferences,
  createEmptyQuoteForm,
  QuoteFormValues,
} from '@/lib/quotes';
import { QuoteForm } from '@/components/quotes/quote-form';

export default function NewQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [preferences, setPreferences] = useState<CommercialPreferences>({});
  const [form, setForm] = useState<QuoteFormValues>(() => ({
    ...createEmptyQuoteForm(),
    customerId: searchParams.get('customerId') || '',
    opportunityId: searchParams.get('opportunityId') || '',
  }));
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<CustomerRecord[]>('/customers'),
      api.get<{ value: CommercialPreferences }>('/settings/commercial_preferences').catch(() => ({ value: {} })),
    ])
      .then(([customerData, prefData]) => {
        const loadedPreferences = prefData.value || {};
        setCustomers(customerData);
        setPreferences(loadedPreferences);
        setForm((current) => ({
          ...createEmptyQuoteForm(loadedPreferences),
          customerId: current.customerId,
          opportunityId: current.opportunityId,
        }));
      })
      .catch((err: any) => setError(err.message || 'Failed to load quote form'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!form.customerId) {
      setOpportunities([]);
      return;
    }
    api.get<{ data: any[] }>(`/opportunities?customerId=${form.customerId}&limit=100`)
      .then((res) => setOpportunities(res.data))
      .catch(() => setOpportunities([]));
  }, [form.customerId]);

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = buildQuotePayload(form);
      if (!payload.customerId) throw new Error('Select a customer');
      if (payload.lineItems.length === 0) throw new Error('Add at least one line item');
      const created = await api.post<any>('/quotes', payload);
      router.push(`/quotes/${created._id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create quote');
      setSaving(false);
    }
  };

  if (loading) return <p className="p-8 text-sm text-fg-muted">Loading...</p>;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-5">
        <Link href="/quotes" className="btn-back mb-3">
          <ArrowLeft className="h-4 w-4" />
          Quotes
        </Link>
        <h1 className="text-2xl font-bold text-fg">New quote</h1>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <QuoteForm
        form={form}
        customers={customers}
        opportunities={opportunities}
        preferences={preferences}
        saving={saving}
        submitLabel="Create Quote"
        savingLabel="Creating..."
        onChange={setForm}
        onSubmit={submit}
      />
    </div>
  );
}

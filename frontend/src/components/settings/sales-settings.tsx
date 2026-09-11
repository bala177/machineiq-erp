'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/providers/auth-provider';

type SalesSettingsValue = {
  separate_approver: boolean;
  currencies: Record<string, number>;
  taxes: number[];
  prefixes: Record<'enquiry' | 'quote' | 'order' | 'project', string>;
};

type SalesConfig = { settings: SalesSettingsValue; permissions: string[] };
const kinds = ['enquiry', 'quote', 'order', 'project'] as const;

export function SalesSettings() {
  const { user } = useAuth();
  const [value, setValue] = useState<SalesSettingsValue | null>(null);
  const [original, setOriginal] = useState<SalesSettingsValue | null>(null);
  const [currencyText, setCurrencyText] = useState('');
  const [taxText, setTaxText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const canManage = user?.role === 'admin' && Boolean(value);

  function load() {
    setLoading(true);
    setError('');
    api.get<SalesConfig>('/sales/config').then(config => {
      const settings = config.settings;
      setValue(settings); setOriginal(settings);
      setCurrencyText(Object.entries(settings.currencies).map(([code, precision]) => `${code}:${precision}`).join('\n'));
      setTaxText(settings.taxes.join(', '));
    }).catch(requestError => setError((requestError as Error).message)).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function discard() {
    if (!original) return;
    setValue(original);
    setCurrencyText(Object.entries(original.currencies).map(([code, precision]) => `${code}:${precision}`).join('\n'));
    setTaxText(original.taxes.join(', '));
    setError('');
    setMessage('');
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!value || !canManage) return;
    setSaving(true); setError(''); setMessage('');
    try {
      const currencies = Object.fromEntries(currencyText.split(/\r?\n/).filter(Boolean).map(line => {
        const [code, precision] = line.split(':');
        return [code.trim().toUpperCase(), Number(precision)];
      }));
      const taxes = taxText.split(',').map(item => Number(item.trim())).filter(item => Number.isFinite(item));
      const saved = await api.patch<SalesSettingsValue>('/sales/settings', { ...value, currencies, taxes });
      setValue(saved); setOriginal(saved); setMessage('Sales configuration saved.');
      setCurrencyText(Object.entries(saved.currencies).map(([code, precision]) => `${code}:${precision}`).join('\n'));
      setTaxText(saved.taxes.join(', '));
    } catch (requestError) { setError((requestError as Error).message); }
    finally { setSaving(false); }
  }

  if (loading) return <LoadingSpinner />;
  if (!value) return <div className="card p-5"><p role="alert" className="text-sm text-red-600">{error || 'Sales configuration could not be loaded.'}</p><button type="button" className="btn-secondary mt-4" onClick={load}>Retry</button></div>;
  const dirty = JSON.stringify(value) !== JSON.stringify(original) || currencyText !== Object.entries(original?.currencies || {}).map(([code, precision]) => `${code}:${precision}`).join('\n') || taxText !== (original?.taxes || []).join(', ');
  return <form className="space-y-5" onSubmit={save}>
    <div><h2 className="text-lg font-semibold text-fg">Sales configuration</h2><p className="mt-1 text-sm text-fg-muted">Controls R2 approvals, monetary precision, tax choices, and document numbering.</p></div>
    <fieldset disabled={!canManage || saving} className="card space-y-4 p-5">
      <legend className="px-1 font-semibold">Approval policy</legend>
      <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={value.separate_approver} onChange={event => setValue({ ...value, separate_approver: event.target.checked })} /><span><strong>Require a separate approver</strong><span className="mt-1 block text-fg-muted">Prevents the author or owner from approving the same quotation or order.</span></span></label>
    </fieldset>
    <div className="grid gap-5 lg:grid-cols-2">
      <fieldset disabled={!canManage || saving} className="card p-5"><legend className="px-1 font-semibold">Currencies</legend><p className="mb-3 text-sm text-fg-muted">One ISO code and decimal precision per line, for example INR:2.</p><textarea required className="input-field min-h-36 font-mono" value={currencyText} onChange={event => setCurrencyText(event.target.value)} /></fieldset>
      <fieldset disabled={!canManage || saving} className="card p-5"><legend className="px-1 font-semibold">Tax rates</legend><p className="mb-3 text-sm text-fg-muted">Comma-separated percentages available on sales lines.</p><textarea required className="input-field min-h-36" value={taxText} onChange={event => setTaxText(event.target.value)} /></fieldset>
    </div>
    <fieldset disabled={!canManage || saving} className="card p-5"><legend className="px-1 font-semibold">Numbering prefixes</legend><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{kinds.map(kind => <label key={kind} className="text-sm font-medium capitalize text-fg-secondary">{kind}<input required maxLength={12} pattern="[A-Z0-9]+" className="input-field mt-1.5 font-mono" value={value.prefixes[kind]} onChange={event => setValue({ ...value, prefixes: { ...value.prefixes, [kind]: event.target.value.toUpperCase() } })} /></label>)}</div></fieldset>
    {!canManage && <p className="text-sm text-fg-muted">Only an administrator can change this organization-wide configuration.</p>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}{message && <p role="status" className="text-sm text-emerald-600">{message}</p>}
    <div className="flex justify-end gap-3 border-t border-border pt-4"><button type="button" className="btn-secondary" disabled={!dirty || saving} onClick={discard}>Discard changes</button><button className="btn-primary" disabled={!canManage || saving || !dirty}>{saving ? 'Saving…' : 'Save sales configuration'}</button></div>
  </form>;
}

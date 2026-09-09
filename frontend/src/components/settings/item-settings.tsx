'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ItemPreferences, parseItemPreferences } from '@/lib/item-preferences';
import { useAuth } from '@/providers/auth-provider';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function ItemSettings() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin';
  const [prefs, setPrefs] = useState<ItemPreferences | null>(null);
  const [original, setOriginal] = useState<ItemPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  async function load() {
    setLoading(true); setError('');
    try {
      const value = parseItemPreferences(await api.get<unknown>('/items/preferences'));
      setPrefs(value); setOriginal(value);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  const dirty = JSON.stringify(prefs) !== JSON.stringify(original);
  useEffect(() => {
    const prevent = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener('beforeunload', prevent);
    return () => window.removeEventListener('beforeunload', prevent);
  }, [dirty]);
  function change<K extends keyof ItemPreferences>(key: K, value: ItemPreferences[K]) {
    setPrefs(current => current && ({ ...current, [key]: value })); setSaved(false); setError('');
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!canManage || saving || !prefs) return;
    setSaving(true); setError(''); setSaved(false);
    try {
      const result = await api.patch<{ value: ItemPreferences }>('/settings/item_preferences', { value: prefs });
      const value = parseItemPreferences(result.value);
      setPrefs(value); setOriginal(value); setSaved(true);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }
  if (loading) return <LoadingSpinner />;
  if (!prefs) return <div role="alert" className="card p-5">{error}<button type="button" className="btn-secondary ml-3" onClick={load}>Retry</button></div>;
  return <form onSubmit={save} className="space-y-5">
    <div><h2 className="text-lg font-semibold text-fg">Item preferences</h2><p className="mt-1 text-sm text-fg-muted">Configure how items are created and validated across your organization.</p></div>
    {!canManage && <p className="text-sm text-fg-muted">Only an administrator can change organization-wide item preferences.</p>}
    <fieldset disabled={saving || !canManage} className="card space-y-4 p-5">
      <legend className="px-1 font-semibold">New-item defaults</legend>
      <p className="text-sm text-fg-muted">Applied when creating an item. Users can override these defaults on the item. Existing records keep their values.</p>
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={prefs.salesEnabled} onChange={e => change('salesEnabled', e.target.checked)} />Enable sales information by default</label>
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={prefs.purchaseEnabled} onChange={e => change('purchaseEnabled', e.target.checked)} />Enable purchase information by default</label>
      {!prefs.salesEnabled && !prefs.purchaseEnabled && <p role="alert" className="text-sm text-red-600">Enable sales information, purchase information, or both.</p>}
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={prefs.isStockItem} onChange={e => change('isStockItem', e.target.checked)} />Mark goods as stock items by default</label>
      <p className="text-xs text-fg-muted">Services are always non-stock. This sets item classification; it does not enable an inventory accounting system.</p>
      <label className="block max-w-sm text-sm">Default item tax rate (%)<input className="input-field mt-1" type="number" min={0} max={100} step="any" required value={prefs.taxPercent} onChange={e => change('taxPercent', Number(e.target.value))} /></label>
      <p className="text-xs text-fg-muted">Sales documents still validate their tax rates against Sales configuration.</p>
    </fieldset>
    <fieldset disabled={saving || !canManage} className="card space-y-4 p-5"><legend className="px-1 font-semibold">Required fields</legend>
      <label data-field="requireHsnSac" className="flex items-center gap-3 text-sm"><input type="checkbox" checked={prefs.requireHsnSac} onChange={e => change('requireHsnSac', e.target.checked)} />Require HSN / SAC code</label>
      <p className="text-sm text-fg-muted">Blocks creating or updating an item without its classification code, including API requests. Existing items are checked when next updated.</p>
    </fieldset>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4"><span role="status" className="mr-auto text-sm text-fg-muted">{saved ? 'Item preferences saved' : dirty ? 'Unsaved changes' : 'Preferences are up to date'}</span><button type="button" className="btn-secondary" disabled={!dirty || saving} onClick={() => { setPrefs(original); setError(''); setSaved(false); }}>Discard changes</button><button className="btn-primary" disabled={!canManage || !dirty || saving || (!prefs.salesEnabled && !prefs.purchaseEnabled)}>{saving ? 'Saving…' : 'Save item preferences'}</button></div>
  </form>;
}

'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

type Row = Record<string, any>;
type Data = { warehouses: Row[]; employees: Row[]; currencies: Row[]; taxes: Row[]; statuses: Row[]; locations: Row[]; users: Row[]; departments: Row[] };
const initial: Data = { warehouses: [], employees: [], currencies: [], taxes: [], statuses: [], locations: [], users: [], departments: [] };
const blankWarehouse = { code: '', name: '', locationId: '', managerId: '', description: '' };
const blankEmployee = { employeeCode: '', firstName: '', lastName: '', email: '', phone: '', designation: '', departmentId: '', managerId: '', userId: '', hireDate: '' };
const blankCurrency = { code: '', name: '', symbol: '', precision: 2 };
const blankTax = { code: '', name: '', rate: 0, effectiveFrom: '', effectiveTo: '' };
const blankStatus = { module: 'common', code: '', label: '', sortOrder: 10, isTerminal: false };

function clean(value: Row) { return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, item === '' ? undefined : item])); }
function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="card space-y-4 p-5"><div><h3 className="font-semibold text-fg">{title}</h3><p className="mt-1 text-sm text-fg-muted">{description}</p></div>{children}</section>; }
function Remove({ onClick, label }: { onClick: () => void; label: string }) { return <button type="button" className="text-xs font-medium text-red-600 hover:underline" onClick={onClick}>Deactivate {label}</button>; }

export function FoundationSettings() {
  const [data, setData] = useState<Data>(initial);
  const [warehouse, setWarehouse] = useState(blankWarehouse);
  const [employee, setEmployee] = useState(blankEmployee);
  const [currency, setCurrency] = useState(blankCurrency);
  const [tax, setTax] = useState(blankTax);
  const [status, setStatus] = useState(blankStatus);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [warehouses, employees, currencies, taxes, statuses, locations, users, departments] = await Promise.all([
        api.get<Row[]>('/foundation/warehouses'), api.get<Row[]>('/foundation/employees'), api.get<Row[]>('/foundation/currencies'),
        api.get<Row[]>('/foundation/tax-rates'), api.get<Row[]>('/foundation/statuses'), api.get<Row[]>('/organization/locations'),
        api.get<Row[]>('/users'), api.get<Row[]>('/departments'),
      ]);
      setData({ warehouses, employees, currencies, taxes, statuses, locations, users, departments }); setError('');
    } catch (requestError) { setError((requestError as Error).message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function create(event: FormEvent, endpoint: string, value: Row, reset: () => void, label: string) {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    try { await api.post(`/foundation/${endpoint}`, clean(value)); reset(); setMessage(`${label} saved.`); await load(); }
    catch (requestError) { setError((requestError as Error).message); }
    finally { setSaving(false); }
  }
  async function remove(kind: string, id: string, label: string) {
    if (!window.confirm(`Deactivate ${label}? Existing history will be retained.`)) return;
    setSaving(true); setError('');
    try { await api.delete(`/foundation/${kind}/${id}`); await load(); }
    catch (requestError) { setError((requestError as Error).message); }
    finally { setSaving(false); }
  }

  if (loading) return <LoadingSpinner />;
  return <div className="space-y-5">
    <div><h2 className="text-lg font-semibold text-fg">Foundation masters</h2><p className="mt-1 text-sm text-fg-muted">R1-controlled employees, warehouses, currencies, tax rates, and reusable statuses. Changes are audited and records are deactivated rather than erased.</p></div>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p role="status" className="text-sm text-emerald-600">{message}</p>}
    <div className="grid gap-5 xl:grid-cols-2">
      <Card title="Warehouse master" description="A warehouse is an operational store anchored to a configured physical location.">
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={event => create(event, 'warehouses', warehouse, () => setWarehouse(blankWarehouse), 'Warehouse')}>
          <input required className="input-field" placeholder="Code" value={warehouse.code} onChange={e => setWarehouse({ ...warehouse, code: e.target.value.toUpperCase() })} />
          <input required className="input-field" placeholder="Warehouse name" value={warehouse.name} onChange={e => setWarehouse({ ...warehouse, name: e.target.value })} />
          <select required className="input-field" value={warehouse.locationId} onChange={e => setWarehouse({ ...warehouse, locationId: e.target.value })}><option value="">Physical location</option>{data.locations.filter(x => x.isActive).map(x => <option key={x._id} value={x._id}>{x.code} — {x.name}</option>)}</select>
          <select className="input-field" value={warehouse.managerId} onChange={e => setWarehouse({ ...warehouse, managerId: e.target.value })}><option value="">No responsible manager</option>{data.users.filter(x => x.isActive).map(x => <option key={x._id} value={x._id}>{x.firstName} {x.lastName}</option>)}</select>
          <input className="input-field sm:col-span-2" placeholder="Description" value={warehouse.description} onChange={e => setWarehouse({ ...warehouse, description: e.target.value })} />
          <button disabled={saving || !data.locations.length} className="btn-primary sm:col-span-2">Add warehouse</button>
        </form>
        <div className="divide-y divide-border">{data.warehouses.map(row => <div key={row._id} className="flex items-center justify-between gap-3 py-2 text-sm"><span><strong>{row.code}</strong> · {row.name}<span className="block text-xs text-fg-muted">{row.location?.name}{row.manager ? ` · ${row.manager.firstName} ${row.manager.lastName}` : ''}</span></span><Remove label={row.name} onClick={() => void remove('warehouse', row._id, row.name)} /></div>)}</div>
      </Card>
      <Card title="Employee identity" description="Employee identity is independent from login access and can optionally link to a user account.">
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={event => create(event, 'employees', employee, () => setEmployee(blankEmployee), 'Employee')}>
          <input required className="input-field" placeholder="Employee code" value={employee.employeeCode} onChange={e => setEmployee({ ...employee, employeeCode: e.target.value.toUpperCase() })} />
          <input className="input-field" placeholder="Designation" value={employee.designation} onChange={e => setEmployee({ ...employee, designation: e.target.value })} />
          <input required className="input-field" placeholder="First name" value={employee.firstName} onChange={e => setEmployee({ ...employee, firstName: e.target.value })} />
          <input required className="input-field" placeholder="Last name" value={employee.lastName} onChange={e => setEmployee({ ...employee, lastName: e.target.value })} />
          <input type="email" className="input-field" placeholder="Email" value={employee.email} onChange={e => setEmployee({ ...employee, email: e.target.value })} />
          <input className="input-field" placeholder="Phone" value={employee.phone} onChange={e => setEmployee({ ...employee, phone: e.target.value })} />
          <select className="input-field" value={employee.departmentId} onChange={e => setEmployee({ ...employee, departmentId: e.target.value })}><option value="">No department</option>{data.departments.filter(x => x.isActive).map(x => <option key={x._id} value={x._id}>{x.name}</option>)}</select>
          <select className="input-field" value={employee.managerId} onChange={e => setEmployee({ ...employee, managerId: e.target.value })}><option value="">No manager</option>{data.employees.filter(x => x.isActive).map(x => <option key={x._id} value={x._id}>{x.employeeCode} — {x.firstName} {x.lastName}</option>)}</select>
          <select className="input-field" value={employee.userId} onChange={e => setEmployee({ ...employee, userId: e.target.value })}><option value="">No login account</option>{data.users.filter(x => x.isActive && !data.employees.some(employeeRow => employeeRow.userId === x._id)).map(x => <option key={x._id} value={x._id}>{x.email}</option>)}</select>
          <input type="date" className="input-field" value={employee.hireDate} onChange={e => setEmployee({ ...employee, hireDate: e.target.value })} />
          <button disabled={saving} className="btn-primary sm:col-span-2">Add employee</button>
        </form>
        <div className="divide-y divide-border">{data.employees.map(row => <div key={row._id} className="flex items-center justify-between gap-3 py-2 text-sm"><span><strong>{row.employeeCode}</strong> · {row.firstName} {row.lastName}<span className="block text-xs text-fg-muted">{row.designation || 'Designation pending'}{row.department ? ` · ${row.department.name}` : ''}</span></span><Remove label={`${row.firstName} ${row.lastName}`} onClick={() => void remove('employee', row._id, `${row.firstName} ${row.lastName}`)} /></div>)}</div>
      </Card>
      <Card title="Currencies" description="Reusable ISO currencies and their monetary precision.">
        <form className="grid gap-3 sm:grid-cols-5" onSubmit={event => create(event, 'currencies', currency, () => setCurrency(blankCurrency), 'Currency')}><input required maxLength={3} className="input-field" placeholder="ISO" value={currency.code} onChange={e => setCurrency({ ...currency, code: e.target.value.toUpperCase() })} /><input required className="input-field sm:col-span-2" placeholder="Name" value={currency.name} onChange={e => setCurrency({ ...currency, name: e.target.value })} /><input maxLength={12} className="input-field" placeholder="Symbol" value={currency.symbol} onChange={e => setCurrency({ ...currency, symbol: e.target.value })} /><input type="number" min={0} max={4} className="input-field" value={currency.precision} onChange={e => setCurrency({ ...currency, precision: Number(e.target.value) })} /><button disabled={saving} className="btn-primary sm:col-span-5">Add currency</button></form>
        <div className="flex flex-wrap gap-2">{data.currencies.map(row => <span key={row._id} className="badge-gray">{row.code} · {row.precision} dp <Remove label={row.code} onClick={() => void remove('currency', row._id, row.code)} /></span>)}</div>
      </Card>
      <Card title="Tax / VAT rates" description="Effective-dated organization tax choices for downstream modules.">
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={event => create(event, 'tax-rates', tax, () => setTax(blankTax), 'Tax rate')}><input required className="input-field" placeholder="Code" value={tax.code} onChange={e => setTax({ ...tax, code: e.target.value.toUpperCase() })} /><input required className="input-field" placeholder="Name" value={tax.name} onChange={e => setTax({ ...tax, name: e.target.value })} /><input required type="number" min={0} max={100} step="any" className="input-field" value={tax.rate} onChange={e => setTax({ ...tax, rate: Number(e.target.value) })} /><span /><label className="text-xs text-fg-muted">Effective from<input type="date" className="input-field mt-1" value={tax.effectiveFrom} onChange={e => setTax({ ...tax, effectiveFrom: e.target.value })} /></label><label className="text-xs text-fg-muted">Effective to<input type="date" className="input-field mt-1" value={tax.effectiveTo} onChange={e => setTax({ ...tax, effectiveTo: e.target.value })} /></label><button disabled={saving} className="btn-primary sm:col-span-2">Add tax rate</button></form>
        <div className="flex flex-wrap gap-2">{data.taxes.map(row => <span key={row._id} className="badge-gray">{row.code} · {Number(row.rate)}% <Remove label={row.code} onClick={() => void remove('tax-rate', row._id, row.code)} /></span>)}</div>
      </Card>
      <Card title="Reference statuses" description="Reusable labels for modules that adopt configurable status sets.">
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={event => create(event, 'statuses', status, () => setStatus(blankStatus), 'Reference status')}><input required className="input-field" placeholder="Module" value={status.module} onChange={e => setStatus({ ...status, module: e.target.value.toLowerCase() })} /><input required className="input-field" placeholder="Code" value={status.code} onChange={e => setStatus({ ...status, code: e.target.value.toLowerCase() })} /><input required className="input-field" placeholder="Label" value={status.label} onChange={e => setStatus({ ...status, label: e.target.value })} /><input type="number" min={0} className="input-field" value={status.sortOrder} onChange={e => setStatus({ ...status, sortOrder: Number(e.target.value) })} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={status.isTerminal} onChange={e => setStatus({ ...status, isTerminal: e.target.checked })} />Terminal status</label><button disabled={saving} className="btn-primary">Add status</button></form>
        <div className="divide-y divide-border">{data.statuses.map(row => <div key={row._id} className="flex items-center justify-between py-2 text-sm"><span>{row.module} · <strong>{row.label}</strong>{row.isTerminal ? ' · terminal' : ''}</span><Remove label={row.label} onClick={() => void remove('status', row._id, row.label)} /></div>)}</div>
      </Card>
    </div>
  </div>;
}

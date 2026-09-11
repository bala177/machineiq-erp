'use client';

import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { api } from '@/lib/api';
import { OrganizationWorkbookPreview, previewOrganizationWorkbook } from '@/lib/organization-workbook';

type RecordRow = Record<string, any> & { _id: string };
type Props = {
  company: RecordRow | null; directors: RecordRow[]; branches: RecordRow[]; locations: RecordRow[]; departments: RecordRow[];
  onClose: () => void; onApplied: () => Promise<void>;
};

const emptyToUndefined = (row: Record<string, string>) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value || undefined]));
const companyPayload = (row: Record<string, string>) => emptyToUndefined({
  code: row.code, name: row.name, industry: row.industry, incorporatedOn: row.incorporated_on, email: row.email, phone: row.phone, website: row.website,
  cin: row.cin, gstin: row.gstin, pan: row.pan, tan: row.tan, msmeNumber: row.msme_number, address: row.address, city: row.city,
  stateProvince: row.state_province, postalCode: row.postal_code, country: row.country, baseCurrency: row.base_currency,
  timezone: row.timezone, fiscalYearStartMonth: row.fiscal_year_start_month, dateFormat: row.date_format, languageCode: row.language_code,
});

export function OrganizationImportModal(props: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<OrganizationWorkbookPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(0);

  async function inspect(selected: File) {
    setFile(selected); setPreview(null); setError(''); setApplied(0); setBusy(true);
    try { setPreview(await previewOrganizationWorkbook(selected, { hasCompany: Boolean(props.company), branchCodes: props.branches.map((row) => row.code) })); }
    catch (reason: any) { setError(reason.message || 'The workbook could not be read.'); }
    finally { setBusy(false); }
  }

  async function apply() {
    if (!preview || preview.issues.length) return;
    setBusy(true); setError(''); setApplied(0);
    let completed = 0;
    try {
      let company = props.company;
      if (preview.company) { company = await api.patch<RecordRow>('/organization/company', companyPayload(preview.company)); setApplied(++completed); }
      if (!company) throw new Error('Save or import the company profile before importing related records.');

      for (const row of preview.directors) {
        const existing = props.directors.find((item) => row.din ? item.din === row.din : item.name?.toLowerCase() === row.name.toLowerCase());
        const payload = { name: row.name, designation: row.designation || undefined, din: row.din || undefined, email: row.email || undefined, phone: row.phone || undefined, shareholdingPercent: row.shareholding_percent ? Number(row.shareholding_percent) : undefined, appointedOn: row.appointed_on || undefined };
        if (existing) await api.patch(`/organization/directors/${existing._id}`, payload); else await api.post('/organization/directors', payload);
        setApplied(++completed);
      }

      const resolvedBranches = new Map(props.branches.map((item) => [String(item.code).toLowerCase(), item]));
      for (const row of preview.branches) {
        const existing = resolvedBranches.get(row.code.toLowerCase());
        const payload = { name: row.name, taxRegistrationNumber: row.tax_registration_number || undefined, email: row.email || undefined, phone: row.phone || undefined, address: row.address || undefined, city: row.city || undefined, stateProvince: row.state_province || undefined, postalCode: row.postal_code || undefined, country: row.country || undefined };
        const saved = existing ? await api.patch<RecordRow>(`/organization/branches/${existing._id}`, payload) : await api.post<RecordRow>('/organization/branches', { ...payload, code: row.code, companyId: company._id });
        resolvedBranches.set(row.code.toLowerCase(), { ...existing, ...saved, code: row.code }); setApplied(++completed);
      }

      for (const row of preview.locations) {
        const existing = props.locations.find((item) => String(item.code).toLowerCase() === row.code.toLowerCase());
        const branch = resolvedBranches.get(row.branch_code.toLowerCase());
        if (!branch) throw new Error(`Branch ${row.branch_code} is unavailable for location ${row.code}.`);
        const payload = { name: row.name, branchId: branch._id, type: row.type.toLowerCase(), address: row.address || undefined, city: row.city || undefined, stateProvince: row.state_province || undefined, postalCode: row.postal_code || undefined, country: row.country || undefined };
        if (existing) await api.patch(`/organization/locations/${existing._id}`, payload); else await api.post('/organization/locations', { ...payload, code: row.code });
        setApplied(++completed);
      }

      for (const row of preview.departments) {
        const existing = props.departments.find((item) => row.code ? String(item.code || '').toLowerCase() === row.code.toLowerCase() : item.name?.toLowerCase() === row.name.toLowerCase());
        const payload = { name: row.name, code: row.code || undefined, description: row.description || undefined };
        if (existing) await api.patch(`/departments/${existing._id}`, payload); else await api.post('/departments', payload);
        setApplied(++completed);
      }
      await props.onApplied();
    } catch (reason: any) { setError(`${reason.message || 'Import could not be completed.'} ${completed ? `${completed} record(s) were applied before the error.` : ''}`.trim()); }
    finally { setBusy(false); }
  }

  const total = preview ? (preview.company ? 1 : 0) + preview.directors.length + preview.branches.length + preview.locations.length + preview.departments.length : 0;
  const reviewRows = preview ? [
    ...(preview.company ? [{ section: 'Company', record: `${preview.company.code} — ${preview.company.name}`, action: props.company ? 'Update' : 'Create' }] : []),
    ...preview.directors.map((row) => ({ section: 'Director', record: row.name, action: props.directors.some((item) => row.din ? item.din === row.din : item.name?.toLowerCase() === row.name.toLowerCase()) ? 'Update' : 'Create' })),
    ...preview.branches.map((row) => ({ section: 'Branch', record: `${row.code} — ${row.name}`, action: props.branches.some((item) => String(item.code).toLowerCase() === row.code.toLowerCase()) ? 'Update' : 'Create' })),
    ...preview.locations.map((row) => ({ section: 'Location', record: `${row.code} — ${row.name}`, action: props.locations.some((item) => String(item.code).toLowerCase() === row.code.toLowerCase()) ? 'Update' : 'Create' })),
    ...preview.departments.map((row) => ({ section: 'Department', record: `${row.code ? `${row.code} — ` : ''}${row.name}`, action: props.departments.some((item) => row.code ? String(item.code || '').toLowerCase() === row.code.toLowerCase() : item.name?.toLowerCase() === row.name.toLowerCase()) ? 'Update' : 'Create' })),
  ] : [];
  return <Modal title="Import organization setup" onClose={props.onClose} size="lg">
    <div className="space-y-5">
      <input ref={input} type="file" accept=".xlsx" aria-label="Organization workbook" className="hidden" onChange={(event) => { const selected = event.target.files?.[0]; if (selected) void inspect(selected); }} />
      {!preview && <button type="button" className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border p-10 hover:border-brand-400 hover:bg-surface-secondary" onClick={() => input.current?.click()}><Upload className="h-10 w-10 text-fg-muted" /><span className="font-semibold text-fg">{file ? file.name : 'Choose the exported .xlsx workbook'}</span><span className="text-sm text-fg-muted">The file is validated and previewed before anything is saved.</span></button>}
      {busy && !preview && <p className="text-sm text-fg-muted">Reading workbook…</p>}
      {preview && <>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{[['Company', preview.company ? 1 : 0], ['Directors', preview.directors.length], ['Branches', preview.branches.length], ['Locations', preview.locations.length], ['Departments', preview.departments.length]].map(([label, count]) => <div key={label} className="rounded-lg bg-surface-secondary p-3 text-center"><p className="text-xl font-bold text-fg">{count}</p><p className="text-xs text-fg-muted">{label}</p></div>)}</div>
        {!!reviewRows.length && <div className="max-h-56 overflow-y-auto rounded-lg border border-border"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-surface-secondary text-xs text-fg-muted"><tr><th className="px-3 py-2">Section</th><th className="px-3 py-2">Record</th><th className="px-3 py-2">Action</th></tr></thead><tbody className="divide-y divide-border">{reviewRows.map((row, index) => <tr key={`${row.section}-${row.record}-${index}`}><td className="px-3 py-2 text-fg-muted">{row.section}</td><td className="px-3 py-2 font-medium text-fg">{row.record}</td><td className="px-3 py-2"><span className={row.action === 'Create' ? 'badge-green' : 'badge-blue'}>{row.action}</span></td></tr>)}</tbody></table></div>}
        {preview.issues.length ? <div className="max-h-56 overflow-y-auto rounded-lg border border-red-200 divide-y divide-red-100">{preview.issues.map((issue, index) => <div key={index} className="flex gap-2 px-3 py-2 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{issue.sheet}, row {issue.row}: {issue.message}</span></div>)}</div> : <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="h-5 w-5" />Validation passed. {total} record(s) are ready to apply.</div>}
      </>}
      {applied > 0 && !error && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Applied {applied} record(s) successfully.</div>}
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="flex justify-between gap-2 border-t border-border pt-4"><button className="btn-ghost" disabled={busy} onClick={() => { setPreview(null); setFile(null); setApplied(0); setError(''); }}>Choose another file</button><div className="flex gap-2"><button className="btn-secondary" onClick={props.onClose}>Close</button>{preview && applied === 0 && <button className="btn-primary" disabled={busy || preview.issues.length > 0 || total === 0} onClick={() => void apply()}><FileSpreadsheet className="h-4 w-4" />{busy ? `Applying ${applied}/${total}…` : `Apply ${total} records`}</button>}</div></div>
    </div>
  </Modal>;
}

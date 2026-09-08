'use client';

import { useEffect, useState } from 'react';
import { Building2, Factory, FileText, MapPin, Pencil, UsersRound, Warehouse } from 'lucide-react';
import { Director } from '@/components/organization/director-management';
import { InfoTip } from '@/components/ui/info-tip';
import { GlossaryTerm } from '@/lib/glossary';
import {
  CompanyDocument, CompanyDocumentKind, documentLabels, fetchDocumentContent, openCompanyDocument,
} from '@/lib/company-documents';

type OverviewCompany = {
  code: string; name: string; email?: string; phone?: string; website?: string; industry?: string;
  cin?: string; gstin?: string; pan?: string; tan?: string; msmeNumber?: string; incorporatedOn?: string;
  address?: string; city?: string; stateProvince?: string; postalCode?: string; country?: string;
  baseCurrency: string; timezone: string; fiscalYearStartMonth?: string;
};

type Props = {
  company: OverviewCompany | null;
  directors: Director[];
  documents: CompanyDocument[];
  branchCount: number;
  locationCount: number;
  departmentCount: number;
  onEdit: (section: 'company' | 'directors' | 'branches' | 'locations' | 'departments') => void;
  onError: (message: string) => void;
};

const MISSING = 'Not recorded';

function formatDate(value?: string) {
  if (!value) return MISSING;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Panel({ title, icon, action, onEdit, children }: {
  title: string; icon: React.ReactNode; action: string; onEdit: () => void; children: React.ReactNode;
}) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300">{icon}</div>
        <h3 className="font-semibold text-fg">{title}</h3>
        <button type="button" onClick={onEdit} className="btn-ghost ml-auto px-2.5 py-1.5 text-xs">
          <Pencil className="h-3.5 w-3.5" />{action}
        </button>
      </div>
      {children}
    </section>
  );
}

function Row({ label, value, term, children }: {
  label: string; value?: string; term?: GlossaryTerm; children?: React.ReactNode;
}) {
  const empty = !value || value === MISSING;
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-5 py-2.5">
      <span className="flex w-44 shrink-0 items-center gap-1.5 text-sm text-fg-muted">
        {label}
        {term && <InfoTip term={term} label={label} />}
      </span>
      <span className={`min-w-0 flex-1 text-sm ${empty ? 'italic text-fg-muted' : 'text-fg'}`}>{value || MISSING}</span>
      {children}
    </div>
  );
}

/** A one-line marker for whether the certificate behind a number is on file. */
function Evidence({ document, onOpen }: { document?: CompanyDocument; onOpen: (id: string) => void }) {
  if (!document) return <span className="text-xs text-fg-muted">No certificate</span>;
  return (
    <button type="button" onClick={() => onOpen(document._id)} className="max-w-[14rem] truncate text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
      {document.fileName}
    </button>
  );
}

function CompanyMark({ document }: { document?: CompanyDocument }) {
  const [preview, setPreview] = useState('');
  useEffect(() => {
    let active = true;
    if (!document) { setPreview(''); return; }
    fetchDocumentContent(document._id).then((stored) => { if (active) setPreview(stored.content); }).catch(() => undefined);
    return () => { active = false; };
  }, [document]);

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-secondary">
      {preview ? <img src={preview} alt="" className="h-full w-full object-contain p-1" /> : <Building2 className="h-5 w-5 text-fg-muted" />}
    </div>
  );
}

/**
 * A read-only roll-up of everything held about the organization, so the whole
 * record can be checked without stepping through five tabs. Every panel links
 * to the tab that owns the data rather than editing in place.
 */
export function OrganizationOverview({
  company, directors, documents, branchCount, locationCount, departmentCount, onEdit, onError,
}: Props) {
  const companyDocument = (kind: CompanyDocumentKind) => documents.find((d) => !d.directorId && d.kind === kind);
  const directorDocuments = (id: string) => documents.filter((d) => d.directorId === id);

  async function open(id: string) {
    try { await openCompanyDocument(id); }
    catch (error: any) { onError(error.message || 'That attachment could not be opened.'); }
  }

  if (!company) {
    return (
      <section className="card px-5 py-12 text-center">
        <Building2 className="mx-auto h-8 w-8 text-fg-muted" />
        <p className="mt-3 text-sm font-medium text-fg">No company profile yet</p>
        <p className="mt-1 text-sm text-fg-muted">Complete the company profile and the full record will be summarised here.</p>
        <button type="button" className="btn-primary mt-4" onClick={() => onEdit('company')}>Start company profile</button>
      </section>
    );
  }

  const statutory: Array<{ label: string; value?: string; term: GlossaryTerm; kind: CompanyDocumentKind }> = [
    { label: 'CIN', value: company.cin, term: 'cin', kind: 'cin_certificate' },
    { label: 'GST', value: company.gstin, term: 'gstin', kind: 'gst_certificate' },
    { label: 'PAN', value: company.pan, term: 'pan', kind: 'pan_certificate' },
    { label: 'TAN', value: company.tan, term: 'tan', kind: 'tan_certificate' },
    { label: 'MSME', value: company.msmeNumber, term: 'msme', kind: 'msme_certificate' },
  ];
  const recordedNumbers = statutory.filter((entry) => entry.value).length;
  const recordedCertificates = statutory.filter((entry) => companyDocument(entry.kind)).length;
  const address = [company.address, company.city, company.stateProvince, company.postalCode, company.country].filter(Boolean).join(', ');
  const shareholding = directors.reduce((total, director) => total + (director.shareholdingPercent || 0), 0);

  return (
    <div className="grid gap-5">

      <Panel title="Identity" icon={<Building2 className="h-4 w-4" />} action="Edit profile" onEdit={() => onEdit('company')}>
        <div className="flex items-start gap-4 px-5 py-4">
          <CompanyMark document={companyDocument('logo')} />
          <div className="min-w-0">
            <p className="font-semibold text-fg">{company.name}</p>
            <p className="mt-0.5 text-sm text-fg-muted">
              {company.code}{company.industry ? ` · ${company.industry}` : ''} · Established {formatDate(company.incorporatedOn)}
            </p>
            {!companyDocument('logo') && <p className="mt-1 text-xs italic text-fg-muted">No logo uploaded — printed quotations will show the company name only.</p>}
          </div>
        </div>
        <div className="divide-y divide-border border-t border-border">
          <Row label="Email" value={company.email} />
          <Row label="Phone" value={company.phone} />
          <Row label="Website" value={company.website} />
          <Row label="Registered address" value={address} />
        </div>
      </Panel>

      <Panel title="Statutory registrations" icon={<FileText className="h-4 w-4" />} action="Edit" onEdit={() => onEdit('company')}>
        <p className="border-b border-border bg-surface-secondary/50 px-5 py-2 text-xs text-fg-muted">
          {recordedNumbers} of {statutory.length} numbers recorded · {recordedCertificates} of {statutory.length} certificates on file
        </p>
        <div className="divide-y divide-border">
          {statutory.map((entry) => (
            <Row key={entry.label} label={entry.label} value={entry.value} term={entry.term}>
              <Evidence document={companyDocument(entry.kind)} onOpen={open} />
            </Row>
          ))}
          <Row label="Memorandum (MOA)" value={companyDocument('moa') ? 'On file' : undefined} term="moa">
            <Evidence document={companyDocument('moa')} onOpen={open} />
          </Row>
          <Row label="Articles (AOA)" value={companyDocument('aoa') ? 'On file' : undefined} term="aoa">
            <Evidence document={companyDocument('aoa')} onOpen={open} />
          </Row>
        </div>
      </Panel>

      <Panel title="Directors" icon={<UsersRound className="h-4 w-4" />} action="Manage" onEdit={() => onEdit('directors')}>
        <p className="border-b border-border bg-surface-secondary/50 px-5 py-2 text-xs text-fg-muted">
          {directors.length ? `${directors.length} on record · ${shareholding}% of shareholding accounted for` : 'None recorded'}
        </p>
        {directors.length > 0 && (
          <div className="divide-y divide-border">
            {directors.map((director) => {
              const filed = directorDocuments(director._id).length;
              return (
                <div key={director._id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-2.5">
                  <span className="w-44 shrink-0 text-sm font-medium text-fg">{director.name}</span>
                  <span className="min-w-0 flex-1 text-sm text-fg-muted">
                    {[director.designation, director.din && `DIN ${director.din}`].filter(Boolean).join(' · ') || '—'}
                  </span>
                  <span className="text-sm tabular-nums text-fg-secondary">
                    {director.shareholdingPercent === null || director.shareholdingPercent === undefined ? '—' : `${director.shareholdingPercent}%`}
                  </span>
                  <span className="w-28 text-right text-xs text-fg-muted">{filed} of 5 filed</span>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <div className="grid gap-5 sm:grid-cols-3">
        <Panel title="Branches" icon={<Factory className="h-4 w-4" />} action="Manage" onEdit={() => onEdit('branches')}>
          <p className="px-5 py-4 text-sm text-fg-muted"><span className="text-2xl font-semibold text-fg">{branchCount}</span> configured</p>
        </Panel>
        <Panel title="Locations" icon={<MapPin className="h-4 w-4" />} action="Manage" onEdit={() => onEdit('locations')}>
          <p className="px-5 py-4 text-sm text-fg-muted"><span className="text-2xl font-semibold text-fg">{locationCount}</span> configured</p>
        </Panel>
        <Panel title="Departments" icon={<Warehouse className="h-4 w-4" />} action="Manage" onEdit={() => onEdit('departments')}>
          <p className="px-5 py-4 text-sm text-fg-muted"><span className="text-2xl font-semibold text-fg">{departmentCount}</span> configured</p>
        </Panel>
      </div>

      <p className="text-xs text-fg-muted">
        Regional settings: {company.baseCurrency} · {company.timezone} · fiscal year starts {company.fiscalYearStartMonth || 'april'}.
      </p>
    </div>
  );
}

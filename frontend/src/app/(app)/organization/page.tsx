'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Building2, Check, Circle, Factory, LayoutList, MapPin, Pencil, Plus, Save, Trash2, Warehouse } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Modal } from '@/components/ui/modal';
import { api } from '@/lib/api';
import { DepartmentManagement } from '@/components/organization/department-management';
import { Director, DirectorManagement } from '@/components/organization/director-management';
import { OrganizationOverview } from '@/components/organization/organization-overview';
import { AttachmentSlot, StatutoryRow } from '@/components/organization/attachment-slot';
import { LogoUploader } from '@/components/organization/logo-uploader';
import { CompanyDocument, CompanyDocumentKind } from '@/lib/company-documents';
import { GlossaryTerm } from '@/lib/glossary';
import { InfoTip } from '@/components/ui/info-tip';

type Company = {
  _id: string; code: string; name: string; email?: string; phone?: string; website?: string;
  cin?: string; gstin?: string; pan?: string; tan?: string; msmeNumber?: string; incorporatedOn?: string;
  baseCurrency: string; timezone: string;
  industry?: string; fiscalYearStartMonth?: string; dateFormat?: string; languageCode?: string;
  address?: string; city?: string; stateProvince?: string; postalCode?: string; country?: string;
};
type Branch = { _id: string; code: string; name: string; companyId: Company; email?: string; phone?: string; address?: string; city?: string; stateProvince?: string; postalCode?: string; country?: string; taxRegistrationNumber?: string; isActive: boolean };
type Location = { _id: string; code: string; name: string; branchId: Branch; type: 'office' | 'warehouse' | 'factory' | 'service'; address?: string; city?: string; stateProvince?: string; postalCode?: string; country?: string; isActive: boolean };
type OrganizationSection = 'overview' | 'company' | 'directors' | 'branches' | 'locations' | 'departments';
const organizationSections: OrganizationSection[] = ['overview', 'company', 'directors', 'branches', 'locations', 'departments'];

const emptyCompany = { code: 'MIQ', name: '', email: '', phone: '', website: '', industry: '', cin: '', gstin: '', pan: '', tan: '', msmeNumber: '', incorporatedOn: '', baseCurrency: 'INR', timezone: 'Asia/Kolkata', fiscalYearStartMonth: 'april', dateFormat: 'dd/MM/yyyy', languageCode: 'en', address: '', city: '', stateProvince: '', postalCode: '', country: 'India' };
const emptyBranch = { code: '', name: '', taxRegistrationNumber: '', email: '', phone: '', address: '', city: '', stateProvince: '', postalCode: '', country: 'India' };
const emptyLocation = { code: '', name: '', branchId: '', type: 'office', address: '', city: '', stateProvince: '', postalCode: '', country: 'India' };

function companyToForm(company: Company | null) {
  if (!company) return emptyCompany;
  return {
    code: company.code, name: company.name, email: company.email || '', phone: company.phone || '', website: company.website || '', industry: company.industry || '',
    cin: company.cin || '', gstin: company.gstin || '', pan: company.pan || '', tan: company.tan || '', msmeNumber: company.msmeNumber || '',
    incorporatedOn: company.incorporatedOn ? company.incorporatedOn.slice(0, 10) : '',
    baseCurrency: company.baseCurrency, timezone: company.timezone, fiscalYearStartMonth: company.fiscalYearStartMonth || 'april', dateFormat: company.dateFormat || 'dd/MM/yyyy', languageCode: company.languageCode || 'en', address: company.address || '', city: company.city || '',
    stateProvince: company.stateProvince || '', postalCode: company.postalCode || '', country: company.country || '',
  };
}

function Field({ label, term, children }: { label: string; term?: GlossaryTerm; children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-fg-secondary">
    <span className="flex items-center gap-1.5">{label}{term && <InfoTip term={term} label={label} />}</span>
    <div className="mt-1.5">{children}</div>
  </label>;
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return <div className="sm:col-span-2"><h3 className="text-sm font-semibold text-fg">{title}</h3><p className="mt-0.5 text-xs text-fg-muted">{description}</p></div>;
}

export default function OrganizationPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [directors, setDirectors] = useState<Director[]>([]);
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [activeSection, setActiveSection] = useState<OrganizationSection>('overview');
  const [companyForm, setCompanyForm] = useState(emptyCompany);
  const [branchForm, setBranchForm] = useState(emptyBranch);
  const [locationForm, setLocationForm] = useState(emptyLocation);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      const [companyData, branchData, locationData, departmentData, directorData, documentData] = await Promise.all([
        api.get<Company | null>('/organization/company'),
        api.get<Branch[]>('/organization/branches'),
        api.get<Location[]>('/organization/locations'),
        api.get<Array<{ _id: string }>>('/departments'),
        api.get<Director[]>('/organization/directors'),
        api.get<CompanyDocument[]>('/organization/documents'),
      ]);
      setCompany(companyData);
      setCompanyForm(companyToForm(companyData));
      setBranches(branchData);
      setLocations(locationData);
      setDepartmentCount(departmentData.length);
      setDirectors(directorData);
      setDocuments(documentData);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load organization');
    } finally {
      setLoading(false);
    }
  }

  /** Refreshes only what an attachment or director change can affect. */
  async function reloadProfile() {
    const [directorData, documentData] = await Promise.all([
      api.get<Director[]>('/organization/directors'),
      api.get<CompanyDocument[]>('/organization/documents'),
    ]);
    setDirectors(directorData);
    setDocuments(documentData);
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const requestedSection = new URLSearchParams(window.location.search).get('section') as OrganizationSection | null;
    if (requestedSection && organizationSections.includes(requestedSection)) setActiveSection(requestedSection);
  }, []);

  async function saveCompany(event: FormEvent) {
    event.preventDefault(); setSaving(true); setMessage(''); setError('');
    try { await api.patch('/organization/company', companyForm); setMessage('Company profile saved'); await load(); }
    catch (err: any) { setError(err.message || 'Failed to save company profile'); }
    finally { setSaving(false); }
  }

  async function createBranch(event: FormEvent) {
    event.preventDefault(); if (!company) return; setSaving(true); setError('');
    try { if (editingBranch) await api.patch(`/organization/branches/${editingBranch._id}`, branchForm); else await api.post('/organization/branches', { ...branchForm, companyId: company._id }); setBranchOpen(false); setEditingBranch(null); setBranchForm(emptyBranch); await load(); }
    catch (err: any) { setError(err.message || 'Failed to create branch'); }
    finally { setSaving(false); }
  }

  async function createLocation(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    try { if (editingLocation) await api.patch(`/organization/locations/${editingLocation._id}`, locationForm); else await api.post('/organization/locations', locationForm); setLocationOpen(false); setEditingLocation(null); setLocationForm(emptyLocation); await load(); }
    catch (err: any) { setError(err.message || 'Failed to create location'); }
    finally { setSaving(false); }
  }

  function openBranch() {
    if (!company) {
      setMessage('Complete and save the company profile before adding a branch.');
      return;
    }
    setMessage('');
    setEditingBranch(null);
    setBranchForm(emptyBranch);
    setBranchOpen(true);
  }

  function openLocation() {
    if (!branches.length) {
      setMessage('Create at least one branch before adding a physical location.');
      return;
    }
    setMessage('');
    setEditingLocation(null);
    setLocationForm(emptyLocation);
    setLocationOpen(true);
  }

  function editBranch(branch: Branch) {
    setEditingBranch(branch);
    setBranchForm({ code: branch.code, name: branch.name, taxRegistrationNumber: branch.taxRegistrationNumber || '', email: branch.email || '', phone: branch.phone || '', address: branch.address || '', city: branch.city || '', stateProvince: branch.stateProvince || '', postalCode: branch.postalCode || '', country: branch.country || 'India' });
    setBranchOpen(true);
  }

  function editLocation(location: Location) {
    setEditingLocation(location);
    setLocationForm({ code: location.code, name: location.name, branchId: location.branchId?._id || '', type: location.type, address: location.address || '', city: location.city || '', stateProvince: location.stateProvince || '', postalCode: location.postalCode || '', country: location.country || 'India' });
    setLocationOpen(true);
  }

  async function deleteOrganizationRecord(kind: 'branches' | 'locations', id: string, name: string) {
    if (!window.confirm(`Remove ${name}? This keeps its audit history.`)) return;
    try { await api.delete(`/organization/${kind}/${id}`); await load(); }
    catch (err: any) { setError(err.message || `Failed to remove ${kind === 'branches' ? 'branch' : 'location'}`); }
  }

  /** Company-level attachments are the ones not filed against a director. */
  const companyDocument = (kind: CompanyDocumentKind) => documents.find((document) => !document.directorId && document.kind === kind);

  function statutoryAttachment(kind: CompanyDocumentKind) {
    return <AttachmentSlot kind={kind} document={companyDocument(kind)} disabled={!company} onChange={reloadProfile} onError={setError} />;
  }

  const attachedCount = documents.filter((document) => !document.directorId).length;

  if (loading) return <LoadingSpinner />;

  return <>
    <PageHeader title="Organization" description="Manage your legal company, statutory records, operating structure, physical locations, and departments." />
    {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">{error}</div>}
    {message && <div className="mb-5 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:border-brand-900 dark:bg-brand-950/20 dark:text-brand-300">{message}</div>}

    <button
      role="tab"
      aria-selected={activeSection === 'overview'}
      aria-controls="overview-panel"
      onClick={() => { setActiveSection('overview'); setMessage(''); }}
      className={`mb-3 flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left shadow-sm transition-colors ${activeSection === 'overview' ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100 dark:bg-brand-950/20 dark:ring-brand-950/50' : 'border-border bg-surface hover:border-border-strong hover:bg-surface-secondary'}`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-tertiary text-fg-muted"><LayoutList className="h-4 w-4" /></div>
      <div><p className="text-sm font-semibold text-fg">Everything on record</p><p className="text-xs text-fg-muted">Review the whole organization on one page</p></div>
    </button>

    <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" role="tablist" aria-label="Organization sections">
      {[
        { id: 'company' as const, label: 'Company profile', detail: company ? `Complete · ${attachedCount} attachment${attachedCount === 1 ? '' : 's'}` : 'Required first', complete: Boolean(company) },
        { id: 'directors' as const, label: 'Directors', detail: directors.length ? `${directors.length} on record` : 'After company', complete: directors.length > 0 },
        { id: 'branches' as const, label: 'Operating branch', detail: branches.length ? `${branches.length} configured` : 'After company', complete: branches.length > 0 },
        { id: 'locations' as const, label: 'Physical location', detail: locations.length ? `${locations.length} configured` : 'After branch', complete: locations.length > 0 },
        { id: 'departments' as const, label: 'Department', detail: departmentCount ? `${departmentCount} configured` : 'Set up teams', complete: departmentCount > 0 },
      ].map((step, index) => <button key={step.id} role="tab" aria-selected={activeSection === step.id} aria-controls={`${step.id}-panel`} onClick={() => { setActiveSection(step.id); setMessage(''); }} className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left shadow-sm transition-colors ${activeSection === step.id ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100 dark:bg-brand-950/20 dark:ring-brand-950/50' : 'border-border bg-surface hover:border-border-strong hover:bg-surface-secondary'}`}><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${step.complete ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : activeSection === step.id ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300' : 'bg-surface-tertiary text-fg-muted'}`}>{step.complete ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}</div><div className="min-w-0"><p className="text-sm font-semibold text-fg">{index + 1}. {step.label}</p><p className="truncate text-xs text-fg-muted">{step.detail}</p></div></button>)}
    </div>

    <div className="grid gap-6">
      <form id="company-panel" role="tabpanel" className={`card p-5 ${activeSection === 'company' ? '' : 'hidden'}`} onSubmit={saveCompany}>
        <div className="mb-5 flex items-center gap-3 border-b border-border pb-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300"><Building2 className="h-5 w-5" /></div><div><h2 className="font-semibold text-fg">Company profile</h2><p className="text-sm text-fg-muted">Legal identity, statutory registrations, and constitutional documents</p></div></div>
        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          <SectionTitle title="Identity" description="Official name, internal company code, and the logo used on commercial documents." />
          <LogoUploader document={companyDocument('logo')} disabled={!company} onChange={reloadProfile} onError={setError} />
          <Field label="Company code"><input required className="input-field" value={companyForm.code} onChange={(e) => setCompanyForm({ ...companyForm, code: e.target.value.toUpperCase() })} /></Field>
          <Field label="Company name"><input required className="input-field" value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} /></Field>
          <Field label="Industry"><input className="input-field" placeholder="Machinery manufacturing" value={companyForm.industry} onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })} /></Field>
          <Field label="Established on"><input type="date" className="input-field" value={companyForm.incorporatedOn} onChange={(e) => setCompanyForm({ ...companyForm, incorporatedOn: e.target.value })} /></Field>

          <SectionTitle title="Contact" description="Primary business contact details." />
          <Field label="Email"><input type="email" className="input-field" value={companyForm.email} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} /></Field>
          <Field label="Phone"><input className="input-field" value={companyForm.phone} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} /></Field>
          <Field label="Website"><input type="url" className="input-field" placeholder="https://example.com" value={companyForm.website} onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })} /></Field>

          <SectionTitle title="Statutory registrations" description="Each number is stored with the certificate that proves it. Leave a slot empty if it does not apply." />
          {!company && <p className="rounded-lg border border-border bg-surface-secondary px-3 py-2 text-xs text-fg-muted sm:col-span-2">Save the company profile once to enable attachments.</p>}
          <div className="sm:col-span-2">
            <StatutoryRow label="CIN" hint="Corporate Identity Number" term="cin" attachment={statutoryAttachment('cin_certificate')}>
              <input className="input-field font-mono" placeholder="U29299KA2026PTC000001" maxLength={21} value={companyForm.cin} onChange={(e) => setCompanyForm({ ...companyForm, cin: e.target.value.toUpperCase() })} />
            </StatutoryRow>
            <StatutoryRow label="GST" hint="GSTIN of the registered office" term="gstin" attachment={statutoryAttachment('gst_certificate')}>
              <input className="input-field font-mono" placeholder="29AABCM1234F1Z5" maxLength={15} value={companyForm.gstin} onChange={(e) => setCompanyForm({ ...companyForm, gstin: e.target.value.toUpperCase() })} />
            </StatutoryRow>
            <StatutoryRow label="PAN" hint="Permanent Account Number" term="pan" attachment={statutoryAttachment('pan_certificate')}>
              <input className="input-field font-mono" placeholder="AABCM1234F" maxLength={10} value={companyForm.pan} onChange={(e) => setCompanyForm({ ...companyForm, pan: e.target.value.toUpperCase() })} />
            </StatutoryRow>
            <StatutoryRow label="TAN" hint="Tax Deduction Account Number" term="tan" attachment={statutoryAttachment('tan_certificate')}>
              <input className="input-field font-mono" placeholder="BLRM12345F" maxLength={10} value={companyForm.tan} onChange={(e) => setCompanyForm({ ...companyForm, tan: e.target.value.toUpperCase() })} />
            </StatutoryRow>
            <StatutoryRow label="MSME" hint="Udyam registration number" term="msme" attachment={statutoryAttachment('msme_certificate')}>
              <input className="input-field font-mono" placeholder="UDYAM-KA-03-0001234" maxLength={40} value={companyForm.msmeNumber} onChange={(e) => setCompanyForm({ ...companyForm, msmeNumber: e.target.value.toUpperCase() })} />
            </StatutoryRow>
          </div>

          <SectionTitle title="Constitutional documents" description="The charter documents filed with the Registrar of Companies." />
          <div className="sm:col-span-2">
            <StatutoryRow label="MOA" hint="Memorandum of Association" term="moa" attachment={statutoryAttachment('moa')}><></></StatutoryRow>
            <StatutoryRow label="AOA" hint="Articles of Association" term="aoa" attachment={statutoryAttachment('aoa')}><></></StatutoryRow>
          </div>

          <SectionTitle title="Registered address" description="Legal address for company records." />
          <Field label="Address"><input className="input-field" value={companyForm.address} onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} /></Field>
          <Field label="City"><input className="input-field" value={companyForm.city} onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })} /></Field>
          <Field label="State / province"><input className="input-field" value={companyForm.stateProvince} onChange={(e) => setCompanyForm({ ...companyForm, stateProvince: e.target.value })} /></Field>
          <Field label="Postal code"><input className="input-field" value={companyForm.postalCode} onChange={(e) => setCompanyForm({ ...companyForm, postalCode: e.target.value })} /></Field>
          <Field label="Country"><input className="input-field" value={companyForm.country} onChange={(e) => setCompanyForm({ ...companyForm, country: e.target.value })} /></Field>

          <SectionTitle title="Regional settings" description="Used by commercial documents and ERP transactions." />
          <Field label="Base currency"><input required className="input-field" value={companyForm.baseCurrency} onChange={(e) => setCompanyForm({ ...companyForm, baseCurrency: e.target.value.toUpperCase() })} /></Field>
          <Field label="Timezone"><input required className="input-field" value={companyForm.timezone} onChange={(e) => setCompanyForm({ ...companyForm, timezone: e.target.value })} /></Field>
          <Field label="Fiscal year starts"><select className="input-field capitalize" value={companyForm.fiscalYearStartMonth} onChange={(e) => setCompanyForm({ ...companyForm, fiscalYearStartMonth: e.target.value })}>{['january','february','march','april','may','june','july','august','september','october','november','december'].map(month => <option key={month} value={month}>{month}</option>)}</select></Field>
          <Field label="Date format"><select className="input-field" value={companyForm.dateFormat} onChange={(e) => setCompanyForm({ ...companyForm, dateFormat: e.target.value })}><option value="dd/MM/yyyy">DD/MM/YYYY</option><option value="MM/dd/yyyy">MM/DD/YYYY</option><option value="yyyy-MM-dd">YYYY-MM-DD</option><option value="dd MMM yyyy">DD MMM YYYY</option></select></Field>
          <Field label="Language"><select className="input-field" value={companyForm.languageCode} onChange={(e) => setCompanyForm({ ...companyForm, languageCode: e.target.value })}><option value="en">English</option><option value="de">German</option><option value="fr">French</option><option value="es">Spanish</option><option value="it">Italian</option><option value="pt">Portuguese</option></select></Field>
        </div>
        <div className="mt-5 flex justify-end border-t border-border pt-4"><button className="btn-primary" disabled={saving}><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save company'}</button></div>
      </form>

      <div id={activeSection === 'branches' ? 'branches-panel' : 'locations-panel'} role="tabpanel" className={activeSection === 'branches' ? 'space-y-6 [&>section:nth-child(2)]:hidden' : activeSection === 'locations' ? 'space-y-6 [&>section:first-child]:hidden' : 'hidden'}>
        <section className="card overflow-hidden"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-semibold text-fg">Branches</h2><p className="text-sm text-fg-muted">{branches.length ? `${branches.length} operating entities` : 'Create after the company profile'}</p></div><button className="btn-secondary" onClick={openBranch}><Plus className="h-4 w-4" />Add</button></div><div className="divide-y divide-border">{branches.map((branch) => <div key={branch._id} className="flex items-start gap-3 p-4"><div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300"><Factory className="h-4 w-4" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-fg">{branch.name}</p><span className="badge-blue">{branch.code}</span></div><p className="mt-1 text-sm text-fg-muted">{[branch.city, branch.stateProvince].filter(Boolean).join(', ') || 'Address pending'}</p></div><div className="ml-auto flex gap-1"><button className="btn-ghost p-2" title="Edit branch" onClick={() => editBranch(branch)}><Pencil className="h-4 w-4" /></button><button className="btn-ghost p-2 text-red-600" title="Remove branch" onClick={() => void deleteOrganizationRecord('branches', branch._id, branch.name)}><Trash2 className="h-4 w-4" /></button></div></div>)}</div></section>
        <section className="card overflow-hidden"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-semibold text-fg">Locations</h2><p className="text-sm text-fg-muted">{locations.length ? `${locations.length} physical locations` : 'Create after the first branch'}</p></div><button className="btn-secondary" onClick={openLocation}><Plus className="h-4 w-4" />Add</button></div><div className="divide-y divide-border">{locations.map((location) => <div key={location._id} className="flex items-start gap-3 p-4"><div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">{location.type === 'warehouse' ? <Warehouse className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-fg">{location.name}</p><span className="badge-gray capitalize">{location.type}</span></div><p className="mt-1 text-sm text-fg-muted">{location.branchId?.name} · {location.code}</p></div><div className="ml-auto flex gap-1"><button className="btn-ghost p-2" title="Edit location" onClick={() => editLocation(location)}><Pencil className="h-4 w-4" /></button><button className="btn-ghost p-2 text-red-600" title="Remove location" onClick={() => void deleteOrganizationRecord('locations', location._id, location.name)}><Trash2 className="h-4 w-4" /></button></div></div>)}</div></section>
      </div>
    </div>

    {activeSection === 'overview' && <div id="overview-panel" role="tabpanel">
      <OrganizationOverview
        company={company}
        directors={directors}
        documents={documents}
        branchCount={branches.length}
        locationCount={locations.length}
        departmentCount={departmentCount}
        onEdit={(section) => { setActiveSection(section); setMessage(''); }}
        onError={setError}
      />
    </div>}
    {activeSection === 'directors' && <div id="directors-panel" role="tabpanel"><DirectorManagement directors={directors} documents={documents} canManage={Boolean(company)} onReload={reloadProfile} onError={setError} /></div>}
    {activeSection === 'departments' && <div id="departments-panel" role="tabpanel"><DepartmentManagement onCountChange={setDepartmentCount} /></div>}

    {branchOpen && <Modal title="Add branch" onClose={() => setBranchOpen(false)} size="lg"><form className="grid gap-4 sm:grid-cols-2" onSubmit={createBranch}><Field label="Branch code"><input required className="input-field" value={branchForm.code} onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value.toUpperCase() })} /></Field><Field label="Branch name"><input required className="input-field" value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} /></Field><Field label="Email"><input type="email" className="input-field" value={branchForm.email} onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })} /></Field><Field label="Phone"><input className="input-field" value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} /></Field><Field label="GSTIN" term="gstin"><input className="input-field font-mono" value={branchForm.taxRegistrationNumber} onChange={(e) => setBranchForm({ ...branchForm, taxRegistrationNumber: e.target.value.toUpperCase() })} /></Field><div className="hidden sm:block" /><Field label="Address"><input className="input-field" value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} /></Field><Field label="City"><input className="input-field" value={branchForm.city} onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })} /></Field><Field label="State / province"><input className="input-field" value={branchForm.stateProvince} onChange={(e) => setBranchForm({ ...branchForm, stateProvince: e.target.value })} /></Field><Field label="Postal code"><input className="input-field" value={branchForm.postalCode} onChange={(e) => setBranchForm({ ...branchForm, postalCode: e.target.value })} /></Field><Field label="Country"><input className="input-field" value={branchForm.country} onChange={(e) => setBranchForm({ ...branchForm, country: e.target.value })} /></Field><div className="flex justify-end gap-2 border-t border-border pt-4 sm:col-span-2"><button type="button" className="btn-ghost" onClick={() => setBranchOpen(false)}>Cancel</button><button className="btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create branch'}</button></div></form></Modal>}
    {locationOpen && <Modal title="Add location" onClose={() => setLocationOpen(false)} size="lg"><form className="grid gap-4 sm:grid-cols-2" onSubmit={createLocation}><Field label="Location code"><input required className="input-field" value={locationForm.code} onChange={(e) => setLocationForm({ ...locationForm, code: e.target.value.toUpperCase() })} /></Field><Field label="Location name"><input required className="input-field" value={locationForm.name} onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })} /></Field><Field label="Branch"><select required className="input-field" value={locationForm.branchId} onChange={(e) => setLocationForm({ ...locationForm, branchId: e.target.value })}><option value="">Select branch</option>{branches.map((branch) => <option key={branch._id} value={branch._id}>{branch.code} — {branch.name}</option>)}</select></Field><Field label="Location type"><select className="input-field" value={locationForm.type} onChange={(e) => setLocationForm({ ...locationForm, type: e.target.value })}><option value="office">Office</option><option value="factory">Factory</option><option value="warehouse">Warehouse</option><option value="service">Service</option></select></Field><Field label="Address"><input className="input-field" value={locationForm.address} onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })} /></Field><Field label="City"><input className="input-field" value={locationForm.city} onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })} /></Field><Field label="State / province"><input className="input-field" value={locationForm.stateProvince} onChange={(e) => setLocationForm({ ...locationForm, stateProvince: e.target.value })} /></Field><Field label="Postal code"><input className="input-field" value={locationForm.postalCode} onChange={(e) => setLocationForm({ ...locationForm, postalCode: e.target.value })} /></Field><Field label="Country"><input className="input-field" value={locationForm.country} onChange={(e) => setLocationForm({ ...locationForm, country: e.target.value })} /></Field><div className="flex justify-end gap-2 border-t border-border pt-4 sm:col-span-2"><button type="button" className="btn-ghost" onClick={() => setLocationOpen(false)}>Cancel</button><button className="btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create location'}</button></div></form></Modal>}
  </>;
}

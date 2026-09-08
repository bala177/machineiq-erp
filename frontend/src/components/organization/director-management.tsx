'use client';

import { FormEvent, useEffect, useState } from 'react';
import { BadgeCheck, Mail, Pencil, Phone, PieChart, Plus, Trash2, UserRound } from 'lucide-react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/modal';
import { AttachmentSlot } from '@/components/organization/attachment-slot';
import { CompanyDocument, CompanyDocumentKind, documentLabels, fetchDocumentContent } from '@/lib/company-documents';
import { GlossaryTerm } from '@/lib/glossary';
import { InfoTip } from '@/components/ui/info-tip';

export type Director = {
  _id: string; name: string; designation?: string | null; din?: string | null;
  email?: string | null; phone?: string | null; shareholdingPercent?: number | null;
  appointedOn?: string | null; isActive: boolean;
};

type DirectorForm = { name: string; designation: string; din: string; email: string; phone: string; shareholdingPercent: string; appointedOn: string };
const emptyDirector: DirectorForm = { name: '', designation: '', din: '', email: '', phone: '', shareholdingPercent: '', appointedOn: '' };

const directorSlots: CompanyDocumentKind[] = ['director_photo', 'din_certificate', 'director_aadhaar', 'director_pan', 'shareholding_certificate'];

/** Explanations for the director documents whose names are abbreviations. */
const slotTerms: Partial<Record<CompanyDocumentKind, GlossaryTerm>> = {
  din_certificate: 'din',
  director_aadhaar: 'aadhaar',
  director_pan: 'panPersonal',
  shareholding_certificate: 'shareholding',
};

function DirectorPhoto({ document }: { document?: CompanyDocument }) {
  const [preview, setPreview] = useState('');
  useEffect(() => {
    let active = true;
    if (!document) { setPreview(''); return; }
    fetchDocumentContent(document._id).then((stored) => { if (active) setPreview(stored.content); }).catch(() => undefined);
    return () => { active = false; };
  }, [document]);

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-secondary">
      {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-6 w-6 text-fg-muted" />}
    </div>
  );
}

export function DirectorManagement({ directors, documents, canManage, onReload, onError }: {
  directors: Director[];
  documents: CompanyDocument[];
  canManage: boolean;
  onReload: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Director | null>(null);
  const [form, setForm] = useState<DirectorForm>(emptyDirector);
  const [saving, setSaving] = useState(false);

  const totalShareholding = directors.reduce((total, director) => total + (director.shareholdingPercent || 0), 0);
  const documentFor = (directorId: string, kind: CompanyDocumentKind) =>
    documents.find((document) => document.directorId === directorId && document.kind === kind);

  function openCreate() {
    if (!canManage) { onError('Save the company profile before adding directors.'); return; }
    setEditing(null); setForm(emptyDirector); setOpen(true);
  }

  function openEdit(director: Director) {
    setEditing(director);
    setForm({
      name: director.name, designation: director.designation || '', din: director.din || '',
      email: director.email || '', phone: director.phone || '',
      shareholdingPercent: director.shareholdingPercent === null || director.shareholdingPercent === undefined ? '' : String(director.shareholdingPercent),
      appointedOn: director.appointedOn ? director.appointedOn.slice(0, 10) : '',
    });
    setOpen(true);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        designation: form.designation || undefined,
        din: form.din || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        shareholdingPercent: form.shareholdingPercent === '' ? undefined : Number(form.shareholdingPercent),
        appointedOn: form.appointedOn || undefined,
      };
      if (editing) await api.patch(`/organization/directors/${editing._id}`, payload);
      else await api.post('/organization/directors', payload);
      setOpen(false); setEditing(null); setForm(emptyDirector);
      await onReload();
    } catch (error: any) {
      onError(error.message || 'The director could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(director: Director) {
    if (!window.confirm(`Remove ${director.name}? Their attachments are removed with them and the audit history is kept.`)) return;
    try { await api.delete(`/organization/directors/${director._id}`); await onReload(); }
    catch (error: any) { onError(error.message || 'The director could not be removed.'); }
  }

  return <>
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-semibold text-fg">Directors</h2>
          <p className="text-sm text-fg-muted">
            {directors.length
              ? `${directors.length} on record · ${totalShareholding}% of shareholding accounted for`
              : 'Record the board, their DIN, and their statutory soft copies'}
          </p>
        </div>
        <button className="btn-secondary" onClick={openCreate}><Plus className="h-4 w-4" />Add director</button>
      </div>

      {totalShareholding > 100 && (
        <p className="border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
          Recorded shareholding adds up to {totalShareholding}%. Check the individual percentages.
        </p>
      )}

      {directors.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <UserRound className="mx-auto h-8 w-8 text-fg-muted" />
          <p className="mt-3 text-sm font-medium text-fg">No directors recorded</p>
          <p className="mt-1 text-sm text-fg-muted">Add each director to file their DIN, photograph, and identity soft copies.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {directors.map((director) => (
            <div key={director._id} className="p-5">
              <div className="flex items-start gap-4">
                <DirectorPhoto document={documentFor(director._id, 'director_photo')} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-fg">{director.name}</p>
                    {director.designation && <span className="badge-gray">{director.designation}</span>}
                    {!director.isActive && <span className="badge-gray">Resigned</span>}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg-muted">
                    {director.din && <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5" />DIN {director.din}</span>}
                    {director.email && <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{director.email}</span>}
                    {director.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{director.phone}</span>}
                    {director.shareholdingPercent !== null && director.shareholdingPercent !== undefined &&
                      <span className="inline-flex items-center gap-1.5"><PieChart className="h-3.5 w-3.5" />{director.shareholdingPercent}% shareholding</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="btn-ghost p-2" title="Edit director" onClick={() => openEdit(director)}><Pencil className="h-4 w-4" /></button>
                  <button className="btn-ghost p-2 text-red-600" title="Remove director" onClick={() => void remove(director)}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {directorSlots.map((kind) => (
                  <div key={kind} className="rounded-lg border border-border bg-surface-secondary/50 p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-fg-muted">
                      {documentLabels[kind]}
                      {slotTerms[kind] && <InfoTip term={slotTerms[kind]!} label={documentLabels[kind]} />}
                    </p>
                    <AttachmentSlot
                      kind={kind}
                      directorId={director._id}
                      document={documentFor(director._id, kind)}
                      onChange={onReload}
                      onError={onError}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>

    {open && (
      <Modal title={editing ? 'Edit director' : 'Add director'} onClose={() => setOpen(false)} size="lg">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={save}>
          <label className="block text-sm font-medium text-fg-secondary sm:col-span-2">Full name
            <input required className="input-field mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="block text-sm font-medium text-fg-secondary">Designation
            <input className="input-field mt-1.5" placeholder="Managing Director" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          </label>
          <label className="block text-sm font-medium text-fg-secondary">
            <span className="flex items-center gap-1.5">DIN<InfoTip term="din" label="DIN" /></span>
            <input className="input-field mt-1.5" inputMode="numeric" placeholder="8 digits" value={form.din} onChange={(e) => setForm({ ...form, din: e.target.value.replace(/\D/g, '').slice(0, 8) })} />
          </label>
          <label className="block text-sm font-medium text-fg-secondary">Email
            <input type="email" className="input-field mt-1.5" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="block text-sm font-medium text-fg-secondary">Contact
            <input className="input-field mt-1.5" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label className="block text-sm font-medium text-fg-secondary">
            <span className="flex items-center gap-1.5">Shareholding %<InfoTip term="shareholding" label="Shareholding" /></span>
            <input type="number" min="0" max="100" step="0.01" className="input-field mt-1.5" value={form.shareholdingPercent} onChange={(e) => setForm({ ...form, shareholdingPercent: e.target.value })} />
          </label>
          <label className="block text-sm font-medium text-fg-secondary">Appointed on
            <input type="date" className="input-field mt-1.5" value={form.appointedOn} onChange={(e) => setForm({ ...form, appointedOn: e.target.value })} />
          </label>
          <p className="text-xs text-fg-muted sm:col-span-2">Photograph and identity soft copies are attached from the director card after saving.</p>
          <div className="flex justify-end gap-2 border-t border-border pt-4 sm:col-span-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save director' : 'Add director'}</button>
          </div>
        </form>
      </Modal>
    )}
  </>;
}

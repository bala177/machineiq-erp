'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { FileText, ImageIcon, Loader2, Paperclip, Trash2, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { GlossaryTerm } from '@/lib/glossary';
import { InfoTip } from '@/components/ui/info-tip';
import {
  CompanyDocument, CompanyDocumentKind, acceptFor, documentLabels, formatBytes,
  openCompanyDocument, uploadCompanyDocument,
} from '@/lib/company-documents';

type SlotProps = {
  kind: CompanyDocumentKind;
  document?: CompanyDocument;
  directorId?: string;
  disabled?: boolean;
  onChange: () => Promise<void> | void;
  onError: (message: string) => void;
};

/**
 * One attachment slot — an empty "Attach" affordance, or the stored file with
 * view and remove actions. Uploading replaces whatever occupies the slot.
 */
export function AttachmentSlot({ kind, document, directorId, disabled, onChange, onError }: SlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      await uploadCompanyDocument(kind, file, directorId);
      await onChange();
    } catch (error: any) {
      onError(error.message || `${documentLabels[kind]} could not be uploaded.`);
    } finally {
      setBusy(false);
    }
  }

  async function view() {
    if (!document) return;
    setBusy(true);
    try { await openCompanyDocument(document._id); }
    catch (error: any) { onError(error.message || 'That attachment could not be opened.'); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!document) return;
    if (!window.confirm(`Remove ${document.fileName}? This keeps its audit history.`)) return;
    setBusy(true);
    try {
      await api.delete(`/organization/documents/${document._id}`);
      await onChange();
    } catch (error: any) {
      onError(error.message || 'That attachment could not be removed.');
    } finally {
      setBusy(false);
    }
  }

  const Icon = document?.mimeType === 'application/pdf' ? FileText : ImageIcon;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input ref={inputRef} type="file" accept={acceptFor(kind)} className="hidden" onChange={upload} aria-label={`Attach ${documentLabels[kind]}`} />
      {document ? (
        <>
          <button
            type="button"
            onClick={view}
            disabled={busy}
            className="group flex min-w-0 max-w-full items-center gap-2 rounded-lg border border-border bg-surface-secondary px-2.5 py-1.5 text-left transition-colors hover:border-brand-300 hover:bg-brand-50 disabled:opacity-60 dark:hover:bg-brand-950/20"
            title={`Open ${document.fileName}`}
          >
            {busy ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-fg-muted" /> : <Icon className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />}
            <span className="truncate text-xs font-medium text-fg group-hover:text-brand-700 dark:group-hover:text-brand-300">{document.fileName}</span>
            <span className="shrink-0 text-[11px] text-fg-muted">{formatBytes(document.sizeBytes)}</span>
          </button>
          {!disabled && <>
            <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="btn-ghost px-2 py-1.5 text-xs" title="Replace attachment">
              <Upload className="h-3.5 w-3.5" />Replace
            </button>
            <button type="button" onClick={remove} disabled={busy} className="btn-ghost px-2 py-1.5 text-red-600" title="Remove attachment" aria-label={`Remove ${document.fileName}`}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>}
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || busy}
          title={disabled ? 'Save the company profile before adding attachments' : `Attach ${documentLabels[kind]}`}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-border-strong px-2.5 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:border-brand-400 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-brand-400"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
          {busy ? 'Uploading…' : 'Attach'}
        </button>
      )}
    </div>
  );
}

/**
 * A statutory identifier and the certificate that proves it, kept on one row so
 * the number is never recorded without a way to file its evidence.
 */
export function StatutoryRow({ label, hint, term, children, attachment }: {
  label: string; hint?: string; term?: GlossaryTerm; children: React.ReactNode; attachment?: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 border-b border-border py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:items-start sm:gap-4">
      <div className="pt-1.5">
        <p className="flex items-center gap-1.5 text-sm font-medium text-fg-secondary">
          {label}
          {term && <InfoTip term={term} label={label} />}
        </p>
        {hint && <p className="mt-0.5 text-xs text-fg-muted">{hint}</p>}
      </div>
      <div className="space-y-2">
        {children}
        {attachment}
      </div>
    </div>
  );
}

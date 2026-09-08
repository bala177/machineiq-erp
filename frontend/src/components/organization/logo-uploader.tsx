'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Building2, Loader2, Trash2, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { CompanyDocument, fetchDocumentContent, formatBytes, uploadCompanyDocument } from '@/lib/company-documents';

/** Square preview of the company logo, with upload, replace, and remove. */
export function LogoUploader({ document, disabled, onChange, onError }: {
  document?: CompanyDocument;
  disabled?: boolean;
  onChange: () => Promise<void> | void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    if (!document) { setPreview(''); return; }
    fetchDocumentContent(document._id)
      .then((stored) => { if (active) setPreview(stored.content); })
      .catch(() => { if (active) setPreview(''); });
    return () => { active = false; };
  }, [document]);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      await uploadCompanyDocument('logo', file);
      await onChange();
    } catch (error: any) {
      onError(error.message || 'The logo could not be uploaded.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!document || !window.confirm('Remove the company logo?')) return;
    setBusy(true);
    try {
      await api.delete(`/organization/documents/${document._id}`);
      await onChange();
    } catch (error: any) {
      onError(error.message || 'The logo could not be removed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4 sm:col-span-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || busy}
        className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border-strong bg-surface-secondary transition-colors hover:border-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={document ? 'Replace company logo' : 'Upload company logo'}
      >
        {busy
          ? <Loader2 className="h-5 w-5 animate-spin text-fg-muted" />
          : preview
            ? <img src={preview} alt="Company logo" className="h-full w-full object-contain p-2" />
            : <Building2 className="h-7 w-7 text-fg-muted" />}
      </button>
      <div className="min-w-0">
        <p className="text-sm font-medium text-fg-secondary">Company logo</p>
        <p className="mt-0.5 text-xs text-fg-muted">
          {document ? `${document.fileName} · ${formatBytes(document.sizeBytes)}` : 'PNG, JPEG, or WebP up to 2 MB.'}
        </p>
        {disabled
          ? <p className="mt-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">Save the company profile below before uploading a logo.</p>
          : <p className="mt-0.5 text-xs text-fg-muted">Appears on printed quotations. Reprints of older quotes use the current logo.</p>}
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={upload} />
        <div className="mt-2 flex gap-2">
          <button type="button" className="btn-secondary px-2.5 py-1.5 text-xs" onClick={() => inputRef.current?.click()} disabled={disabled || busy}>
            <Upload className="h-3.5 w-3.5" />{document ? 'Replace' : 'Upload'}
          </button>
          {document && <button type="button" className="btn-ghost px-2.5 py-1.5 text-xs text-red-600" onClick={remove} disabled={busy}>
            <Trash2 className="h-3.5 w-3.5" />Remove
          </button>}
        </div>
      </div>
    </div>
  );
}

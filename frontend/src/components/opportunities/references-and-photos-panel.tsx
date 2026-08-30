'use client';

import { ChangeEvent, useRef, useState } from 'react';
import {
  ExternalLink,
  FileText,
  ImagePlus,
  Link as LinkIcon,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { api } from '@/lib/api';

type Photo = {
  url: string;
  caption?: string;
  kind?: string;
  uploadedAt?: string;
};

type Props = {
  opportunityId: string;
  photos: Photo[];
  attachments?: string[];
  disabled?: boolean;
  onChanged: (next: Photo[]) => void;
};

const SUPPORTED_FILE_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt',
  'dwg', 'dxf', 'step', 'stp', 'iges', 'eml', 'msg',
]);

function inferKind(fileName: string, mimeType: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) return 'photo';
  if (['dwg', 'dxf', 'step', 'stp', 'iges'].includes(ext)) return 'drawing';
  if (['pdf', 'doc', 'docx', 'txt', 'eml', 'msg'].includes(ext)) return 'document';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'spec';
  return 'file';
}

export function ReferencesAndPhotosPanel({ opportunityId, photos, attachments = [], disabled, onChanged }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [kind, setKind] = useState('link');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingUrl, setRemovingUrl] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [error, setError] = useState('');

  const persistPhoto = async (payload: { url: string; caption?: string; kind?: string }) => {
    const updated = await api.post<any>(`/opportunities/${opportunityId}/photos`, payload);
    onChanged(updated.referencePhotos || []);
    return updated.referencePhotos || [];
  };

  const addLink = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;
    setBusy(true);
    setError('');
    try {
      await persistPhoto({
        url: trimmedUrl,
        caption: caption.trim() || undefined,
        kind,
      });
      setUrl('');
      setCaption('');
    } catch (err: any) {
      setError(err.message || 'Failed to add reference');
    } finally {
      setBusy(false);
    }
  };

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      let skippedType = false;
      let skippedLarge = false;
      const eligible = files.filter((file) => {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (!SUPPORTED_FILE_EXTENSIONS.has(ext)) { skippedType = true; return false; }
        if (file.size > 3 * 1024 * 1024) { skippedLarge = true; return false; }
        return true;
      });
      if (skippedType || skippedLarge) {
        setError(
          skippedType && skippedLarge
            ? 'Some files were skipped because the type is unsupported or the file exceeds 3 MB.'
            : skippedType
              ? 'One or more unsupported file types were skipped.'
              : 'One or more files exceed 3 MB and were skipped.',
        );
      }
      for (const file of eligible) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        await persistPhoto({
          url: dataUrl,
          caption: caption.trim() || file.name,
          kind: inferKind(file.name, file.type),
        });
      }
      setCaption('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const uploadFromPicker = (event: ChangeEvent<HTMLInputElement>) => {
    void uploadFiles(Array.from(event.target.files || []));
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled || uploading) return;
    void uploadFiles(Array.from(event.dataTransfer.files || []));
  };

  const removePhoto = async (photoUrl: string) => {
    setRemovingUrl(photoUrl);
    setError('');
    try {
      const updated = await api.delete<any>(
        `/opportunities/${opportunityId}/photos?url=${encodeURIComponent(photoUrl)}`,
      );
      onChanged(updated.referencePhotos || []);
      if (selectedPhoto?.url === photoUrl) setSelectedPhoto(null);
    } catch (err: any) {
      setError(err.message || 'Failed to remove reference');
    } finally {
      setRemovingUrl(null);
    }
  };

  const isImage = (p: Photo) => {
    const u = p.url.toLowerCase();
    return p.kind === 'photo' || u.startsWith('data:image') || /\.(png|jpe?g|webp|gif|svg)(\?|$)/.test(u);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
            <ImagePlus className="h-4 w-4 text-fg-secondary" />
            Reference Material
          </h3>
          <p className="mt-0.5 text-xs text-fg-muted">
            Photos, drawings, RFQ scans, spec sheets, brochures, and useful links.
          </p>
        </div>
        {(photos.length > 0 || attachments.length > 0) && (
          <span className="shrink-0 rounded-full border border-border bg-surface-secondary px-2.5 py-1 text-xs font-semibold text-fg-secondary">
            {photos.length + attachments.length} items
          </span>
        )}
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      {!disabled && (
        <div className="rounded-lg border border-border bg-surface-secondary/30 p-3">
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="mb-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border px-4 py-8 text-center transition-colors hover:border-brand-400 hover:bg-surface"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-fg-muted">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            </div>
            <p className="text-sm font-semibold text-fg">{uploading ? 'Uploading...' : 'Drop files here, or click to browse'}</p>
            <p className="mt-1 text-xs text-fg-muted">Photos, drawings, PDFs, specs, emails, and notes · max 3 MB each</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-[120px_1fr_1fr_auto] sm:items-center">
            <select
              className="input-field py-1.5 text-xs"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option value="photo">Photo</option>
              <option value="drawing">Drawing</option>
              <option value="brochure">Brochure</option>
              <option value="link">Link</option>
              <option value="document">Document</option>
              <option value="spec">Spec</option>
            </select>
            <input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="input-field py-1.5 text-xs"
            />
            <input
              type="text"
              placeholder="Caption or filename"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="input-field py-1.5 text-xs"
            />
            <button
              type="button"
              onClick={addLink}
              disabled={!url.trim() || busy}
              className="btn-primary py-1.5 text-xs disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Add link'}
            </button>
          </div>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={uploadFromPicker} />
        </div>
      )}

      {photos.length === 0 && attachments.length === 0 ? (
        <p className="py-8 text-center text-xs text-fg-muted">No reference material attached yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p) => (
            <div key={p.url} className="group relative overflow-hidden rounded-lg border border-border bg-bg-subtle">
              {isImage(p) ? (
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(p)}
                  className="block h-32 w-full overflow-hidden bg-surface-secondary text-left"
                  title="View photo"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={p.caption || 'Reference photo'}
                    className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                  />
                </button>
              ) : (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-32 items-center justify-center text-xs text-brand-600 hover:underline"
                >
                  <LinkIcon className="mr-1.5 h-4 w-4" />
                  Open file
                </a>
              )}
              <div className="flex items-start gap-2 p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-fg">{p.caption || p.kind || 'Reference'}</p>
                  <p className="truncate text-[10px] text-fg-muted">{p.url.startsWith('data:') ? 'Uploaded photo' : p.url}</p>
                </div>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 text-fg-muted hover:text-brand-600"
                  title="Open"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removePhoto(p.url)}
                  disabled={removingUrl === p.url}
                  className="absolute right-1.5 top-1.5 rounded-md bg-bg/90 p-1 text-fg-muted opacity-0 transition-opacity hover:text-rose-600 group-hover:opacity-100"
                  title="Remove"
                >
                  {removingUrl === p.url ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          ))}
          {attachments.map((a, index) => (
            <a
              key={`${index}-${a.slice(0, 24)}`}
              href={a}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-border bg-bg-subtle p-3 hover:border-brand-300"
            >
              {a.startsWith('data:image') ? (
                <ImagePlus className="h-4 w-4 flex-shrink-0 text-fg-muted" />
              ) : a.startsWith('data:') ? (
                <FileText className="h-4 w-4 flex-shrink-0 text-fg-muted" />
              ) : (
                <Paperclip className="h-4 w-4 flex-shrink-0 text-fg-muted" />
              )}
              <span className="truncate text-xs text-fg-secondary">
                {a.startsWith('data:') ? `Saved intake attachment ${index + 1}` : a}
              </span>
            </a>
          ))}
        </div>
      )}

      {selectedPhoto && (
        <Modal title={selectedPhoto.caption || 'Reference photo'} onClose={() => setSelectedPhoto(null)} size="xl">
          <div className="space-y-3">
            <div className="overflow-hidden rounded-lg border border-border bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption || 'Reference photo'}
                className="max-h-[70vh] w-full object-contain"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-xs text-fg-muted">
                {selectedPhoto.url.startsWith('data:') ? 'Uploaded photo' : selectedPhoto.url}
              </p>
              <button type="button" onClick={() => setSelectedPhoto(null)} className="btn-secondary">
                <X className="h-4 w-4" />
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

'use client';

import { useRef, useState } from 'react';
import { AlertCircle, FileSpreadsheet, Upload, X } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { api } from '@/lib/api';

type ImportRowError = { row: number; name: string; reason: string };
type ImportResult = { created: number; skipped: number; errors: ImportRowError[] };

const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  onClose: () => void;
  onImported: () => void;
}

export function ImportCustomersModal({ onClose, onImported }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    const ext = `.${f.name.split('.').pop()?.toLowerCase() ?? ''}`;
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setError('Please upload a .csv, .xlsx, or .xls file.');
      return;
    }
    setError('');
    setResult(null);
    setFile(f);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.postForm<ImportResult>('/customers/import', formData);
      setResult(res);
      if (res.created > 0) onImported();
    } catch (err: any) {
      setError(err.message || 'Import failed. Please check your file and try again.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal title="Import Customers" onClose={onClose} size="lg">
      <div className="space-y-5 p-1">
        {/* Drop zone — hidden once results are shown */}
        {!result && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={[
              'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 transition-colors',
              dragging
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20'
                : 'border-border hover:border-brand-400 hover:bg-surface-secondary',
            ].join(' ')}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
            />

            {file ? (
              <>
                <FileSpreadsheet className="h-10 w-10 text-brand-500" />
                <div className="text-center">
                  <p className="font-semibold text-fg">{file.name}</p>
                  <p className="mt-0.5 text-sm text-fg-muted">{formatBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setError(''); }}
                  className="btn-ghost px-3 py-1.5 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove file
                </button>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-fg-muted" />
                <div className="text-center">
                  <p className="font-semibold text-fg">Drop a file here, or click to browse</p>
                  <p className="mt-0.5 text-sm text-fg-muted">Accepts .csv, .xlsx, .xls — max 10 MB</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">Created</p>
                <p className="mt-1 text-3xl font-bold text-green-700 dark:text-green-400">{result.created}</p>
                <p className="mt-0.5 text-xs text-green-600 dark:text-green-500">
                  {result.created === 1 ? 'customer added' : 'customers added'}
                </p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">Skipped</p>
                <p className="mt-1 text-3xl font-bold text-amber-700 dark:text-amber-400">{result.skipped}</p>
                <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-500">
                  {result.skipped === 1 ? 'row had issues' : 'rows had issues'}
                </p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-fg">Row-level issues ({result.errors.length})</p>
                <div className="max-h-52 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                  {result.errors.map((e, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-fg">
                          Row {e.row}
                          {e.name && e.name !== '—' ? ` · ${e.name}` : ''}
                        </p>
                        <p className="mt-0.5 text-xs text-fg-muted">{e.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.created === 0 && result.skipped === 0 && (
              <p className="text-sm text-fg-secondary">
                The file appeared to be empty or contained no data rows. Make sure the first row is the header.
              </p>
            )}

            <button
              type="button"
              onClick={() => { setResult(null); setFile(null); }}
              className="btn-ghost text-sm"
            >
              Import another file
            </button>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onClose} className="btn-ghost">
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="btn-primary"
            >
              {importing ? 'Importing…' : 'Import Customers'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

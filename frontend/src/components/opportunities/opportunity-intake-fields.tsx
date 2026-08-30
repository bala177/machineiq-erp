'use client';

import { useRef, useState } from 'react';
import { clsx } from 'clsx';
import {
  ChevronDown,
  ChevronUp,
  Check,
  Sparkles,
  Wrench,
  FileText,
  Plus,
  Paperclip,
  X,
  Upload,
  Image as ImageIcon,
  Layers,
  Table2,
  ExternalLink,
} from 'lucide-react';
import { CustomerRecord, formatCustomerSelectLabel } from '@/lib/customers';
import {
  ExistingMachineCheck,
  OpportunityIntakeFieldErrors,
  OpportunityIntakeFormValues,
} from '@/lib/opportunities';
import { VERTICAL_OPTIONS as VERTICALS, MACHINES_BY_VERTICAL } from '@/lib/macpro-catalog';
import { ExistingMachineChecklist } from './existing-machine-checklist';
import { Modal } from '@/components/ui/modal';

/* ─── Macpro Automation constants ─────────────────────────────────────────── */

const BUILD_TYPES = [
  { value: 'new',      label: 'New Build' },
  { value: 'retrofit', label: 'Retrofit' },
  { value: 'upgrade',  label: 'Upgrade' },
  { value: 'clone',    label: 'Clone' },
];

const QUANTITIES = [
  { value: '1',      label: '1' },
  { value: '2',      label: '2' },
  { value: '3_5',    label: '3–5' },
  { value: '5_plus', label: '5+' },
];

const INQUIRY_SOURCES = [
  { value: 'rfq',        label: 'RFQ' },
  { value: 'email',      label: 'Email' },
  { value: 'site_visit', label: 'Site Visit' },
  { value: 'phone',      label: 'Phone' },
  { value: 'reference',  label: 'Reference' },
  { value: 'repeat',     label: 'Repeat Order' },
];

const PRIORITY_OPTIONS = [
  { value: 'low',      label: 'Low' },
  { value: 'medium',   label: 'Medium' },
  { value: 'high',     label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const COMPONENT_MATERIALS = [
  { value: 'al_casting', label: 'Al Casting' },
  { value: 'cast_iron',  label: 'Cast Iron' },
  { value: 'plastic',    label: 'Plastic' },
  { value: 'rubber',     label: 'Rubber' },
  { value: 'steel',      label: 'Steel' },
  { value: 'other',      label: 'Other' },
];

const TARGET_INDUSTRIES = [
  { value: 'automotive',     label: 'Automotive' },
  { value: 'foundry',        label: 'Foundry' },
  { value: 'plastic_rubber', label: 'Plastic/Rubber' },
  { value: 'general_eng',    label: 'General Engg.' },
  { value: 'other',          label: 'Other' },
];

const ENVIRONMENTS = [
  { value: 'normal',  label: 'Normal' },
  { value: 'dust',    label: 'Dusty' },
  { value: 'wet',     label: 'Wet/Wash' },
  { value: 'hot',     label: 'High Temp' },
  { value: 'clean',   label: 'Cleanroom' },
];

const AUTOMATION_LEVELS = [
  { value: 'manual',     label: 'Manual' },
  { value: 'semi_auto',  label: 'Semi-Auto' },
  { value: 'fully_auto', label: 'Fully Auto' },
];

const BUDGET_OPTIONS = [
  { value: 'lt_5L',    label: '< ₹5L' },
  { value: '5_10L',    label: '₹5–10L' },
  { value: '10_25L',   label: '₹10–25L' },
  { value: '25_50L',   label: '₹25–50L' },
  { value: '50L_plus', label: '₹50L+' },
  { value: 'open',     label: 'Open' },
];

const SITE_VISIT_OPTIONS = [
  { value: 'yes',     label: 'Done' },
  { value: 'planned', label: 'Planned' },
  { value: 'no',      label: 'Not Required' },
];

const DRAWING_STATUS_OPTIONS = [
  { value: 'yes',     label: 'Available' },
  { value: 'pending', label: 'Pending' },
  { value: 'no',      label: 'None' },
];

function getCriticalSpecLabel(vertical: string): string {
  switch (vertical) {
    case 'foundry':      return 'Key target (cycle time, temp, pressure)';
    case 'machine_shop': return 'Key target (cycle time, throughput, tolerance)';
    case 'spm':          return 'Key target (leak rate, test pressure, cycle time)';
    case 'fabrication':  return 'Key target (tolerance, flatness, accuracy)';
    default:             return 'Key performance / accuracy target';
  }
}

/* ─── reusable small components ────────────────────────────────────────────── */

export type TemplateChecklistItem = { label: string; hint?: string; required?: boolean };

function Field({
  label,
  required,
  error,
  children,
  id,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-fg-secondary">
        {label}
        {required && <span className="ml-0.5 text-red-500"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Pill({
  active,
  onClick,
  disabled,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'rounded-xl border px-3 py-2 text-sm font-medium transition-all',
        active
          ? 'border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-600 dark:bg-brand-950/30 dark:text-brand-300'
          : 'border-border bg-surface text-fg-secondary hover:border-border-strong hover:bg-surface-secondary',
        className,
      )}
    >
      {children}
    </button>
  );
}

function Section({
  icon: Icon,
  title,
  subtitle,
  defaultOpen = true,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">{title}</p>
          {subtitle && <p className="mt-0.5 text-xs text-fg-muted">{subtitle}</p>}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-fg-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-fg-muted" />
        )}
      </button>
      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── AttachmentBoard ────────────────────────────────────────────────────────── */

type AttachmentFile = { name: string; dataUrl: string };
const ATTACHMENT_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt',
  'dwg', 'dxf', 'step', 'stp', 'iges', 'eml', 'msg',
]);

function getFileType(f: AttachmentFile): {
  label: string; textColor: string; bgColor: string; Icon: React.ElementType;
} {
  const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
  if (f.dataUrl.startsWith('data:image'))
    return { label: 'Photo',       textColor: 'text-indigo-600', bgColor: 'bg-indigo-50  dark:bg-indigo-950/20',  Icon: ImageIcon };
  if (['dwg','dxf','step','stp','iges'].includes(ext))
    return { label: 'Drawing',     textColor: 'text-cyan-700',   bgColor: 'bg-cyan-50    dark:bg-cyan-950/20',    Icon: Layers };
  if (['xls','xlsx','csv'].includes(ext))
    return { label: 'Spreadsheet', textColor: 'text-emerald-700',bgColor: 'bg-emerald-50 dark:bg-emerald-950/20', Icon: Table2 };
  if (ext === 'pdf')
    return { label: 'PDF',         textColor: 'text-rose-700',   bgColor: 'bg-rose-50    dark:bg-rose-950/20',    Icon: FileText };
  if (['doc','docx'].includes(ext))
    return { label: 'Document',    textColor: 'text-blue-700',   bgColor: 'bg-blue-50    dark:bg-blue-950/20',    Icon: FileText };
  if (ext === 'txt')
    return { label: 'Notes',       textColor: 'text-amber-700',  bgColor: 'bg-amber-50   dark:bg-amber-950/20',   Icon: FileText };
  if (['eml','msg'].includes(ext))
    return { label: 'Email',       textColor: 'text-violet-700', bgColor: 'bg-violet-50  dark:bg-violet-950/20',  Icon: FileText };
  return     { label: 'File',        textColor: 'text-slate-500',  bgColor: 'bg-slate-50   dark:bg-slate-900/30',   Icon: Paperclip };
}

export function AttachmentBoard({
  files,
  onChange,
  disabled,
}: {
  files: AttachmentFile[];
  onChange: (next: AttachmentFile[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError]       = useState('');
  const [selectedFile, setSelectedFile] = useState<AttachmentFile | null>(null);
  const canAdd = !disabled && files.length < 5;

  function readFiles(picked: File[]) {
    setError('');
    const remaining = 5 - files.length;
    let skippedLarge = false;
    let skippedType = false;
    const eligible = picked.slice(0, remaining).filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      if (!ATTACHMENT_EXTENSIONS.has(ext)) { skippedType = true; return false; }
      if (f.size > 3 * 1024 * 1024) { skippedLarge = true; return false; }
      return true;
    });
    if (skippedLarge && skippedType) setError('Some files were skipped because the type is unsupported or the file exceeds 3 MB.');
    else if (skippedLarge) setError('One or more files exceed 3 MB and were skipped.');
    else if (skippedType) setError('One or more unsupported file types were skipped.');
    if (!eligible.length) return;
    Promise.all(
      eligible.map(
        (file) =>
          new Promise<AttachmentFile>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ name: file.name, dataUrl: reader.result as string });
            reader.readAsDataURL(file);
          }),
      ),
    ).then((added) => onChange([...files, ...added]));
    if (inputRef.current) inputRef.current.value = '';
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!canAdd) return;
    readFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="space-y-4">
      {/* ── drop zone ── */}
      {canAdd && (
        <div
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={clsx(
            'flex cursor-pointer select-none flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all',
            dragging
              ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/20'
              : 'border-border hover:border-brand-400 hover:bg-surface-secondary/40',
          )}
        >
          <div
            className={clsx(
              'flex h-12 w-12 items-center justify-center rounded-xl transition-colors',
              dragging
                ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400'
                : 'bg-surface-secondary text-fg-muted',
            )}
          >
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <p className={clsx('text-sm font-semibold', dragging ? 'text-brand-700 dark:text-brand-300' : 'text-fg')}>
              {dragging ? 'Release to attach' : 'Drop files here, or click to browse'}
            </p>
            <p className="mt-1 text-xs text-fg-muted">
              Photos &nbsp;·&nbsp; Drawings (DWG/DXF) &nbsp;·&nbsp; PDFs &nbsp;·&nbsp; Specs &nbsp;·&nbsp; Emails &nbsp;·&nbsp; Notes
            </p>
            <p className="mt-0.5 text-[11px] text-fg-muted">Up to 5 files &nbsp;·&nbsp; max 3 MB each</p>
          </div>
          {files.length > 0 && (
            <span className="rounded-full border border-border bg-surface px-3 py-0.5 text-xs font-semibold text-fg-secondary">
              {files.length} / 5 attached
            </span>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        onChange={(e) => { readFiles(Array.from(e.target.files || [])); }}
      />

      {/* ── file card grid ── */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {files.map((f, i) => {
            const ft = getFileType(f);
            const isImage = f.dataUrl.startsWith('data:image');
            return (
              <div
                key={i}
                className="group relative overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md"
              >
                {/* preview */}
                <button
                  type="button"
                  onClick={() => setSelectedFile(f)}
                  className={clsx('flex h-28 w-full items-center justify-center overflow-hidden text-left', !isImage && ft.bgColor)}
                  title={isImage ? 'View image' : 'View file'}
                >
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.dataUrl} alt={f.name} className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" />
                  ) : (
                    <ft.Icon className={clsx('h-10 w-10', ft.textColor)} />
                  )}
                </button>
                {/* info bar */}
                <div className="flex items-start gap-2 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium leading-tight text-fg" title={f.name}>
                      {f.name}
                    </p>
                    <span className={clsx('text-[10px] font-bold uppercase tracking-wider', ft.textColor)}>
                      {ft.label}
                    </span>
                  </div>
                  <a
                    href={f.dataUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Open"
                    className="mt-0.5 shrink-0 text-fg-muted opacity-0 transition-opacity hover:text-brand-600 group-hover:opacity-100"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
                {/* remove button */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onChange(files.filter((_, j) => j !== i))}
                    title="Remove"
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-500 opacity-0 shadow transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:bg-slate-800/90"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          {/* add-more card */}
          {canAdd && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex min-h-[110px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-fg-muted transition-all hover:border-brand-400 hover:text-brand-600"
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs font-medium">Add more</span>
            </button>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
      {files.length === 5 && !disabled && (
        <p className="text-center text-[11px] text-fg-muted">5 files attached — remove one to add another.</p>
      )}

      {selectedFile && (
        <Modal title={selectedFile.name} onClose={() => setSelectedFile(null)} size="xl">
          <div className="space-y-3">
            {selectedFile.dataUrl.startsWith('data:image') ? (
              <div className="overflow-hidden rounded-lg border border-border bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedFile.dataUrl} alt={selectedFile.name} className="max-h-[70vh] w-full object-contain" />
              </div>
            ) : (
              <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface-secondary">
                {(() => {
                  const ft = getFileType(selectedFile);
                  return <ft.Icon className={clsx('h-12 w-12', ft.textColor)} />;
                })()}
                <p className="max-w-full truncate px-6 text-sm font-medium text-fg">{selectedFile.name}</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <a href={selectedFile.dataUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                <ExternalLink className="h-4 w-4" />
                Open
              </a>
              <button type="button" onClick={() => setSelectedFile(null)} className="btn-secondary">
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

/* ─── Props ─────────────────────────────────────────────────────────────────── */

interface Props {
  form: OpportunityIntakeFormValues;
  customers: CustomerRecord[];
  disabled?: boolean;
  saving?: boolean;
  errors?: OpportunityIntakeFieldErrors;
  showCustomerQuickAdd?: boolean;
  /** Kept for backward compatibility — not used in scrollable layout */
  activeStep?: 1 | 2 | 3;
  onOpenCustomerQuickAdd?: () => void;
  templateChecklist?: TemplateChecklistItem[];
  /** Attached files — persisted iteratively alongside the form */
  attachments?: Array<{ name: string; dataUrl: string }>;
  onAttachmentsChange?: (files: Array<{ name: string; dataUrl: string }>) => void;
  onChange: (field: keyof OpportunityIntakeFormValues, value: string) => void;
  onExistingChecksChange?: (next: ExistingMachineCheck[]) => void;
  onChecklistChange?: (responses: Array<{ label: string; response: string }>) => void;
  onDiscard?: () => void;
  /** When true the internal Save / Discard footer is suppressed — the parent owns the actions */
  hideFooter?: boolean;
}

/* ─── main component ─────────────────────────────────────────────────────────── */

export function OpportunityIntakeFields({
  form,
  customers,
  disabled = false,
  saving = false,
  errors = {},
  showCustomerQuickAdd = false,
  onOpenCustomerQuickAdd,
  templateChecklist,
  attachments = [],
  onAttachmentsChange,
  onChange,
  onExistingChecksChange,
  onChecklistChange,
  onDiscard,
  hideFooter = false,
}: Props) {
  const inp = (field: keyof OpportunityIntakeFormValues) =>
    clsx('input-field', errors[field] && 'border-red-300 focus:border-red-500 focus:ring-red-500/20');

  const machineOptions = form.machineVertical
    ? MACHINES_BY_VERTICAL[form.machineVertical] ?? []
    : Object.values(MACHINES_BY_VERTICAL).flat();

  function handleChecklistResponse(label: string, response: string) {
    const existing = form.checklistResponses.filter((r) => r.label !== label);
    onChecklistChange?.([...existing, { label, response }]);
  }

  return (
    <div className="space-y-4">

      {/* ── Section 1: Enquiry Basics ── */}
      <Section
        icon={FileText}
        title="Enquiry Basics"
        subtitle="Who is asking, how did it come in, and what priority is this?"
      >
        <div className="space-y-4">
          {/* Title */}
          <Field label="Request Title" required error={errors.title} id="title">
            <input
              id="title"
              className={inp('title')}
              value={form.title}
              onChange={(e) => onChange('title', e.target.value)}
              placeholder="e.g. Dry Leak Test Machine for Al Sump — Ashok Leyland"
              disabled={disabled}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Customer */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="customerId" className="text-sm font-medium text-fg-secondary">
                  Customer <span className="text-red-500">*</span>
                </label>
                {showCustomerQuickAdd && onOpenCustomerQuickAdd && (
                  <button
                    type="button"
                    onClick={onOpenCustomerQuickAdd}
                    disabled={disabled}
                    className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    <Plus className="h-3 w-3" /> New
                  </button>
                )}
              </div>
              <select
                id="customerId"
                className={inp('customerId')}
                value={form.customerId}
                onChange={(e) => onChange('customerId', e.target.value)}
                disabled={disabled}
              >
                <option value="">Select customer…</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {formatCustomerSelectLabel(c)}
                  </option>
                ))}
              </select>
              {errors.customerId && (
                <p className="mt-1 text-xs text-red-600">{errors.customerId}</p>
              )}
            </div>

            {/* Customer Contact */}
            <Field label="Customer Contact (name / phone)">
              <input
                id="customerContact"
                className="input-field"
                value={form.customerContact}
                onChange={(e) => onChange('customerContact', e.target.value)}
                placeholder="e.g. Mr. Kumar — Process Engg., +91 98765 43210"
                disabled={disabled}
              />
            </Field>
          </div>

          {/* Inquiry Source */}
          <Field label="How did this enquiry come in?">
            <div className="flex flex-wrap gap-2">
              {INQUIRY_SOURCES.map((opt) => (
                <Pill
                  key={opt.value}
                  active={form.inquirySource === opt.value}
                  onClick={() =>
                    onChange('inquirySource', form.inquirySource === opt.value ? '' : opt.value)
                  }
                  disabled={disabled}
                >
                  {opt.label}
                </Pill>
              ))}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Priority */}
            <Field label="Priority">
              <div className="flex gap-2">
                {PRIORITY_OPTIONS.map((opt) => (
                  <Pill
                    key={opt.value}
                    active={form.priority === opt.value}
                    onClick={() => onChange('priority', opt.value)}
                    disabled={disabled}
                    className="flex-1"
                  >
                    {opt.label}
                  </Pill>
                ))}
              </div>
            </Field>

            {/* Internal Owner */}
            <Field label="Internal Sales / Owner">
              <input
                id="internalOwner"
                className="input-field"
                value={form.internalOwner}
                onChange={(e) => onChange('internalOwner', e.target.value)}
                placeholder="e.g. Ravi S. — Sales Engineer"
                disabled={disabled}
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 2: Machine Required ── */}
      <Section
        icon={Sparkles}
        title="Machine Required"
        subtitle="New build or existing machine? Which vertical, type, and how many?"
      >
        <div className="space-y-5">
          {/* New / Existing cards */}
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                id: 'new' as const,
                title: 'New Build',
                desc: 'Machine designed and built from scratch.',
                Icon: Sparkles,
              },
              {
                id: 'existing' as const,
                title: 'Existing Machine',
                desc: 'Modify, retrofit, upgrade, or clone a unit.',
                Icon: Wrench,
              },
            ].map(({ id, title, desc, Icon }) => {
              const active = form.machineCondition === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onChange('machineCondition', id)}
                  disabled={disabled}
                  className={clsx(
                    'flex items-start gap-3 rounded-xl border p-4 text-left transition-all',
                    active
                      ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-950/30'
                      : 'border-border bg-surface hover:border-border-strong hover:bg-surface-secondary',
                  )}
                >
                  <div
                    className={clsx(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      active
                        ? 'bg-brand-600 text-white'
                        : 'bg-surface-secondary text-fg-secondary',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p
                      className={clsx(
                        'text-sm font-semibold',
                        active ? 'text-brand-800 dark:text-brand-200' : 'text-fg',
                      )}
                    >
                      {title}
                    </p>
                    <p className="mt-0.5 text-xs text-fg-secondary">{desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Existing machine checklist — inline */}
          {form.machineCondition === 'existing' && onExistingChecksChange && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-800/30 dark:bg-amber-950/10">
              <ExistingMachineChecklist
                value={form.existingMachineChecks}
                onChange={onExistingChecksChange}
                disabled={disabled}
              />
            </div>
          )}

          {/* Product Vertical */}
          <Field label="Product Vertical">
            <div className="flex flex-wrap gap-2">
              {VERTICALS.map((opt) => (
                <Pill
                  key={opt.value}
                  active={form.machineVertical === opt.value}
                  onClick={() => {
                    const next = form.machineVertical === opt.value ? '' : opt.value;
                    onChange('machineVertical', next);
                    // clear machine type when vertical changes
                    onChange('machineCategory', '');
                  }}
                  disabled={disabled}
                  className="px-5"
                >
                  {opt.label}
                </Pill>
              ))}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Machine Type — filtered by vertical */}
            <Field label="Machine Type">
              <select
                id="machineCategory"
                className="input-field"
                value={form.machineCategory}
                onChange={(e) => onChange('machineCategory', e.target.value)}
                disabled={disabled}
              >
                <option value="">
                  {form.machineVertical ? 'Select machine type…' : 'Select a vertical first…'}
                </option>
                {machineOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>

            {/* Build Type */}
            <Field label="Build Type">
              <div className="flex flex-wrap gap-2">
                {BUILD_TYPES.map((opt) => (
                  <Pill
                    key={opt.value}
                    active={form.buildType === opt.value}
                    onClick={() => onChange('buildType', opt.value)}
                    disabled={disabled}
                    className="flex-1"
                  >
                    {opt.label}
                  </Pill>
                ))}
              </div>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Quantity */}
            <Field label="Quantity Required">
              <div className="flex gap-2">
                {QUANTITIES.map((opt) => (
                  <Pill
                    key={opt.value}
                    active={form.quantity === opt.value}
                    onClick={() =>
                      onChange('quantity', form.quantity === opt.value ? '' : opt.value)
                    }
                    disabled={disabled}
                    className="flex-1"
                  >
                    {opt.label}
                  </Pill>
                ))}
              </div>
            </Field>

            {/* Automation Level */}
            <Field label="Automation Level">
              <div className="flex gap-2">
                {AUTOMATION_LEVELS.map((opt) => (
                  <Pill
                    key={opt.value}
                    active={form.automationLevel === opt.value}
                    onClick={() =>
                      onChange(
                        'automationLevel',
                        form.automationLevel === opt.value ? '' : opt.value,
                      )
                    }
                    disabled={disabled}
                    className="flex-1"
                  >
                    {opt.label}
                  </Pill>
                ))}
              </div>
            </Field>
          </div>

          {/* One-line machine purpose */}
          <Field label="One-line purpose (optional)">
            <input
              id="machinePurpose"
              className="input-field"
              value={form.machinePurpose}
              onChange={(e) => onChange('machinePurpose', e.target.value)}
              placeholder="e.g. Test leak-tightness of Al sump at 1.5 bar dry-air, 50 pph, 2-cavity"
              disabled={disabled}
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 3: Component / Part to Process ── */}
      <Section
        icon={Wrench}
        title="Component / Part to Process"
        subtitle="What is being processed — material, size, industry, drawing availability?"
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Object / Part Type */}
            <Field label="Part / Component Name">
              <input
                id="objectType"
                className="input-field"
                value={form.objectType}
                onChange={(e) => onChange('objectType', e.target.value)}
                placeholder="e.g. Aluminium sump, cylinder head, pump housing"
                disabled={disabled}
              />
            </Field>

            {/* Industry */}
            <Field label="End-use Industry">
              <div className="flex flex-wrap gap-2">
                {TARGET_INDUSTRIES.map((opt) => (
                  <Pill
                    key={opt.value}
                    active={form.targetIndustry === opt.value}
                    onClick={() =>
                      onChange(
                        'targetIndustry',
                        form.targetIndustry === opt.value ? '' : opt.value,
                      )
                    }
                    disabled={disabled}
                  >
                    {opt.label}
                  </Pill>
                ))}
              </div>
            </Field>
          </div>

          {/* Material */}
          <Field label="Component Material">
            <div className="flex flex-wrap gap-2">
              {COMPONENT_MATERIALS.map((opt) => (
                <Pill
                  key={opt.value}
                  active={form.componentMaterial === opt.value}
                  onClick={() =>
                    onChange(
                      'componentMaterial',
                      form.componentMaterial === opt.value ? '' : opt.value,
                    )
                  }
                  disabled={disabled}
                >
                  {opt.label}
                </Pill>
              ))}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Size Range */}
            <Field label="Size (L × W × H, optional)">
              <input
                id="sizeRange"
                className="input-field"
                value={form.sizeRange}
                onChange={(e) => onChange('sizeRange', e.target.value)}
                placeholder="e.g. 280 × 180 × 120 mm"
                disabled={disabled}
              />
            </Field>

            {/* Weight Range */}
            <Field label="Weight (optional)">
              <input
                id="weightRange"
                className="input-field"
                value={form.weightRange}
                onChange={(e) => onChange('weightRange', e.target.value)}
                placeholder="e.g. 1.5 – 4 kg"
                disabled={disabled}
              />
            </Field>

            {/* Drawing Status */}
            <Field label="Customer Drawing / Sample">
              <div className="flex flex-wrap gap-2">
                {DRAWING_STATUS_OPTIONS.map((opt) => (
                  <Pill
                    key={opt.value}
                    active={form.customerDrawingStatus === opt.value}
                    onClick={() =>
                      onChange(
                        'customerDrawingStatus',
                        form.customerDrawingStatus === opt.value ? '' : opt.value,
                      )
                    }
                    disabled={disabled}
                    className="flex-1"
                  >
                    {opt.label}
                  </Pill>
                ))}
              </div>
            </Field>
          </div>

        </div>
      </Section>

      {/* ── Section 4: Process & Output ── */}
      <Section
        icon={Check}
        title="Process & Output"
        subtitle="Target throughput, key performance spec, and open questions."
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Target Output */}
            <Field label="Target Output / Cycle Time" required error={errors.targetOutput} id="targetOutput">
              <input
                id="targetOutput"
                className={inp('targetOutput')}
                value={form.targetOutput}
                onChange={(e) => onChange('targetOutput', e.target.value)}
                placeholder="e.g. 50 pph, 30 s cycle, 2-cavity"
                disabled={disabled}
              />
            </Field>

            {/* Critical Spec — adaptive label */}
            <Field label={getCriticalSpecLabel(form.machineVertical)}>
              <input
                id="criticalSpec"
                className="input-field"
                value={form.criticalSpec}
                onChange={(e) => onChange('criticalSpec', e.target.value)}
                placeholder="e.g. Leak rate < 5 cc/min at 1.5 bar; die temp ±2°C"
                disabled={disabled}
              />
            </Field>
          </div>

          {/* Process Notes */}
          <Field label="Process sequence / open questions (optional)">
            <textarea
              id="processSummary"
              className="input-field min-h-[80px]"
              value={form.processSummary}
              onChange={(e) => onChange('processSummary', e.target.value)}
              placeholder="e.g. Load → fixture clamp → pressure fill → stabilise → leak test → stamp → unload; or list anything still unclear"
              disabled={disabled}
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 5: Site & Utilities ── */}
      <Section
        icon={Wrench}
        title="Site & Utilities"
        subtitle="Floor space, power supply, compressed air, and environment."
        defaultOpen={false}
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Floor Space */}
            <Field label="Available Floor Space (L × W)">
              <input
                id="availableSpace"
                className="input-field"
                value={form.availableSpace}
                onChange={(e) => onChange('availableSpace', e.target.value)}
                placeholder="e.g. 3000 × 2000 mm"
                disabled={disabled}
              />
            </Field>

            {/* Power */}
            <Field label="Power Supply Available">
              <input
                id="powerAvailable"
                className="input-field"
                value={form.powerAvailable}
                onChange={(e) => onChange('powerAvailable', e.target.value)}
                placeholder="e.g. 3-phase 415 V AC 50 Hz, 32 A"
                disabled={disabled}
              />
            </Field>

            {/* Compressed Air */}
            <Field label="Compressed Air (pressure / flow if known)">
              <input
                id="otherUtilities"
                className="input-field"
                value={form.otherUtilities}
                onChange={(e) => onChange('otherUtilities', e.target.value)}
                placeholder="e.g. 6 bar, 200 NLM; or cooling water 25°C 10 LPM"
                disabled={disabled}
              />
            </Field>

            {/* Environment */}
            <Field label="Shop Floor Environment">
              <div className="flex flex-wrap gap-2">
                {ENVIRONMENTS.map((opt) => (
                  <Pill
                    key={opt.value}
                    active={form.environment === opt.value}
                    onClick={() =>
                      onChange('environment', form.environment === opt.value ? '' : opt.value)
                    }
                    disabled={disabled}
                  >
                    {opt.label}
                  </Pill>
                ))}
              </div>
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 6: Commercial & Next Steps ── */}
      <Section
        icon={FileText}
        title="Commercial & Next Steps"
        subtitle="Budget range, required delivery date, and site visit status."
      >
        <div className="space-y-4">
          {/* Budget */}
          <Field label="Indicative Budget (INR)">
            <div className="flex flex-wrap gap-2">
              {BUDGET_OPTIONS.map((opt) => (
                <Pill
                  key={opt.value}
                  active={form.budgetRange === opt.value}
                  onClick={() =>
                    onChange('budgetRange', form.budgetRange === opt.value ? '' : opt.value)
                  }
                  disabled={disabled}
                  className="min-w-[80px]"
                >
                  {opt.label}
                </Pill>
              ))}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Delivery Date */}
            <Field
              label="Target Delivery Date"
              required
              error={errors.deliveryTargetDate}
              id="deliveryTargetDate"
            >
              <input
                id="deliveryTargetDate"
                type="date"
                className={inp('deliveryTargetDate')}
                value={form.deliveryTargetDate}
                onChange={(e) => onChange('deliveryTargetDate', e.target.value)}
                disabled={disabled}
              />
            </Field>

            {/* Site Visit Status */}
            <Field label="Site Visit Status">
              <div className="flex flex-wrap gap-2">
                {SITE_VISIT_OPTIONS.map((opt) => (
                  <Pill
                    key={opt.value}
                    active={form.siteVisitStatus === opt.value}
                    onClick={() =>
                      onChange(
                        'siteVisitStatus',
                        form.siteVisitStatus === opt.value ? '' : opt.value,
                      )
                    }
                    disabled={disabled}
                    className="flex-1"
                  >
                    {opt.label}
                  </Pill>
                ))}
              </div>
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Template Checklist (when a template is selected) ── */}
      {templateChecklist && templateChecklist.length > 0 && (
        <div className="rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-5 py-4">
            <p className="text-sm font-semibold text-fg">Template Specification Checklist</p>
            <p className="mt-0.5 text-xs text-fg-muted">
              Answer each item to help engineering accurately scope this machine request. Required items (
              <span className="text-red-500">*</span>) must be completed before submission.
            </p>
          </div>
          <div className="space-y-4 px-5 pb-5 pt-4">
            {templateChecklist.map((item, idx) => {
              const current =
                form.checklistResponses.find((r) => r.label === item.label)?.response || '';
              const answered = current.trim().length > 0;
              return (
                <div
                  key={idx}
                  className={clsx(
                    'rounded-xl border p-4 transition-colors',
                    answered
                      ? 'border-green-200 bg-green-50/40 dark:border-green-800/30 dark:bg-green-950/10'
                      : 'border-border bg-surface',
                  )}
                >
                  <div className="mb-2 flex items-start gap-2">
                    <span
                      className={clsx(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                        answered
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                          : 'bg-surface-secondary text-fg-muted',
                      )}
                    >
                      {answered ? <Check className="h-3 w-3" /> : <span>{idx + 1}</span>}
                    </span>
                    <label className="text-sm font-semibold text-fg">
                      {item.label}
                      {item.required && <span className="ml-1 text-red-500">*</span>}
                    </label>
                  </div>
                  {item.hint && (
                    <p className="mb-2 ml-7 text-xs text-fg-muted">{item.hint}</p>
                  )}
                  <textarea
                    className="input-field ml-7 min-h-[72px] w-[calc(100%-1.75rem)] text-sm"
                    value={current}
                    onChange={(e) => handleChecklistResponse(item.label, e.target.value)}
                    placeholder={item.hint ? `e.g. ${item.hint}` : 'Enter your response…'}
                    disabled={disabled}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Footer actions ── */}
      {!hideFooter && (
        <div className="flex items-center justify-between pt-1">
          {onDiscard ? (
            <button
              type="button"
              onClick={onDiscard}
              disabled={disabled}
              className="rounded-lg px-4 py-2 text-sm font-medium text-fg-secondary transition-all hover:bg-surface-secondary hover:text-fg"
            >
              Discard
            </button>
          ) : (
            <div />
          )}
          <button
            type="submit"
            disabled={saving || disabled}
            className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Request'}
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Check, ChevronDown, ChevronRight, ClipboardList, Pencil, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { api } from '@/lib/api';
import { getMachineChecklist, MacproChecklistItem } from '@/lib/macpro-catalog';
import { Modal } from '@/components/ui/modal';
import {
  CircuitTableEditor,
  getFilledCircuitRows,
  hasCircuitRows,
} from '@/components/opportunities/circuit-table-editor';

// ── Types ──────────────────────────────────────────────────────────────────────

type ChecklistResponse = { label: string; response: string };

function isChecklistResponseAnswered(item: MacproChecklistItem, response: string): boolean {
  return (item.type ?? 'textarea') === 'circuit_table'
    ? hasCircuitRows(response)
    : response.trim().length > 0;
}

function formatChecklistDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return value.trim();
  const [, year, month, day] = match;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))));
}

// ── Read-only value renderer ───────────────────────────────────────────────────

function ValueDisplay({ item, response }: { item: MacproChecklistItem; response: string }) {
  const type = item.type ?? 'textarea';
  const trimmed = response.trim();

  if (!trimmed) {
    return <span className="text-xs italic text-fg-muted">No answer yet</span>;
  }

  if (type === 'select_one') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 border border-brand-200 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-950/30 dark:border-brand-800/40 dark:text-brand-300">
        <Check className="h-2.5 w-2.5" />
        {trimmed}
      </span>
    );
  }

  if (type === 'select_many') {
    const vals = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    return (
      <div className="flex flex-wrap gap-1.5">
        {vals.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 border border-brand-200 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-950/30 dark:border-brand-800/40 dark:text-brand-300"
          >
            <Check className="h-2.5 w-2.5" />
            {v}
          </span>
        ))}
      </div>
    );
  }

  if (type === 'number') {
    return (
      <span className="text-sm font-semibold text-fg tabular-nums">
        {trimmed}
        {item.unit && <span className="ml-1.5 text-xs font-normal text-fg-muted">{item.unit}</span>}
      </span>
    );
  }

  if (type === 'date') {
    return <span className="text-sm font-semibold text-fg">{formatChecklistDate(trimmed)}</span>;
  }

  if (type === 'circuit_table') {
    const rows = getFilledCircuitRows(response);
    if (!rows.length) {
      return <span className="text-xs italic text-fg-muted">No circuits entered</span>;
    }
    return (
      <table className="mt-1 w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="pb-1 pr-4 text-left font-medium text-fg-muted">Circuit</th>
            <th className="pb-1 text-left font-medium text-fg-muted">Pressure (Kg/sqcm)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0">
              <td className="py-1 pr-4 text-fg">{r.name || '—'}</td>
              <td className="py-1 font-mono text-fg">{r.pressure || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return <p className="text-sm text-fg leading-relaxed">{trimmed}</p>;
}

// ── Edit field (inside modal) ──────────────────────────────────────────────────

function EditField({
  item,
  idx,
  response,
  onChange,
}: {
  item: MacproChecklistItem;
  idx: number;
  response: string;
  onChange: (label: string, value: string) => void;
}) {
  const type = item.type ?? 'textarea';
  const answered = isChecklistResponseAnswered(item, response);

  const labelEl = (
    <div className="flex items-start gap-2 mb-2">
      <span
        className={clsx(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
          answered
            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
            : 'bg-surface text-fg-muted border border-border',
        )}
      >
        {answered ? <Check className="h-3 w-3" /> : <span>{idx + 1}</span>}
      </span>
      <div className="min-w-0 flex-1">
        <span className="text-xs font-semibold text-fg">
          {item.label}
          {item.required && <span className="ml-1 text-red-500">*</span>}
        </span>
        {item.hint && type !== 'select_one' && type !== 'select_many' && (
          <p className="mt-0.5 text-[11px] text-fg-muted leading-relaxed">{item.hint}</p>
        )}
      </div>
    </div>
  );

  const wrap = (extra?: string) =>
    clsx(
      'rounded-xl border p-3 transition-colors',
      answered
        ? 'border-green-200 bg-green-50/40 dark:border-green-800/30 dark:bg-green-950/10'
        : 'border-border bg-surface-secondary/40',
      extra,
    );

  if (type === 'select_one') {
    const selected = response.trim();
    return (
      <div className={wrap()}>
        {labelEl}
        <div className="flex flex-wrap gap-1.5 pl-7">
          {(item.options ?? []).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(item.label, selected === opt ? '' : opt)}
              className={clsx(
                'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                selected === opt
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : 'border-border bg-surface text-fg-secondary hover:border-brand-400 hover:text-brand-600',
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'select_many') {
    const selected = response ? response.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const toggle = (opt: string) => {
      const next = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt];
      onChange(item.label, next.join(','));
    };
    return (
      <div className={wrap()}>
        {labelEl}
        <div className="flex flex-wrap gap-1.5 pl-7">
          {(item.options ?? []).map((opt) => {
            const isOn = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className={clsx(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all',
                  isOn
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-border bg-surface text-fg-secondary hover:border-brand-400 hover:text-brand-600',
                )}
              >
                {isOn && <Check className="h-3 w-3" />}
                {opt}
              </button>
            );
          })}
        </div>
        {item.hint && <p className="mt-1.5 pl-7 text-[11px] text-fg-muted">{item.hint}</p>}
      </div>
    );
  }

  if (type === 'number') {
    return (
      <div className={wrap()}>
        {labelEl}
        <div className="pl-7 flex items-center gap-2">
          <input
            type="number"
            value={response}
            onChange={(e) => onChange(item.label, e.target.value)}
            placeholder="0"
            className="input-field w-32 text-sm"
          />
          {item.unit && <span className="text-xs font-medium text-fg-muted">{item.unit}</span>}
        </div>
      </div>
    );
  }

  if (type === 'date') {
    return (
      <div className={wrap()}>
        {labelEl}
        <div className="pl-7">
          <input
            type="date"
            value={response}
            onChange={(e) => onChange(item.label, e.target.value)}
            className="input-field text-sm"
          />
        </div>
      </div>
    );
  }

  if (type === 'text') {
    return (
      <div className={wrap()}>
        {labelEl}
        <div className="pl-7">
          <input
            type="text"
            value={response}
            onChange={(e) => onChange(item.label, e.target.value)}
            placeholder={item.hint ?? ''}
            className="input-field text-sm"
          />
        </div>
      </div>
    );
  }

  if (type === 'circuit_table') {
    return (
      <div className={wrap('col-span-full')}>
        {labelEl}
        <div className="pl-7">
          <CircuitTableEditor
            response={response}
            onChange={(value) => onChange(item.label, value)}
          />
        </div>
      </div>
    );
  }

  // Default: textarea
  return (
    <div className={wrap()}>
      {labelEl}
      <textarea
        value={response}
        onChange={(e) => onChange(item.label, e.target.value)}
        placeholder="Enter answer…"
        rows={3}
        className="input-field mt-0.5 resize-y text-sm ml-7 w-[calc(100%-1.75rem)]"
      />
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

type Props = {
  opportunityId: string;
  checklistResponses: ChecklistResponse[];
  machineCategory?: string;
  machineVertical?: string;
  isLocked?: boolean;
  onUpdated: (updated: ChecklistResponse[]) => void;
};

type SectionGroup = {
  name: string;
  items: { schema: MacproChecklistItem; response: string }[];
};

export function MachineChecklistCard({
  opportunityId,
  checklistResponses,
  machineCategory,
  machineVertical,
  isLocked,
  onUpdated,
}: Props) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<ChecklistResponse[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // ── Build section groups ───────────────────────────────────────────────────

  const schema = getMachineChecklist(machineVertical, machineCategory);
  const responseMap = new Map(checklistResponses.map((r) => [r.label, r.response ?? '']));
  const schemaByLabel = new Map(schema.map((item) => [item.label, item]));

  const sections: SectionGroup[] = [];
  for (const item of schema) {
    const sName = item.section ?? 'General';
    let group = sections.find((s) => s.name === sName);
    if (!group) {
      group = { name: sName, items: [] };
      sections.push(group);
    }
    group.items.push({ schema: item, response: responseMap.get(item.label) ?? '' });
  }

  // Catch-all for legacy / unknown labels
  const knownLabels = new Set(schema.map((i) => i.label));
  const unknown = checklistResponses.filter((r) => !knownLabels.has(r.label));
  if (unknown.length > 0) {
    sections.push({
      name: 'Other',
      items: unknown.map((r) => ({
        schema: { label: r.label } as MacproChecklistItem,
        response: r.response ?? '',
      })),
    });
  }

  const totalCount = checklistResponses.length;
  const answeredCount = checklistResponses.filter((response) =>
    isChecklistResponseAnswered(
      schemaByLabel.get(response.label) ?? ({ label: response.label } as MacproChecklistItem),
      response.response ?? '',
    ),
  ).length;
  const progressPct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  // ── Section toggle ─────────────────────────────────────────────────────────

  const toggleSection = (name: string) =>
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  // ── Edit modal handlers ────────────────────────────────────────────────────

  const openEdit = () => {
    setDraft(checklistResponses.map((r) => ({ ...r })));
    setSaveError('');
    setEditOpen(true);
  };

  const handleChange = (label: string, value: string) => {
    setDraft((prev) =>
      prev.map((r) => (r.label === label ? { ...r, response: value } : r)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const updated = await api.patch<any>(
        `/opportunities/${opportunityId}/intake`,
        { checklistResponses: draft },
      );
      onUpdated(updated.checklistResponses ?? draft);
      setEditOpen(false);
    } catch (err: any) {
      setSaveError(err.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Build edit modal section groups from draft ─────────────────────────────

  const draftMap = new Map(draft.map((r) => [r.label, r.response ?? '']));
  const editSections: SectionGroup[] = [];
  for (const item of schema) {
    const sName = item.section ?? 'General';
    let group = editSections.find((s) => s.name === sName);
    if (!group) {
      group = { name: sName, items: [] };
      editSections.push(group);
    }
    group.items.push({ schema: item, response: draftMap.get(item.label) ?? '' });
  }
  if (unknown.length > 0) {
    editSections.push({
      name: 'Other',
      items: unknown.map((r) => ({
        schema: { label: r.label } as MacproChecklistItem,
        response: draftMap.get(r.label) ?? '',
      })),
    });
  }

  // Global index for edit field numbering
  let fieldIdx = 0;

  return (
    <>
      {/* ── Card ────────────────────────────────────────────────────────── */}
      <div className="mb-5 rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-fg-muted" />
            <h2 className="text-sm font-semibold text-fg">Machine Checklist</h2>
            {machineCategory && (
              <span className="rounded-full bg-surface-secondary border border-border px-2 py-0.5 text-[11px] font-medium text-fg-muted">
                {machineCategory}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Progress */}
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 rounded-full bg-surface-tertiary overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-[11px] font-medium text-fg-muted tabular-nums">
                {answeredCount}/{totalCount}
              </span>
            </div>
            {!isLocked && (
              <button
                onClick={openEdit}
                className="btn-ghost flex items-center gap-1.5 px-2.5 py-1.5 text-xs"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Sections */}
        <div className="divide-y divide-border/60">
          {sections.map((section) => {
            const sectionAnswered = section.items.filter((item) =>
              isChecklistResponseAnswered(item.schema, item.response),
            ).length;
            const isOpen = !collapsedSections.has(section.name);

            return (
              <div key={section.name}>
                {/* Section header — clickable to expand/collapse */}
                <button
                  onClick={() => toggleSection(section.name)}
                  className="flex w-full items-center justify-between px-5 py-3 hover:bg-surface-secondary/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-fg-muted shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-fg-muted shrink-0" />
                    )}
                    <span className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                      {section.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Progress dots */}
                    {section.items.map((item, di) => (
                      <span
                        key={di}
                        className={clsx(
                          'h-1.5 w-1.5 rounded-full',
                          isChecklistResponseAnswered(item.schema, item.response)
                            ? 'bg-emerald-500'
                            : 'bg-border',
                        )}
                      />
                    ))}
                    <span className="ml-1 text-[11px] text-fg-muted tabular-nums">
                      {sectionAnswered}/{section.items.length}
                    </span>
                  </div>
                </button>

                {/* Section body */}
                {isOpen && (
                  <div className="grid gap-0 sm:grid-cols-2 px-5 pb-4 pt-1">
                    {section.items.map((item) => {
                      const answered = isChecklistResponseAnswered(item.schema, item.response);
                      const isWide = (item.schema.type ?? 'textarea') === 'circuit_table';
                      return (
                        <div
                          key={item.schema.label}
                          className={clsx(
                            'py-3 pr-4',
                            isWide && 'sm:col-span-2',
                            !isWide && 'border-b border-border/40 last:border-0 sm:last-of-type:border-0',
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className={clsx(
                                'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                                answered
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                  : 'bg-surface-secondary text-fg-muted border border-border/60',
                              )}
                            >
                              {answered && <Check className="h-2.5 w-2.5" />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-fg leading-snug mb-1">
                                {item.schema.label}
                              </p>
                              <ValueDisplay item={item.schema} response={item.response} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Edit modal ──────────────────────────────────────────────────── */}
      {editOpen && (
        <Modal
          title="Edit Machine Checklist"
          onClose={() => setEditOpen(false)}
          size="lg"
        >
          <div className="space-y-6">
            {editSections.map((section) => (
              <div key={section.name}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-muted border-b border-border pb-2">
                  {section.name}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item) => {
                    const currentIdx = fieldIdx++;
                    return (
                      <EditField
                        key={item.schema.label}
                        item={item.schema}
                        idx={currentIdx}
                        response={draftMap.get(item.schema.label) ?? item.response}
                        onChange={handleChange}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {saveError && (
              <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 dark:bg-red-950/20 dark:border-red-800/40 dark:text-red-400">
                {saveError}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="btn-ghost px-4 py-2 text-sm"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

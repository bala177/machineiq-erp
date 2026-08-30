'use client';

import { useMemo } from 'react';
import { clsx } from 'clsx';
import { Plus, X, Wrench } from 'lucide-react';
import { ExistingMachineCheck } from '@/lib/opportunities';

/**
 * Default assessment items shown for every existing-machine intake.
 * Users tick what is known and add a short note where useful.
 * They can also append custom rows with the "+ Add custom check" button.
 */
const STANDARD_EXISTING_MACHINE_CHECKS: string[] = [
  'Existing electrical drawings available',
  'Existing mechanical drawings available',
  'Existing PLC / HMI program available',
  'BOM / spare-parts list available',
  'Site survey / on-site visit completed',
  'Reason for modification documented',
  'Current cycle time measured',
  'Current downtime / failure modes captured',
  'Safety assessment of current state done',
  'Customer-supplied parts list confirmed',
  'Removal / shipment plan agreed',
  'Acceptance criteria for retrofit agreed',
];

interface Props {
  value: ExistingMachineCheck[];
  onChange: (next: ExistingMachineCheck[]) => void;
  disabled?: boolean;
}

export function ExistingMachineChecklist({ value, onChange, disabled = false }: Props) {
  // Build a stable working list: every standard item appears, then any custom items the user has added.
  // We key by item label so we don't lose user edits if the standard list ever changes order.
  const rows = useMemo(() => {
    const byLabel = new Map<string, ExistingMachineCheck>();
    value.forEach((c) => {
      if (c?.item) byLabel.set(c.item, c);
    });
    const standard = STANDARD_EXISTING_MACHINE_CHECKS.map(
      (label) => byLabel.get(label) ?? { item: label, checked: false, note: '' },
    );
    const standardLabels = new Set(STANDARD_EXISTING_MACHINE_CHECKS);
    const custom = value.filter((c) => c?.item && !standardLabels.has(c.item));
    return { standard, custom };
  }, [value]);

  const allRows = [...rows.standard, ...rows.custom];
  const tickedCount = allRows.filter((r) => r.checked).length;

  function updateRow(index: number, patch: Partial<ExistingMachineCheck>) {
    const next = allRows.map((r, i) => (i === index ? { ...r, ...patch } : r));
    onChange(next);
  }

  function addCustomCheck() {
    onChange([...allRows, { item: '', checked: false, note: '' }]);
  }

  function removeRow(index: number) {
    onChange(allRows.filter((_, i) => i !== index));
  }

  const standardCount = rows.standard.length;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-800/40 dark:bg-amber-950/15">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            <Wrench className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Existing machine assessment
            </p>
            <p className="mt-0.5 text-xs text-amber-800/80 dark:text-amber-300/80">
              Tick what is known about the existing machine. Add a short note where helpful.
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          {tickedCount} of {allRows.length} ticked
        </span>
      </div>

      <ul className="space-y-1.5">
        {allRows.map((row, idx) => {
          const isCustom = idx >= standardCount;
          return (
            <li
              key={idx}
              className={clsx(
                'flex items-start gap-3 rounded-lg border bg-surface px-3 py-2.5 transition-colors',
                row.checked
                  ? 'border-green-200 dark:border-green-800/40'
                  : 'border-border',
              )}
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-border text-brand-600 focus:ring-brand-500"
                checked={!!row.checked}
                disabled={disabled}
                onChange={(e) => updateRow(idx, { checked: e.target.checked })}
              />
              <div className="min-w-0 flex-1 space-y-1.5">
                {isCustom ? (
                  <input
                    type="text"
                    value={row.item}
                    onChange={(e) => updateRow(idx, { item: e.target.value })}
                    placeholder="Custom check (e.g. ISO certification on file)"
                    disabled={disabled}
                    className="input-field text-sm"
                  />
                ) : (
                  <p className="text-sm font-medium text-fg">{row.item}</p>
                )}
                <input
                  type="text"
                  value={row.note}
                  onChange={(e) => updateRow(idx, { note: e.target.value })}
                  placeholder="Optional note…"
                  disabled={disabled}
                  className="input-field text-xs"
                  maxLength={500}
                />
              </div>
              {isCustom && !disabled && (
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="mt-1 shrink-0 rounded-md p-1 text-fg-muted transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                  aria-label="Remove check"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {!disabled && (
        <button
          type="button"
          onClick={addCustomCheck}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50"
        >
          <Plus className="h-3.5 w-3.5" /> Add custom check
        </button>
      )}
    </div>
  );
}

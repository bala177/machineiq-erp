'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';

export const MAX_CIRCUIT_ROWS = 4;

export type CircuitRow = {
  name: string;
  pressure: string;
};

function isCircuitRowFilled(row: CircuitRow) {
  return row.name.trim().length > 0 || row.pressure.trim().length > 0;
}

export function parseCircuitTable(response: string): CircuitRow[] {
  if (!response.trim()) return [];

  return response
    .split('|')
    .slice(0, MAX_CIRCUIT_ROWS)
    .map((part) => {
      const separatorIndex = part.indexOf(':');
      if (separatorIndex === -1) {
        return { name: part, pressure: '' };
      }

      return {
        name: part.slice(0, separatorIndex),
        pressure: part.slice(separatorIndex + 1),
      };
    });
}

export function getFilledCircuitRows(response: string): CircuitRow[] {
  return parseCircuitTable(response).filter(isCircuitRowFilled);
}

export function encodeCircuitTable(rows: CircuitRow[]): string {
  return rows
    .filter(isCircuitRowFilled)
    .slice(0, MAX_CIRCUIT_ROWS)
    .map((row) => `${row.name}:${row.pressure}`)
    .join('|');
}

export function hasCircuitRows(response: string): boolean {
  return getFilledCircuitRows(response).length > 0;
}

function adjustEditingRowsAfterDelete(current: Set<number>, deletedIndex: number) {
  const next = new Set<number>();
  current.forEach((idx) => {
    if (idx < deletedIndex) next.add(idx);
    if (idx > deletedIndex) next.add(idx - 1);
  });
  return next;
}

type CircuitTableEditorProps = {
  response: string;
  onChange: (value: string) => void;
  className?: string;
};

export function CircuitTableEditor({
  response,
  onChange,
  className = '',
}: CircuitTableEditorProps) {
  const parsedRows = useMemo(() => getFilledCircuitRows(response), [response]);
  const [rows, setRows] = useState<CircuitRow[]>(parsedRows);
  const [editingRows, setEditingRows] = useState<Set<number>>(new Set());
  const lastCommitted = useRef(response);

  useEffect(() => {
    if (response === lastCommitted.current) return;

    setRows(getFilledCircuitRows(response));
    setEditingRows(new Set());
    lastCommitted.current = response;
  }, [response]);

  const commitRows = (nextRows: CircuitRow[]) => {
    const limitedRows = nextRows.slice(0, MAX_CIRCUIT_ROWS);
    const encoded = encodeCircuitTable(limitedRows);
    setRows(limitedRows);
    lastCommitted.current = encoded;
    onChange(encoded);
  };

  const addRow = () => {
    if (rows.length >= MAX_CIRCUIT_ROWS) return;

    const nextIndex = rows.length;
    setRows([...rows, { name: '', pressure: '' }]);
    setEditingRows((current) => {
      const next = new Set(current);
      next.add(nextIndex);
      return next;
    });
  };

  const updateRow = (rowIdx: number, field: keyof CircuitRow, value: string) => {
    const nextRows = rows.map((row, idx) =>
      idx === rowIdx ? { ...row, [field]: value } : row,
    );
    commitRows(nextRows);
  };

  const deleteRow = (rowIdx: number) => {
    commitRows(rows.filter((_, idx) => idx !== rowIdx));
    setEditingRows((current) => adjustEditingRowsAfterDelete(current, rowIdx));
  };

  const startEditing = (rowIdx: number) => {
    setEditingRows((current) => {
      const next = new Set(current);
      next.add(rowIdx);
      return next;
    });
  };

  const stopEditing = (rowIdx: number) => {
    if (rows[rowIdx] && !isCircuitRowFilled(rows[rowIdx])) {
      deleteRow(rowIdx);
      return;
    }

    setEditingRows((current) => {
      const next = new Set(current);
      next.delete(rowIdx);
      return next;
    });
  };

  const canAdd = rows.length < MAX_CIRCUIT_ROWS;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-fg-muted">
          {rows.length}/{MAX_CIRCUIT_ROWS} circuits
        </span>
        <button
          type="button"
          onClick={addRow}
          disabled={!canAdd}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-fg-secondary transition-colors hover:border-brand-400 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add circuit
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface/70 px-3 py-3 text-xs text-fg-muted">
          No circuits added yet.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, rowIdx) => {
            const isEditing = editingRows.has(rowIdx) || !isCircuitRowFilled(row);
            const rowLabel = row.name.trim() || `Circuit ${rowIdx + 1}`;
            const pressureLabel = row.pressure.trim()
              ? `${row.pressure} Kg/sqcm`
              : 'Pressure not set';

            return (
              <div
                key={rowIdx}
                className="rounded-lg border border-border bg-surface px-3 py-2"
              >
                {isEditing ? (
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:items-center">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(event) => updateRow(rowIdx, 'name', event.target.value)}
                      placeholder={`Circuit ${rowIdx + 1}`}
                      aria-label={`Circuit ${rowIdx + 1} name`}
                      className="input-field py-1.5 text-xs"
                    />
                    <input
                      type="number"
                      value={row.pressure}
                      onChange={(event) => updateRow(rowIdx, 'pressure', event.target.value)}
                      placeholder="0.0"
                      aria-label={`Circuit ${rowIdx + 1} pressure`}
                      className="input-field py-1.5 text-xs"
                    />
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => stopEditing(rowIdx)}
                        title="Done"
                        aria-label={`Done editing circuit ${rowIdx + 1}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950/20"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRow(rowIdx)}
                        title="Delete"
                        aria-label={`Delete circuit ${rowIdx + 1}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-[10px] font-semibold text-fg-muted">
                        {rowIdx + 1}
                      </span>
                      <span className="min-w-0 truncate text-xs font-semibold text-fg">
                        {rowLabel}
                      </span>
                      <span className="shrink-0 rounded-full border border-border bg-surface-secondary px-2 py-0.5 text-[11px] font-medium text-fg-muted">
                        {pressureLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEditing(rowIdx)}
                        title="Edit"
                        aria-label={`Edit circuit ${rowIdx + 1}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-secondary hover:text-brand-600"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRow(rowIdx)}
                        title="Delete"
                        aria-label={`Delete circuit ${rowIdx + 1}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

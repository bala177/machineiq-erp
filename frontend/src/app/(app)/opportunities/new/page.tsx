'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Cog,
  FilePlus2,
  Flame,
  Layers,
  Loader2,
  Plus,
  Search,
  X,
  Wrench,
  Zap,
  ClipboardList,
} from 'lucide-react';
import { api } from '@/lib/api';
import { CustomerRecord, CustomerFormValues } from '@/lib/customers';
import { Modal } from '@/components/ui/modal';
import { CustomerForm } from '@/components/customers/customer-form';
import {
  MACPRO_CATALOG,
  MacproVerticalId,
  MacproChecklistItem,
  getVerticalById,
  getMachineChecklist,
  machinesForVertical,
} from '@/lib/macpro-catalog';
import {
  CircuitTableEditor,
  getFilledCircuitRows,
  hasCircuitRows,
} from '@/components/opportunities/circuit-table-editor';

function isChecklistResponseAnswered(item: MacproChecklistItem, response: string): boolean {
  return (item.type ?? 'textarea') === 'circuit_table'
    ? hasCircuitRows(response)
    : response.trim().length > 0;
}

// ── Typed checklist field renderer ───────────────────────────────────────────

function ChecklistField({
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
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
          answered
            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
            : 'bg-surface text-fg-muted border border-border'
        }`}
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

  if (type === 'select_one') {
    const selected = response.trim();
    return (
      <div className={`rounded-xl border p-3 transition-colors ${answered ? 'border-green-200 bg-green-50/40 dark:border-green-800/30 dark:bg-green-950/10' : 'border-border bg-surface-secondary/40'}`}>
        {labelEl}
        <div className="flex flex-wrap gap-1.5 pl-7">
          {(item.options ?? []).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(item.label, selected === opt ? '' : opt)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                selected === opt
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : 'border-border bg-surface text-fg-secondary hover:border-brand-400 hover:text-brand-600'
              }`}
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
      const next = selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt];
      onChange(item.label, next.join(','));
    };
    return (
      <div className={`rounded-xl border p-3 transition-colors ${answered ? 'border-green-200 bg-green-50/40 dark:border-green-800/30 dark:bg-green-950/10' : 'border-border bg-surface-secondary/40'}`}>
        {labelEl}
        <div className="flex flex-wrap gap-1.5 pl-7">
          {(item.options ?? []).map((opt) => {
            const isOn = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  isOn
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-border bg-surface text-fg-secondary hover:border-brand-400 hover:text-brand-600'
                }`}
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
      <div className={`rounded-xl border p-3 transition-colors ${answered ? 'border-green-200 bg-green-50/40 dark:border-green-800/30 dark:bg-green-950/10' : 'border-border bg-surface-secondary/40'}`}>
        {labelEl}
        <div className="pl-7 flex items-center gap-2">
          <input
            type="number"
            value={response}
            onChange={(e) => onChange(item.label, e.target.value)}
            placeholder="0"
            className="input-field w-32 text-sm"
          />
          {item.unit && (
            <span className="text-xs text-fg-muted font-medium">{item.unit}</span>
          )}
        </div>
      </div>
    );
  }

  if (type === 'date') {
    return (
      <div className={`rounded-xl border p-3 transition-colors ${answered ? 'border-green-200 bg-green-50/40 dark:border-green-800/30 dark:bg-green-950/10' : 'border-border bg-surface-secondary/40'}`}>
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
      <div className={`rounded-xl border p-3 transition-colors ${answered ? 'border-green-200 bg-green-50/40 dark:border-green-800/30 dark:bg-green-950/10' : 'border-border bg-surface-secondary/40'}`}>
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
      <div className={`rounded-xl border p-3 transition-colors col-span-full ${answered ? 'border-green-200 bg-green-50/40 dark:border-green-800/30 dark:bg-green-950/10' : 'border-border bg-surface-secondary/40'}`}>
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
    <div className={`rounded-xl border p-3 transition-colors ${answered ? 'border-green-200 bg-green-50/40 dark:border-green-800/30 dark:bg-green-950/10' : 'border-border bg-surface-secondary/40'}`}>
      {labelEl}
      <textarea
        value={response}
        onChange={(e) => onChange(item.label, e.target.value)}
        placeholder="Enter customer answer…"
        className="input-field min-h-[68px] resize-y text-sm pl-7 ml-0"
        style={{ paddingLeft: '1.75rem' }}
      />
    </div>
  );
}

const VERTICAL_VISUAL: Record<
  MacproVerticalId,
  { icon: React.ElementType; badge: string; ring: string; dot: string }
> = {
  foundry: {
    icon: Flame,
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
    ring: 'border-orange-400 ring-orange-400/40 bg-orange-50/40 dark:bg-orange-950/20',
    dot: 'bg-orange-500',
  },
  machine_shop: {
    icon: Cog,
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    ring: 'border-blue-400 ring-blue-400/40 bg-blue-50/40 dark:bg-blue-950/20',
    dot: 'bg-blue-500',
  },
  spm: {
    icon: Zap,
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    ring: 'border-violet-400 ring-violet-400/40 bg-violet-50/40 dark:bg-violet-950/20',
    dot: 'bg-violet-500',
  },
  fabrication: {
    icon: Wrench,
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    ring: 'border-emerald-400 ring-emerald-400/40 bg-emerald-50/40 dark:bg-emerald-950/20',
    dot: 'bg-emerald-500',
  },
};

type SelectedMachine = {
  vertical: MacproVerticalId;
  verticalLabel: string;
  name: string;
} | null;

type ChecklistResponse = {
  label: string;
  response: string;
};

function checklistValue(responses: ChecklistResponse[], label: string): string {
  return responses.find((item) => item.label === label)?.response?.trim() ?? '';
}

function truncateSummary(value: string, maxLength: number): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function valueWithUnit(
  checklist: MacproChecklistItem[],
  responses: ChecklistResponse[],
  label: string,
): string {
  const value = checklistValue(responses, label);
  if (!value) return '';
  const unit = checklist.find((item) => item.label === label)?.unit;
  return unit ? `${value} ${unit}` : value;
}

function circuitSummary(response: string): string {
  return getFilledCircuitRows(response)
    .map((row, idx) => {
      const name = row.name.trim() || `Circuit ${idx + 1}`;
      const pressure = row.pressure.trim() ? ` at ${row.pressure.trim()} Kg/sqcm` : '';
      return `${name}${pressure}`;
    })
    .join('; ');
}

function deriveOpportunitySummaryFields(
  checklist: MacproChecklistItem[],
  responses: ChecklistResponse[],
) {
  const targetOutput = [
    valueWithUnit(checklist, responses, 'Production volume'),
    valueWithUnit(checklist, responses, 'Total cycle time'),
  ].filter(Boolean).join('; ');

  const criticalSpec = [
    valueWithUnit(checklist, responses, 'Acceptable leak rate'),
    valueWithUnit(checklist, responses, 'Test method'),
    circuitSummary(checklistValue(responses, 'Test circuits and pressures')),
  ].filter(Boolean).join('; ');

  return {
    deliveryTargetDate:
      checklistValue(responses, 'Expected installation date') ||
      checklistValue(responses, 'Expected despatch date') ||
      undefined,
    targetOutput: truncateSummary(targetOutput, 300),
    criticalSpec: truncateSummary(criticalSpec, 500),
    componentMaterial: truncateSummary(checklistValue(responses, 'Component material'), 60),
    sizeRange: truncateSummary(checklistValue(responses, 'Component size (L×W×H mm)'), 120),
  };
}

const STEPS = [
  { id: 1, label: 'Customer', icon: Building2 },
  { id: 2, label: 'Machine', icon: Layers },
];

export default function NewOpportunityPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [comboOpen, setComboOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const comboRef = useRef<HTMLDivElement>(null);
  const comboInputRef = useRef<HTMLInputElement>(null);
  const [endCustomer, setEndCustomer] = useState('');
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [customerFormError, setCustomerFormError] = useState('');

  const [selectedMachine, setSelectedMachine] = useState<SelectedMachine>(null);
  const [activeVertical, setActiveVertical] = useState<MacproVerticalId>('foundry');
  const [machineSearch, setMachineSearch] = useState('');
  const [title, setTitle] = useState('');
  const [checklistResponses, setChecklistResponses] = useState<ChecklistResponse[]>([]);

  // Checklist modal state — separate from confirmed selection
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [pendingMachine, setPendingMachine] = useState<SelectedMachine>(null);
  const [pendingChecklist, setPendingChecklist] = useState<ChecklistResponse[]>([]);

  const loadCustomers = async () => {
    try {
      const data = await api.get<CustomerRecord[]>('/customers');
      setCustomers(data);
    } catch {
      // non-fatal
    }
  };

  useEffect(() => {
    api
      .get<CustomerRecord[]>('/customers')
      .then(setCustomers)
      .catch((err: any) => setError(err.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(q));
  }, [customers, customerSearch]);

  const selectedCustomer = customers.find((c) => c._id === customerId) ?? null;
  const customerReady = Boolean(customerId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setComboOpen(false);
        setHighlightedIdx(-1);
        if (!customerId) setCustomerSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [customerId]);

  const openCombo = useCallback(() => {
    setComboOpen(true);
    setHighlightedIdx(-1);
  }, []);

  const selectCustomer = useCallback((id: string) => {
    setCustomerId(id);
    setCustomerSearch('');
    setComboOpen(false);
    setHighlightedIdx(-1);
  }, []);

  const clearCustomer = useCallback(() => {
    setCustomerId('');
    setCustomerSearch('');
    setComboOpen(true);
    setTimeout(() => comboInputRef.current?.focus(), 0);
  }, []);

  const handleComboKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setComboOpen(true);
        setHighlightedIdx((i) => Math.min(i + 1, filteredCustomers.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIdx >= 0 && filteredCustomers[highlightedIdx]) {
          selectCustomer(filteredCustomers[highlightedIdx]._id);
        }
      } else if (e.key === 'Escape') {
        setComboOpen(false);
        setHighlightedIdx(-1);
      }
    },
    [filteredCustomers, highlightedIdx, selectCustomer],
  );

  const machinesInActive = useMemo(() => {
    const list = machinesForVertical(activeVertical);
    const q = machineSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (m) => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q),
    );
  }, [activeVertical, machineSearch]);

  const selectedChecklist = useMemo(
    () => getMachineChecklist(selectedMachine?.vertical, selectedMachine?.name),
    [selectedMachine],
  );

  const pendingMachineChecklist = useMemo(
    () => getMachineChecklist(pendingMachine?.vertical, pendingMachine?.name),
    [pendingMachine],
  );

  const pendingMachineInfo = useMemo(
    () =>
      pendingMachine
        ? machinesForVertical(pendingMachine.vertical).find((m) => m.name === pendingMachine.name)
        : null,
    [pendingMachine],
  );

  const checklistAnswered = useMemo(
    () =>
      selectedChecklist.filter((item) =>
        isChecklistResponseAnswered(
          item,
          checklistResponses.find((response) => response.label === item.label)?.response ?? '',
        ),
      ).length,
    [checklistResponses, selectedChecklist],
  );

  const pendingChecklistAnswered = useMemo(
    () =>
      pendingMachineChecklist.filter((item) =>
        isChecklistResponseAnswered(
          item,
          pendingChecklist.find((response) => response.label === item.label)?.response ?? '',
        ),
      ).length,
    [pendingChecklist, pendingMachineChecklist],
  );

  const handlePendingChecklistResponse = useCallback((label: string, response: string) => {
    setPendingChecklist((prev) =>
      prev.map((item) => (item.label === label ? { ...item, response } : item)),
    );
  }, []);

  // Opens modal for a machine — pre-fills from existing responses if re-editing same machine
  const openMachineChecklist = useCallback(
    (machine: NonNullable<SelectedMachine>) => {
      const checklist = getMachineChecklist(machine.vertical, machine.name);
      const existing =
        selectedMachine?.name === machine.name && selectedMachine?.vertical === machine.vertical
          ? checklistResponses
          : [];
      setPendingMachine(machine);
      setPendingChecklist(
        checklist.map((item) => ({
          label: item.label,
          response: existing.find((r) => r.label === item.label)?.response ?? '',
        })),
      );
      setChecklistModalOpen(true);
    },
    [selectedMachine, checklistResponses],
  );

  const confirmMachineSelection = useCallback(() => {
    if (!pendingMachine) return;
    setSelectedMachine(pendingMachine);
    setChecklistResponses(pendingChecklist);
    setChecklistModalOpen(false);
  }, [pendingMachine, pendingChecklist]);

  const handleCreateCustomer = async (values: Partial<CustomerFormValues>) => {
    setSavingCustomer(true);
    setCustomerFormError('');
    try {
      const created = await api.post<CustomerRecord>('/customers', values);
      await loadCustomers();
      setCustomerId(created._id);
      setNewCustomerOpen(false);
      return true;
    } catch (err: any) {
      setCustomerFormError(err.message || 'Failed to create customer');
      return false;
    } finally {
      setSavingCustomer(false);
    }
  };

  const submit = async () => {
    if (!customerReady || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const machineName = selectedMachine?.name ?? null;
      const checklistPayload = selectedChecklist.map((item) => ({
        label: item.label,
        response: checklistResponses.find((response) => response.label === item.label)?.response ?? '',
      }));
      const summaryFields = deriveOpportunitySummaryFields(selectedChecklist, checklistPayload);
      const payload: Record<string, unknown> = {
        customerId,
        endCustomer: endCustomer.trim() || undefined,
        title: title.trim() || machineName || undefined,
        machineVertical: selectedMachine?.vertical || undefined,
        machineCategory: selectedMachine?.name || undefined,
        machineType: selectedMachine?.name || undefined,
        ...summaryFields,
        checklistResponses: checklistPayload.length ? checklistPayload : undefined,
      };
      const created = await api.post<any>('/opportunities/with-customer', payload);
      router.push(`/opportunities/${created._id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create request');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-fg-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  const containerWidth = step === 2 ? 'max-w-7xl' : 'max-w-2xl';

  return (
    <>
      <div className={`flex flex-col ${containerWidth} mx-auto`}>
        <div className="mb-6">
          <nav className="mb-3 flex items-center gap-1.5 text-sm text-fg-muted">
            <Link
              href="/opportunities"
              className="flex items-center gap-1 hover:text-fg transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Machine Inquiries
            </Link>
            <ChevronRight className="h-3.5 w-3.5 opacity-40" />
            <span className="font-medium text-fg">New Request</span>
          </nav>
          <h1 className="text-2xl font-bold text-fg tracking-tight">New machine request</h1>
        </div>

        <div className="card mb-6 px-5 py-4">
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                        done
                          ? 'border-brand-500 bg-brand-500 text-white'
                          : active
                          ? 'border-brand-500 bg-surface text-brand-600'
                          : 'border-border bg-surface text-fg-muted'
                      }`}
                    >
                      {done ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-bold">{s.id}</span>
                      )}
                    </div>
                    <span
                      className={`mt-1.5 text-[11px] font-medium whitespace-nowrap ${
                        active
                          ? 'text-brand-600'
                          : done
                          ? 'text-fg-secondary'
                          : 'text-fg-muted'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-3 mb-5 transition-all ${
                        step > s.id ? 'bg-brand-500' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="card p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-fg flex items-center gap-2">
                <Building2 className="h-4 w-4 text-fg-muted" />
                Who is this request for?
              </h2>
              <p className="mt-0.5 text-xs text-fg-muted">
                Select an existing customer from your records.
              </p>
            </div>

            {/* Customer combobox */}
            <div ref={comboRef} className="relative">
              {selectedCustomer && !comboOpen ? (
                <div className="flex items-center gap-2 rounded-lg border-2 border-brand-400 bg-brand-50 dark:bg-brand-950/30 px-3 py-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900 flex-shrink-0">
                    <Building2 className="h-3.5 w-3.5 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-fg truncate">{selectedCustomer.name}</div>
                    {(selectedCustomer as any).industry && (
                      <div className="text-[11px] text-fg-muted">{(selectedCustomer as any).industry}</div>
                    )}
                  </div>
                  <Check className="h-4 w-4 text-brand-500 flex-shrink-0" />
                  <button
                    type="button"
                    onClick={clearCustomer}
                    className="ml-1 flex h-5 w-5 items-center justify-center rounded-full hover:bg-brand-200 dark:hover:bg-brand-800 text-fg-muted hover:text-fg transition-colors"
                    aria-label="Clear selection"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted pointer-events-none" />
                  <input
                    ref={comboInputRef}
                    type="text"
                    role="combobox"
                    aria-expanded={comboOpen}
                    aria-autocomplete="list"
                    placeholder="Search by company name…"
                    value={customerSearch}
                    onChange={(e) => { setCustomerSearch(e.target.value); openCombo(); }}
                    onFocus={openCombo}
                    onKeyDown={handleComboKey}
                    className="input-field pl-9 pr-9"
                    autoComplete="off"
                  />
                  <ChevronDown
                    className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted pointer-events-none transition-transform ${
                      comboOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              )}

              {comboOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-surface shadow-xl overflow-hidden">
                  <div className="max-h-60 overflow-y-auto divide-y divide-border">
                    {filteredCustomers.length === 0 ? (
                      <div className="px-4 py-5 text-center text-sm text-fg-muted">
                        {customerSearch
                          ? `No customers match "${customerSearch}"`
                          : 'No customers yet.'}
                      </div>
                    ) : (
                      filteredCustomers.map((c, idx) => (
                        <button
                          key={c._id}
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); selectCustomer(c._id); }}
                          onMouseEnter={() => setHighlightedIdx(idx)}
                          className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                            idx === highlightedIdx
                              ? 'bg-brand-50 dark:bg-brand-950/40'
                              : 'hover:bg-surface-secondary'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-secondary flex-shrink-0">
                              <Building2 className="h-3.5 w-3.5 text-fg-muted" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-fg truncate">{c.name}</div>
                              {(c as any).industry && (
                                <div className="text-[11px] text-fg-muted">{(c as any).industry}</div>
                              )}
                            </div>
                          </div>
                          {customerId === c._id && (
                            <Check className="h-3.5 w-3.5 text-brand-500 flex-shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setNewCustomerOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-brand-400 hover:bg-brand-50/30 dark:hover:bg-brand-950/20 px-4 py-3 text-sm font-medium text-fg-secondary hover:text-brand-600 transition-all"
            >
              <Plus className="h-4 w-4" />
              Create a new customer
            </button>

            <div className="pt-4 border-t border-border">
              <label className="block">
                <span className="block text-xs font-medium text-fg-secondary mb-1">
                  End customer{' '}
                  <span className="text-fg-muted font-normal">(optional)</span>
                </span>
                <input
                  type="text"
                  value={endCustomer}
                  onChange={(e) => setEndCustomer(e.target.value)}
                  placeholder="e.g. brand owner the machine ships to"
                  className="input-field"
                />
                <span className="mt-1 block text-[11px] text-fg-muted">
                  If different from the buyer — e.g. an OEM passing the machine to a brand owner.
                </span>
              </label>
            </div>

            <div className="pt-1 flex flex-col items-end gap-1">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!customerReady}
                className="btn-primary gap-2 disabled:opacity-40"
              >
                Next — Choose machine <ArrowRight className="h-4 w-4" />
              </button>
              {!customerReady && (
                <p className="text-[11px] text-amber-500">Select a customer to continue.</p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="card px-5 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="h-4 w-4 text-fg-muted flex-shrink-0" />
                <h2 className="text-sm font-semibold text-fg">Which machine type?</h2>
                <span className="text-xs text-fg-muted hidden sm:inline">
                  · From Macpro Automation&apos;s catalog
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-fg-muted">
                  Customer:{' '}
                  <span className="font-semibold text-fg">{selectedCustomer?.name}</span>
                </span>
                <span className="text-fg-muted hidden md:inline">
                  {selectedMachine ? (
                    <>
                      Selected:{' '}
                      <span className="font-semibold text-fg">{selectedMachine.name}</span>
                    </>
                  ) : (
                    <span className="font-semibold text-fg">Blank request</span>
                  )}
                </span>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[260px_1fr]">
              <aside className="card p-3 space-y-3 lg:sticky lg:top-4 self-start">
                <button
                  type="button"
                  onClick={() => setSelectedMachine(null)}
                  className={`w-full text-left rounded-lg border-2 px-3 py-2.5 transition-all flex items-center gap-2.5 ${
                    selectedMachine === null
                      ? 'border-brand-500 ring-2 ring-brand-400/30 bg-brand-50/40 dark:bg-brand-950/20'
                      : 'border-border bg-surface hover:border-border-strong hover:bg-surface-secondary'
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-md flex-shrink-0 ${
                      selectedMachine === null
                        ? 'bg-brand-100 dark:bg-brand-900/40'
                        : 'bg-surface-secondary'
                    }`}
                  >
                    <FilePlus2
                      className={`h-3.5 w-3.5 ${
                        selectedMachine === null ? 'text-brand-600' : 'text-fg-muted'
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-fg">Start blank</div>
                    <div className="text-[10px] text-fg-muted truncate">No type pre-selected</div>
                  </div>
                  {selectedMachine === null && (
                    <Check className="h-3.5 w-3.5 text-brand-500 ml-auto flex-shrink-0" />
                  )}
                </button>

                <div className="px-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-fg-muted">
                  Verticals
                </div>

                <nav className="space-y-1">
                  {MACPRO_CATALOG.map((v) => {
                    const visual = VERTICAL_VISUAL[v.id];
                    const Icon = visual.icon;
                    const isActive = activeVertical === v.id;
                    const isHomeOfSelected = selectedMachine?.vertical === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setActiveVertical(v.id);
                          setMachineSearch('');
                        }}
                        className={`w-full text-left rounded-lg px-3 py-2 flex items-center gap-2.5 transition-all border ${
                          isActive
                            ? `${visual.badge} border-current font-semibold`
                            : 'border-transparent text-fg-secondary hover:bg-surface-secondary hover:text-fg'
                        }`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm flex-1 truncate">{v.shortLabel}</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white/60 dark:bg-black/30'
                              : 'bg-surface-secondary text-fg-muted'
                          }`}
                        >
                          {v.machines.length}
                        </span>
                        {isHomeOfSelected && (
                          <span className={`h-1.5 w-1.5 rounded-full ${visual.dot}`} />
                        )}
                      </button>
                    );
                  })}
                </nav>

                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] text-fg-muted leading-relaxed px-1">
                    Selecting a machine pre-fills the vertical and category in your intake form.
                  </p>
                </div>
              </aside>

              <section className="card p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const visual = VERTICAL_VISUAL[activeVertical];
                      const Icon = visual.icon;
                      const v = getVerticalById(activeVertical)!;
                      return (
                        <>
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${visual.badge}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {v.label}
                          </span>
                          <span className="text-xs text-fg-muted">
                            {machinesInActive.length} of {v.machines.length} machines
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-muted pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Filter machines…"
                      value={machineSearch}
                      onChange={(e) => setMachineSearch(e.target.value)}
                      className="input-field pl-8 py-1.5 text-xs"
                    />
                  </div>
                </div>

                {machinesInActive.length === 0 ? (
                  <div className="text-center py-12 text-sm text-fg-muted">
                    No machines match &quot;
                    <span className="font-medium text-fg">{machineSearch}</span>&quot;.
                  </div>
                ) : (
                  <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {machinesInActive.map((machine) => {
                      const visual = VERTICAL_VISUAL[activeVertical];
                      const isSel =
                        selectedMachine?.vertical === activeVertical &&
                        selectedMachine?.name === machine.name;
                      const checklist = getMachineChecklist(activeVertical, machine.name);
                      return (
                        <button
                          key={machine.name}
                          type="button"
                          onClick={() =>
                            openMachineChecklist({
                              vertical: activeVertical,
                              verticalLabel: getVerticalById(activeVertical)!.shortLabel,
                              name: machine.name,
                            })
                          }
                          className={`text-left rounded-xl border-2 p-3 transition-all flex flex-col h-full ${
                            isSel
                              ? `${visual.ring} ring-2`
                              : 'border-border bg-surface hover:border-border-strong hover:bg-surface-secondary'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5 mb-1.5">
                            <span className="text-sm font-semibold text-fg leading-tight line-clamp-2">
                              {machine.name}
                            </span>
                            {isSel && (
                              <Check className="h-3.5 w-3.5 flex-shrink-0 text-brand-500 mt-0.5" />
                            )}
                          </div>
                          <p className="text-[11px] text-fg-muted leading-relaxed line-clamp-3 flex-1">
                            {machine.description}
                          </p>
                          {checklist.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-border flex items-center gap-1 text-[10px] text-fg-muted">
                              <ClipboardList className="h-3 w-3 flex-shrink-0" />
                              {checklist.length} checklist questions
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-3">

                {/* Compact selection summary — replaces the inline checklist */}
                {selectedMachine && (
                  <div className="card p-3 flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${VERTICAL_VISUAL[selectedMachine.vertical].badge}`}
                    >
                      {(() => {
                        const Icon = VERTICAL_VISUAL[selectedMachine.vertical].icon;
                        return <Icon className="h-4 w-4" />;
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-fg truncate">
                        {selectedMachine.name}
                      </div>
                      {selectedChecklist.length > 0 ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex gap-0.5">
                            {selectedChecklist.slice(0, 8).map((_, i) => (
                              <span
                                key={i}
                                className={`inline-block h-1.5 w-1.5 rounded-full ${
                                  i < checklistAnswered
                                    ? 'bg-green-500'
                                    : 'bg-border'
                                }`}
                              />
                            ))}
                            {selectedChecklist.length > 8 && (
                              <span className="text-[10px] text-fg-muted ml-0.5">
                                +{selectedChecklist.length - 8}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-fg-muted">
                            {checklistAnswered}/{selectedChecklist.length} checklist answered
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-fg-muted mt-0.5">No checklist for this type</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => openMachineChecklist(selectedMachine)}
                      className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium px-3 py-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/30 border border-brand-200 dark:border-brand-800 transition-colors flex-shrink-0"
                    >
                      <ClipboardList className="h-3.5 w-3.5" />
                      {selectedChecklist.length > 0 ? 'Edit answers' : 'Change machine'}
                    </button>
                  </div>
                )}

                <div className="card p-4">
                  <label className="block">
                    <span className="block text-xs font-semibold text-fg-secondary mb-1">
                      Request title{' '}
                      <span className="text-fg-muted font-normal">(optional)</span>
                    </span>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={
                        selectedMachine
                          ? `e.g. "${selectedMachine.name} for ${selectedCustomer?.name}"`
                          : 'e.g. "Custom filling line for Atlas Foods"'
                      }
                      className="input-field"
                    />
                    <span className="mt-1 block text-[11px] text-fg-muted">
                      If blank, the machine type name will be used.
                    </span>
                  </label>
                </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="sticky bottom-0 z-20 -mx-5 md:-mx-6 lg:-mx-8 bg-surface/95 backdrop-blur-sm border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.25)]">
            <div className="px-5 md:px-6 lg:px-8 py-3 flex items-center gap-4">
              {/* Left: selection context */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {selectedMachine ? (
                  <>
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0 ${VERTICAL_VISUAL[selectedMachine.vertical].badge}`}
                    >
                      {(() => {
                        const Icon = VERTICAL_VISUAL[selectedMachine.vertical].icon;
                        return <Icon className="h-3.5 w-3.5" />;
                      })()}
                    </div>
                    <div className="min-w-0 hidden sm:block">
                      <div className="text-xs font-semibold text-fg truncate">{selectedMachine.name}</div>
                      {selectedChecklist.length > 0 ? (
                        <div className="text-[11px] text-fg-muted">
                          {checklistAnswered}/{selectedChecklist.length} checklist answered
                        </div>
                      ) : (
                        <div className="text-[11px] text-fg-muted">No checklist</div>
                      )}
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-fg-muted hidden sm:inline">
                    Blank request — no machine type selected
                  </span>
                )}
                <span className="text-[11px] text-fg-muted hidden md:block">
                  · for{' '}
                  <span className="font-medium text-fg">{selectedCustomer?.name}</span>
                </span>
              </div>

              {/* Right: action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className="btn-primary gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                    </>
                  ) : (
                    <>
                      Create request <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="mt-4 text-center text-[11px] text-fg-muted">
          Nothing locks — all details are editable in the workspace after creation.
        </p>
      </div>

      {newCustomerOpen && (
        <Modal title="New Customer" onClose={() => setNewCustomerOpen(false)} size="lg" noPadding>
          <CustomerForm
            submitLabel="Create Customer"
            savingLabel="Creating…"
            error={customerFormError}
            saving={savingCustomer}
            onSubmit={handleCreateCustomer}
            onCancel={() => setNewCustomerOpen(false)}
          />
        </Modal>
      )}

      {/* Machine checklist modal — opens immediately on tile click */}
      {checklistModalOpen && pendingMachine && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-border bg-surface shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh]">

            {/* Modal header — machine identity */}
            <div className="flex items-start gap-3 border-b border-border px-5 py-4 flex-shrink-0">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 ${VERTICAL_VISUAL[pendingMachine.vertical].badge}`}
              >
                {(() => {
                  const Icon = VERTICAL_VISUAL[pendingMachine.vertical].icon;
                  return <Icon className="h-5 w-5" />;
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-semibold text-fg leading-snug">
                  {pendingMachine.name}
                </div>
                {pendingMachineInfo?.description && (
                  <p className="mt-0.5 text-xs text-fg-muted leading-relaxed line-clamp-2">
                    {pendingMachineInfo.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {pendingMachineChecklist.length > 0 && (
                  <span className="rounded-full border border-border bg-surface-secondary px-2.5 py-1 text-[11px] font-semibold text-fg-muted">
                    {pendingChecklistAnswered}/{pendingMachineChecklist.length} answered
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setChecklistModalOpen(false)}
                  className="btn-ghost px-2 py-2 -mt-1 -mr-1"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable checklist body — section-grouped */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {pendingMachineChecklist.length > 0 ? (
                (() => {
                  // Group items by section
                  const sections: { name: string; items: { item: typeof pendingMachineChecklist[0]; idx: number }[] }[] = [];
                  pendingMachineChecklist.forEach((item, idx) => {
                    const sName = item.section ?? 'Details';
                    const existing = sections.find((s) => s.name === sName);
                    if (existing) existing.items.push({ item, idx });
                    else sections.push({ name: sName, items: [{ item, idx }] });
                  });
                  return (
                    <div className="space-y-5">
                      {sections.map((sec) => (
                        <div key={sec.name}>
                          <div className="flex items-center gap-2 mb-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-fg-muted">
                              {sec.name}
                            </span>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                          <div className="grid gap-2.5 sm:grid-cols-2">
                            {sec.items.map(({ item, idx }) => {
                              const current =
                                pendingChecklist.find((r) => r.label === item.label)?.response ?? '';
                              return (
                                <ChecklistField
                                  key={item.label}
                                  item={item}
                                  idx={idx}
                                  response={current}
                                  onChange={handlePendingChecklistResponse}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${VERTICAL_VISUAL[pendingMachine.vertical].badge}`}
                  >
                    {(() => {
                      const Icon = VERTICAL_VISUAL[pendingMachine.vertical].icon;
                      return <Icon className="h-7 w-7" />;
                    })()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-fg">No predefined checklist</p>
                    <p className="text-xs text-fg-muted mt-1">
                      You can add notes and details after creating the request.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky footer */}
            <div className="border-t border-border px-5 py-4 flex items-center justify-between gap-3 flex-shrink-0 bg-surface rounded-b-2xl">
              <p className="text-xs text-fg-muted hidden sm:block">
                {pendingMachineChecklist.length > 0
                  ? 'Answers can be edited after creation too.'
                  : 'Select to continue with this machine type.'}
              </p>
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setChecklistModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmMachineSelection}
                  className="btn-primary gap-2"
                >
                  <Check className="h-4 w-4" />
                  Select this machine
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

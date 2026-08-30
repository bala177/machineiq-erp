'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, Clock3, UserRound } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate } from '@/lib/utils';

/* ─── Types ─────────────────────────────────────────────────────────── */

export type ComponentLeaf = {
  _id: string;
  name: string;
  discipline?: string;
  dueDate?: string;
  isDelayed?: boolean;
  designStatus: string;
  procurementStatus: string;
  assemblyStatus: string;
  ownerId?: { firstName: string; lastName: string } | null;
};

export type CmNode = { _id: string; name: string; components?: ComponentLeaf[] };
export type EmNode = { _id: string; name: string; controlModules?: CmNode[] };
export type UnitNode = {
  _id: string;
  name: string;
  ownerId?: { firstName: string; lastName: string } | null;
  ownerName?: string;
  plannedEndDate?: string;
  status?: string;
  blockerCount?: number;
  equipmentModules?: EmNode[];
};
export type MachineTreeNode = {
  _id: string;
  name: string;
  units?: UnitNode[];
  components?: ComponentLeaf[];
};

type ModuleMeta = {
  ownerName?: string;
  plannedEndDate?: string;
  status?: string;
  blockerCount?: number;
};

/* ─── Level badge styles ─────────────────────────────────────────────── */

const LEVEL_STYLES = {
  unit: { label: 'Unit',             cls: 'bg-blue-100   text-blue-700   dark:bg-blue-950/40   dark:text-blue-300'   },
  em:   { label: 'Equipment Module', cls: 'bg-teal-100   text-teal-700   dark:bg-teal-950/40   dark:text-teal-300'   },
  cm:   { label: 'Control Module',   cls: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
} as const;

export function LevelPill({ level }: { level: keyof typeof LEVEL_STYLES }) {
  const { label, cls } = LEVEL_STYLES[level];
  return (
    <span className={`rounded-md px-2 py-0.5 text-[15px] font-bold uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
}

/* ─── ISA-88 Tree ────────────────────────────────────────────────────── */

export function Isa88Tree({ tree, moduleMeta = {} }: { tree: MachineTreeNode; moduleMeta?: Record<string, ModuleMeta> }) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // Auto-open all units on first render
    const ids = new Set<string>();
    tree.units?.forEach((u) => ids.add(u._id));
    return ids;
  });

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (!tree.units?.length) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-fg-muted">No units defined. Add units to build the ISA-88 structure.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tree.units.map((unit) => {
        const unitOpen = expanded.has(unit._id);
        const summary = moduleMeta[unit._id];
        const ownerName = summary?.ownerName || unit.ownerName || (unit.ownerId ? `${unit.ownerId.firstName} ${unit.ownerId.lastName}` : '');
        const initials = ownerName
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase())
          .join('');
        const blockerCount = summary?.blockerCount ?? unit.blockerCount ?? 0;
        const status = summary?.status || unit.status;
        const plannedEndDate = summary?.plannedEndDate || unit.plannedEndDate;
        return (
          <div key={unit._id} className="overflow-hidden rounded-xl border border-border">
            {/* Unit */}
            <button
              onClick={() => toggle(unit._id)}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left hover:bg-surface-secondary transition-colors"
            >
              {unitOpen
                ? <ChevronDown className="h-4 w-4 flex-shrink-0 text-fg-muted" />
                : <ChevronRight className="h-4 w-4 flex-shrink-0 text-fg-muted" />}
              <LevelPill level="unit" />
              <span className="flex-1 text-sm font-semibold text-fg">{unit.name}</span>
              {ownerName && (
                <span className="hidden items-center gap-1 text-xs text-fg-muted md:inline-flex">
                  <UserRound className="h-3.5 w-3.5" />
                  {initials || ownerName}
                </span>
              )}
              {plannedEndDate && (
                <span className="hidden items-center gap-1 text-xs text-fg-muted lg:inline-flex">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatDate(plannedEndDate)}
                </span>
              )}
              {typeof blockerCount === 'number' && blockerCount > 0 && (
                <span className="hidden items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[15px] font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 lg:inline-flex">
                  <AlertTriangle className="h-3 w-3" />
                  {blockerCount}
                </span>
              )}
              {status && <StatusBadge status={status} />}
              <span className="text-xs text-fg-muted">
                {unit.equipmentModules?.length ?? 0} equipment module{unit.equipmentModules?.length !== 1 ? 's' : ''}
              </span>
            </button>

            {unitOpen && (
              <div className="border-t border-border">
                {unit.equipmentModules?.length ? (
                  unit.equipmentModules.map((em, emIdx) => {
                    const emOpen = expanded.has(em._id);
                    return (
                      <div key={em._id} className={emIdx > 0 ? 'border-t border-border' : ''}>
                        {/* Equipment Module */}
                        <button
                          onClick={() => toggle(em._id)}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 pl-10 text-left hover:bg-surface-secondary transition-colors"
                        >
                          {emOpen
                            ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-fg-muted" />
                            : <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-fg-muted" />}
                          <LevelPill level="em" />
                          <span className="flex-1 text-sm font-medium text-fg-secondary">{em.name}</span>
                          <span className="text-xs text-fg-muted">
                            {em.controlModules?.length ?? 0} control module{em.controlModules?.length !== 1 ? 's' : ''}
                          </span>
                        </button>

                        {emOpen && (
                          <div className="border-t border-border bg-surface-tertiary/20">
                            {em.controlModules?.length ? (
                              em.controlModules.map((cm, cmIdx) => {
                                const cmOpen = expanded.has(cm._id);
                                return (
                                  <div key={cm._id} className={cmIdx > 0 ? 'border-t border-border' : ''}>
                                    {/* Control Module */}
                                    <button
                                      onClick={() => toggle(cm._id)}
                                      className="flex w-full items-center gap-2.5 px-4 py-2 pl-[72px] text-left hover:bg-surface-secondary transition-colors"
                                    >
                                      {cmOpen
                                        ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-fg-muted" />
                                        : <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-fg-muted" />}
                                      <LevelPill level="cm" />
                                      <span className="flex-1 text-sm text-fg-secondary">{cm.name}</span>
                                      {(cm.components?.length ?? 0) > 0 && (
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[15px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                          {cm.components!.length} component{cm.components!.length !== 1 ? 's' : ''}
                                        </span>
                                      )}
                                    </button>

                                    {cmOpen && (
                                      <div className="border-t border-border bg-surface-secondary/50 px-4 py-3 pl-[100px]">
                                        {cm.components?.length ? (
                                          <div className="space-y-2">
                                            {cm.components.map((comp) => (
                                              <ComponentCard key={comp._id} comp={comp} />
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-xs text-fg-muted">No components attached.</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <p className="py-3 pl-[72px] text-xs text-fg-muted">No control modules</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="py-3 pl-10 text-xs text-fg-muted">No equipment modules</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Component leaf card ────────────────────────────────────────────── */

function ComponentCard({ comp }: { comp: ComponentLeaf }) {
  return (
    <div
      className={`rounded-xl border bg-surface p-3 ${
        comp.isDelayed ? 'border-amber-300 dark:border-amber-700' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-fg">{comp.name}</span>
          {comp.discipline && (
            <span className="rounded-md bg-surface-tertiary px-1.5 py-0.5 text-[15px] font-medium text-fg-tertiary">
              {comp.discipline}
            </span>
          )}
        </div>
        {comp.isDelayed && (
          <span className="flex-shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[15px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            Delayed
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <StatusBadge status={comp.designStatus} />
        <StatusBadge status={comp.procurementStatus} />
        <StatusBadge status={comp.assemblyStatus} />
        {comp.ownerId && (
          <span className="text-[15px] text-fg-muted">
            · {comp.ownerId.firstName} {comp.ownerId.lastName}
          </span>
        )}
        {comp.dueDate && (
          <span className="text-[15px] text-fg-muted">· {formatDate(comp.dueDate)}</span>
        )}
      </div>
    </div>
  );
}

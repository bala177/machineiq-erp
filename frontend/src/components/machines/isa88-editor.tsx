'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '@/lib/api';
import { LevelPill, type CmNode, type EmNode, type MachineTreeNode, type UnitNode } from './isa88-tree';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────────── */

type NodeType = 'unit' | 'em' | 'cm';
type EditState = { id: string; nodeType: NodeType; value: string } | null;
type AddState  = { parentId: string; parentType: 'machine' | 'unit' | 'em'; value: string } | null;
interface ImportResult { unitsCreated: number; emsCreated: number; cmsCreated: number; totalRows: number }

/* ─── URL helpers ────────────────────────────────────────────────────── */

const PATCH_URL:  Record<NodeType, (id: string) => string> = {
  unit: (id) => `/machines/units/${id}`,
  em:   (id) => `/machines/equipment-modules/${id}`,
  cm:   (id) => `/machines/control-modules/${id}`,
};
const DELETE_URL: Record<NodeType, (id: string) => string> = PATCH_URL;

/* ─── Inline input ───────────────────────────────────────────────────── */

function InlineInput({ value, onChange, onSave, onCancel, placeholder = 'Name…' }: {
  value: string; onChange: (v: string) => void; onSave: () => void; onCancel: () => void; placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        className="rounded-md border border-brand-400 bg-surface px-2 py-0.5 text-sm font-medium text-fg outline-none ring-1 ring-brand-400"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
      />
      <button onClick={onSave} className="rounded p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"><Check className="h-3.5 w-3.5" /></button>
      <button onClick={onCancel} className="rounded p-1 text-fg-muted hover:bg-surface-tertiary"><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}

/* ─── Node action bar ────────────────────────────────────────────────── */

function NodeActions({ onAddChild, childLabel, onEdit, onDelete }: {
  onAddChild?: () => void; childLabel?: string; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
      {onAddChild && (
        <button title={`Add ${childLabel}`} onClick={onAddChild}
          className="rounded p-1.5 text-fg-muted hover:bg-surface-tertiary hover:text-brand-600">
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
      <button title="Rename" onClick={onEdit}
        className="rounded p-1.5 text-fg-muted hover:bg-surface-tertiary hover:text-fg">
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button title="Delete" onClick={onDelete}
        className="rounded p-1.5 text-fg-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─── Sortable CM row ────────────────────────────────────────────────── */

function SortableCmRow({ cm, editing, onStartEdit, onChangeEdit, onSaveEdit, onCancelEdit, onDelete }: {
  cm: CmNode;
  editing: EditState;
  onStartEdit: () => void;
  onChangeEdit: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cm._id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group flex items-center gap-2.5 pl-[72px] pr-4 py-2 border-t border-border bg-surface-tertiary/20 ${isDragging ? 'opacity-40' : ''}`}
    >
      <button {...listeners} {...attributes} className="cursor-grab touch-none text-fg-muted/40 hover:text-fg-muted active:cursor-grabbing">
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <LevelPill level="cm" />
      {editing?.id === cm._id ? (
        <InlineInput value={editing.value} onChange={onChangeEdit} onSave={onSaveEdit} onCancel={onCancelEdit} />
      ) : (
        <>
          <span className="flex-1 text-sm text-fg-secondary">{cm.name}</span>
          <NodeActions onEdit={onStartEdit} onDelete={onDelete} />
        </>
      )}
    </div>
  );
}

/* ─── Sortable EM row (with its CMs inside) ──────────────────────────── */

function SortableEmSection({ em, editing, adding, expanded, onToggle, onStartEdit, onChangeEdit, onSaveEdit, onCancelEdit, onDelete, onStartAdd, onChangeAdd, onSaveAdd, onCancelAdd, onReorderCMs, onDeleteCm, onStartEditCm }: {
  em: EmNode; editing: EditState; adding: AddState; expanded: Set<string>;
  onToggle: (id: string) => void;
  onStartEdit: () => void; onChangeEdit: (v: string) => void; onSaveEdit: () => void; onCancelEdit: () => void;
  onDelete: () => void;
  onStartAdd: () => void; onChangeAdd: (v: string) => void; onSaveAdd: () => void; onCancelAdd: () => void;
  onReorderCMs: (ids: string[]) => void;
  onDeleteCm: (id: string, name: string) => void;
  onStartEditCm: (id: string, name: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: em._id });

  const emOpen = expanded.has(em._id);
  const cmIds = (em.controlModules || []).map((c) => c._id);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleCmDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = cmIds.indexOf(active.id as string);
    const newIdx = cmIds.indexOf(over.id as string);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(cmIds, oldIdx, newIdx);
    onReorderCMs(reordered);
  };

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'opacity-40' : ''}>
      {/* EM header row */}
      <div className="group flex w-full items-center gap-2.5 border-t border-border pl-4 pr-4 py-2.5">
        <button {...listeners} {...attributes} className="cursor-grab touch-none text-fg-muted/40 hover:text-fg-muted active:cursor-grabbing">
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onToggle(em._id)} className="flex-shrink-0 text-fg-muted hover:text-fg">
          {emOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        <LevelPill level="em" />
        {editing?.id === em._id ? (
          <InlineInput value={editing.value} onChange={onChangeEdit} onSave={onSaveEdit} onCancel={onCancelEdit} />
        ) : (
          <>
            <span className="flex-1 text-sm font-medium text-fg-secondary">{em.name}</span>
            <NodeActions childLabel="Control Module" onAddChild={onStartAdd} onEdit={onStartEdit} onDelete={onDelete} />
          </>
        )}
      </div>

      {/* CM list */}
      {emOpen && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCmDragEnd}>
          <SortableContext items={cmIds} strategy={verticalListSortingStrategy}>
            {(em.controlModules || []).map((cm) => (
              <SortableCmRow
                key={cm._id}
                cm={cm}
                editing={editing}
                onStartEdit={() => onStartEditCm(cm._id, cm.name)}
                onChangeEdit={(v) => {/* handled by parent */}}
                onSaveEdit={onSaveEdit}
                onCancelEdit={onCancelEdit}
                onDelete={() => onDeleteCm(cm._id, cm.name)}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {/* Add CM */}
      {emOpen && (
        <>
          {adding?.parentId === em._id && adding?.parentType === 'em' ? (
            <div className="flex items-center gap-2 border-t border-border bg-brand-50/30 dark:bg-brand-950/10 px-4 py-2 pl-[72px]">
              <LevelPill level="cm" />
              <InlineInput value={adding.value} onChange={onChangeAdd} onSave={onSaveAdd} onCancel={onCancelAdd}
                placeholder="New control module name…" />
            </div>
          ) : (
            <button onClick={onStartAdd}
              className="flex w-full items-center gap-1.5 border-t border-border px-4 py-2 pl-[72px] text-[15px] font-medium text-fg-muted hover:bg-surface-secondary hover:text-brand-600 transition-colors">
              <Plus className="h-3 w-3" /> Add Control Module
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Sortable Unit section (with its EMs inside) ───────────────────── */

function SortableUnitSection({ unit, editing, adding, expanded, onToggle, onStartEdit, onChangeEdit, onSaveEdit, onCancelEdit, onDelete, onStartAddEm, onChangeAdd, onSaveAdd, onCancelAdd, onReorderEMs, onStartAddCm, onReorderCMs, onDeleteEm, onDeleteCm, onStartEditEm, onStartEditCm }: {
  unit: UnitNode; editing: EditState; adding: AddState; expanded: Set<string>;
  onToggle: (id: string) => void;
  onStartEdit: () => void; onChangeEdit: (v: string) => void; onSaveEdit: () => void; onCancelEdit: () => void; onDelete: () => void;
  onStartAddEm: () => void; onChangeAdd: (v: string) => void; onSaveAdd: () => void; onCancelAdd: () => void;
  onReorderEMs: (ids: string[]) => void;
  onStartAddCm: (emId: string) => void;
  onReorderCMs: (emId: string, ids: string[]) => void;
  onDeleteEm: (id: string, name: string) => void;
  onDeleteCm: (id: string, name: string) => void;
  onStartEditEm: (id: string, name: string) => void;
  onStartEditCm: (id: string, name: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: unit._id });

  const unitOpen = expanded.has(unit._id);
  const emIds = (unit.equipmentModules || []).map((e) => e._id);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleEmDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = emIds.indexOf(active.id as string);
    const newIdx = emIds.indexOf(over.id as string);
    if (oldIdx === -1 || newIdx === -1) return;
    onReorderEMs(arrayMove(emIds, oldIdx, newIdx));
  };

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`overflow-hidden rounded-xl border border-border ${isDragging ? 'opacity-40 shadow-lg' : ''}`}>
      {/* Unit header row */}
      <div className="group flex w-full items-center gap-2.5 px-4 py-3">
        <button {...listeners} {...attributes} className="cursor-grab touch-none text-fg-muted/40 hover:text-fg-muted active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </button>
        <button onClick={() => onToggle(unit._id)} className="flex-shrink-0 text-fg-muted hover:text-fg">
          {unitOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <LevelPill level="unit" />
        {editing?.id === unit._id ? (
          <InlineInput value={editing.value} onChange={onChangeEdit} onSave={onSaveEdit} onCancel={onCancelEdit} />
        ) : (
          <>
            <span className="flex-1 text-sm font-semibold text-fg">{unit.name}</span>
            <NodeActions childLabel="Equipment Module" onAddChild={onStartAddEm} onEdit={onStartEdit} onDelete={onDelete} />
          </>
        )}
      </div>

      {/* EM list */}
      {unitOpen && (
        <div className="border-t border-border">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEmDragEnd}>
            <SortableContext items={emIds} strategy={verticalListSortingStrategy}>
              {(unit.equipmentModules || []).map((em) => (
                <SortableEmSection
                  key={em._id}
                  em={em}
                  editing={editing}
                  adding={adding}
                  expanded={expanded}
                  onToggle={onToggle}
                  onStartEdit={() => onStartEditEm(em._id, em.name)}
                  onChangeEdit={onChangeEdit}
                  onSaveEdit={onSaveEdit}
                  onCancelEdit={onCancelEdit}
                  onDelete={() => onDeleteEm(em._id, em.name)}
                  onStartAdd={() => onStartAddCm(em._id)}
                  onChangeAdd={onChangeAdd}
                  onSaveAdd={onSaveAdd}
                  onCancelAdd={onCancelAdd}
                  onReorderCMs={(ids) => onReorderCMs(em._id, ids)}
                  onDeleteCm={onDeleteCm}
                  onStartEditCm={onStartEditCm}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Add EM */}
          {adding?.parentId === unit._id && adding?.parentType === 'unit' ? (
            <div className="flex items-center gap-2 border-t border-border bg-brand-50/30 dark:bg-brand-950/10 px-4 py-2 pl-10">
              <LevelPill level="em" />
              <InlineInput value={adding.value} onChange={onChangeAdd} onSave={onSaveAdd} onCancel={onCancelAdd}
                placeholder="New equipment module name…" />
            </div>
          ) : (
            <button onClick={onStartAddEm}
              className="flex w-full items-center gap-1.5 border-t border-border px-4 py-2 pl-10 text-[15px] font-medium text-fg-muted hover:bg-surface-secondary hover:text-brand-600 transition-colors">
              <Plus className="h-3 w-3" /> Add Equipment Module
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Import panel ───────────────────────────────────────────────────── */

function downloadTemplate() {
  const csv = ['Unit,Equipment Module,Control Module',
    'Infeed Section,Timing Screw Assembly,Drive Controller',
    'Infeed Section,Timing Screw Assembly,Speed Sensor',
    'Fill and Cap Cell,Capper Turret Assembly,',
  ].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'isa88-template.csv'; a.click();
  URL.revokeObjectURL(url);
}

function ImportPanel({ machineId, onImported }: { machineId: string; onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  const doImport = useCallback(async (file: File) => {
    setBusy(true); setResult(null); setError('');
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await api.postForm<ImportResult>(`/machines/${machineId}/import`, fd);
      setResult(res); onImported();
    } catch (e: any) { setError(e.message || 'Import failed'); }
    finally { setBusy(false); }
  }, [machineId, onImported]);

  return (
    <div className="mb-5 rounded-xl border border-dashed border-border bg-surface-secondary/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-fg-muted" />
          <span className="text-xs font-semibold text-fg">Import from CSV / Excel</span>
          <span className="rounded bg-surface-tertiary px-1.5 py-0.5 text-[16px] text-fg-muted">Unit · Equipment Module · Control Module</span>
        </div>
        <button onClick={downloadTemplate}
          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[15px] font-medium text-fg-secondary hover:bg-surface-tertiary transition-colors">
          <Download className="h-3 w-3" /> Template
        </button>
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); doImport(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-5 transition-colors ${dragging ? 'border-brand-400 bg-brand-50 dark:bg-brand-950/20' : 'border-border hover:border-brand-300 hover:bg-surface-secondary'}`}>
        {busy
          ? <Loader2 className="h-5 w-5 animate-spin text-fg-muted" />
          : <><FileSpreadsheet className="h-6 w-6 text-fg-muted" />
            <span className="text-xs text-fg-muted">Drop <strong>.csv</strong> or <strong>.xlsx</strong> here, or <span className="text-brand-600">click to browse</span></span></>}
      </div>
      <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) doImport(e.target.files[0]); }} />
      {result && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
          <Check className="h-3.5 w-3.5 flex-shrink-0" />
          {result.unitsCreated} units, {result.emsCreated} equipment modules, {result.cmsCreated} control modules added from {result.totalRows} rows.
        </div>
      )}
      {error && <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-red-700 dark:text-red-400">{error}</div>}
    </div>
  );
}

/* ─── Main Editor ────────────────────────────────────────────────────── */

export function Isa88Editor({ machineId, tree, onUpdate }: {
  machineId: string; tree: MachineTreeNode; onUpdate: () => void;
}) {
  // ── Local tree state (optimistic) ──
  const [units, setUnits] = useState<UnitNode[]>(() => (tree.units ?? []) as UnitNode[]);
  useEffect(() => setUnits((tree.units ?? []) as UnitNode[]), [tree.units]);

  // ── UI state ──
  const [editing, setEditing] = useState<EditState>(null);
  const [adding, setAdding] = useState<AddState>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    tree.units?.forEach((u) => { ids.add(u._id); u.equipmentModules?.forEach((em) => ids.add(em._id)); });
    return ids;
  });
  const [busy, setBusy] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const toggle = (id: string) =>
    setExpanded((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  /* ── Rename ─────────────────────────────────────────────────── */
  const startEdit = (id: string, nodeType: NodeType, name: string) => {
    setAdding(null); setEditing({ id, nodeType, value: name });
  };
  const saveEdit = async () => {
    if (!editing || !editing.value.trim() || busy) return;
    setBusy(true);
    try { await api.patch(PATCH_URL[editing.nodeType](editing.id), { name: editing.value.trim() }); setEditing(null); onUpdate(); }
    catch (e: any) { alert(e.message || 'Failed to rename'); }
    finally { setBusy(false); }
  };

  /* ── Delete ─────────────────────────────────────────────────── */
  const deleteNode = async (id: string, nodeType: NodeType, name: string) => {
    const warn = nodeType === 'unit' ? ' All equipment modules and control modules inside will also be deleted.' :
                 nodeType === 'em'   ? ' All control modules inside will also be deleted.' : '';
    if (!window.confirm(`Delete "${name}"?${warn}`)) return;
    setBusy(true);
    try { await api.delete(DELETE_URL[nodeType](id)); onUpdate(); }
    catch (e: any) { alert(e.message || 'Failed to delete'); }
    finally { setBusy(false); }
  };

  /* ── Add ────────────────────────────────────────────────────── */
  const startAdd = (parentId: string, parentType: 'machine' | 'unit' | 'em') => {
    setEditing(null); setAdding({ parentId, parentType, value: '' });
    setExpanded((prev) => new Set(prev).add(parentId));
  };
  const saveAdd = async () => {
    if (!adding || !adding.value.trim() || busy) return;
    setBusy(true);
    try {
      if (adding.parentType === 'machine') await api.post(`/machines/${adding.parentId}/units`, { name: adding.value.trim() });
      else if (adding.parentType === 'unit') await api.post(`/machines/units/${adding.parentId}/equipment-modules`, { name: adding.value.trim() });
      else await api.post(`/machines/equipment-modules/${adding.parentId}/control-modules`, { name: adding.value.trim() });
      setAdding(null); onUpdate();
    } catch (e: any) { alert(e.message || 'Failed to add'); }
    finally { setBusy(false); }
  };

  /* ── Reorder ────────────────────────────────────────────────── */
  const reorderUnits = async (ids: string[]) => {
    setUnits((prev) => ids.map((id) => prev.find((u) => u._id === id)!).filter(Boolean));
    try { await api.post('/machines/units/reorder', { ids }); onUpdate(); }
    catch { onUpdate(); }
  };

  const reorderEMs = async (unitId: string, ids: string[]) => {
    setUnits((prev) => prev.map((u) => u._id !== unitId ? u : {
      ...u,
      equipmentModules: ids.map((id) => u.equipmentModules?.find((e) => e._id === id)!).filter(Boolean),
    }));
    try { await api.post('/machines/equipment-modules/reorder', { ids }); onUpdate(); }
    catch { onUpdate(); }
  };

  const reorderCMs = async (emId: string, ids: string[]) => {
    setUnits((prev) => prev.map((u) => ({
      ...u,
      equipmentModules: u.equipmentModules?.map((em) => em._id !== emId ? em : {
        ...em,
        controlModules: ids.map((id) => em.controlModules?.find((c) => c._id === id)!).filter(Boolean),
      }),
    })));
    try { await api.post('/machines/control-modules/reorder', { ids }); onUpdate(); }
    catch { onUpdate(); }
  };

  const handleUnitDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = units.map((u) => u._id);
    const oldIdx = ids.indexOf(active.id as string);
    const newIdx = ids.indexOf(over.id as string);
    if (oldIdx === -1 || newIdx === -1) return;
    reorderUnits(arrayMove(ids, oldIdx, newIdx));
  };

  if (!units.length) {
    return (
      <>
        <ImportPanel machineId={machineId} onImported={onUpdate} />
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-fg-muted">No units yet. Add one to start building the structure.</p>
          <button onClick={() => startAdd(machineId, 'machine')}
            className="flex items-center gap-1.5 rounded-lg border border-brand-300 px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-colors">
            <Plus className="h-4 w-4" /> Add Unit
          </button>
        </div>
        {adding?.parentType === 'machine' && (
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50/30 dark:bg-brand-950/10 px-4 py-3 mt-3">
            <LevelPill level="unit" />
            <InlineInput value={adding.value} onChange={(v) => setAdding((a) => a ? { ...a, value: v } : null)}
              onSave={saveAdd} onCancel={() => setAdding(null)} placeholder="New unit name…" />
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <ImportPanel machineId={machineId} onImported={onUpdate} />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleUnitDragEnd}>
        <SortableContext items={units.map((u) => u._id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {units.map((unit) => (
              <SortableUnitSection
                key={unit._id}
                unit={unit}
                editing={editing}
                adding={adding}
                expanded={expanded}
                onToggle={toggle}
                onStartEdit={() => startEdit(unit._id, 'unit', unit.name)}
                onChangeEdit={(v) => setEditing((e) => e ? { ...e, value: v } : null)}
                onSaveEdit={saveEdit}
                onCancelEdit={() => setEditing(null)}
                onDelete={() => deleteNode(unit._id, 'unit', unit.name)}
                onStartAddEm={() => startAdd(unit._id, 'unit')}
                onChangeAdd={(v) => setAdding((a) => a ? { ...a, value: v } : null)}
                onSaveAdd={saveAdd}
                onCancelAdd={() => setAdding(null)}
                onReorderEMs={(ids) => reorderEMs(unit._id, ids)}
                onStartAddCm={(emId) => startAdd(emId, 'em')}
                onReorderCMs={(emId, ids) => reorderCMs(emId, ids)}
                onDeleteEm={(id, name) => deleteNode(id, 'em', name)}
                onDeleteCm={(id, name) => deleteNode(id, 'cm', name)}
                onStartEditEm={(id, name) => startEdit(id, 'em', name)}
                onStartEditCm={(id, name) => startEdit(id, 'cm', name)}
              />
            ))}

            {/* Add Unit inline input */}
            {adding?.parentType === 'machine' ? (
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50/30 dark:bg-brand-950/10 px-4 py-3">
                <LevelPill level="unit" />
                <InlineInput value={adding.value} onChange={(v) => setAdding((a) => a ? { ...a, value: v } : null)}
                  onSave={saveAdd} onCancel={() => setAdding(null)} placeholder="New unit name…" />
              </div>
            ) : (
              <button onClick={() => startAdd(machineId, 'machine')}
                className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm font-medium text-fg-muted hover:border-brand-300 hover:bg-brand-50/30 hover:text-brand-600 dark:hover:bg-brand-950/10 transition-colors">
                <Plus className="h-4 w-4" /> Add Unit
              </button>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}

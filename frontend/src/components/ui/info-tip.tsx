'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { GlossaryEntry, GlossaryTerm, glossary } from '@/lib/glossary';

const PANEL_WIDTH = 288;
const GAP = 8;
const EDGE = 12;

type Placement = { top: number; left: number; arrow: number; above: boolean };

/**
 * An explanation attached to a field label.
 *
 * Opens on hover, on keyboard focus, and on tap, so it works on a phone as well
 * as a desktop — the native `title` attribute does none of those. The panel is
 * portalled to the body and positioned fixed, because most of these labels sit
 * inside scrolling modals that would otherwise clip it.
 */
export function InfoTip({ term, label }: { term: GlossaryTerm; label?: string }) {
  // `satisfies` keeps the key names precise, so widen the value to read the
  // fields that only some entries carry.
  const entry: GlossaryEntry = glossary[term];
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const position = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(PANEL_WIDTH, window.innerWidth - EDGE * 2);

    // Keep the panel on screen, then point the arrow back at the trigger.
    const preferred = rect.left + rect.width / 2 - width / 2;
    const left = Math.max(EDGE, Math.min(preferred, window.innerWidth - width - EDGE));
    const above = rect.top > window.innerHeight - rect.bottom;

    setPlacement({
      top: above ? rect.top - GAP : rect.bottom + GAP,
      left,
      arrow: rect.left + rect.width / 2 - left,
      above,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    position();
    const close = () => setOpen(false);
    // Reposition would lag the trigger during a scroll, so dismiss instead.
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open, position]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open]);

  const panel = open && placement && typeof document !== 'undefined' ? createPortal(
    <div
      id={panelId}
      role="tooltip"
      style={{
        position: 'fixed',
        top: placement.top,
        left: placement.left,
        width: Math.min(PANEL_WIDTH, typeof window === 'undefined' ? PANEL_WIDTH : window.innerWidth - EDGE * 2),
        transform: placement.above ? 'translateY(-100%)' : undefined,
      }}
      className="z-[300] rounded-lg border border-border bg-surface p-3 text-left shadow-lg"
    >
      <span
        aria-hidden="true"
        style={{ left: placement.arrow, [placement.above ? 'bottom' : 'top']: -4.5 } as React.CSSProperties}
        className="absolute h-2 w-2 -translate-x-1/2 rotate-45 border-border bg-surface"
      />
      <p className="text-sm font-semibold text-fg">{entry.full}</p>
      <p className="mt-1 text-xs leading-relaxed text-fg-secondary">{entry.description}</p>
      {entry.format && (
        <p className="mt-2 flex flex-wrap items-baseline gap-1.5 text-xs text-fg-muted">
          <span>Looks like</span>
          <code className="rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-[11px] text-fg">{entry.format}</code>
        </p>
      )}
      {entry.issuedBy && <p className="mt-1.5 text-[11px] text-fg-muted">{entry.issuedBy}</p>}
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`What is ${label || entry.full}?`}
        aria-expanded={open}
        aria-describedby={open ? panelId : undefined}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex shrink-0 items-center text-fg-muted transition-colors hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:hover:text-brand-400"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {panel}
    </>
  );
}

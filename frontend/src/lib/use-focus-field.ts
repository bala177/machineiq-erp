'use client';

import { useEffect } from 'react';

const RING_CLASS = 'field-focus-ring';

/**
 * How long the ring survives if the reader never touches the page. Long enough to still be
 * there when they finish reading the surrounding labels, short enough not to linger on a tab
 * left open. Any interaction clears it sooner.
 */
const FALLBACK_MS = 8000;

/**
 * Scrolls to and rings the field named by `?focus=`, once `ready` is true.
 *
 * `ready` exists because the destination usually renders its fields only after loading data —
 * running before then would find nothing. An unrecognised name is ignored rather than treated
 * as an error, so a stale bookmark still opens the page.
 */
export function useFocusField(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    const name = new URLSearchParams(window.location.search).get('focus');
    if (!name) return;
    const target = document.querySelector<HTMLElement>(`[data-field="${CSS.escape(name)}"]`);
    if (!target) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    target.classList.add(RING_CLASS);

    let timer = 0;
    const clear = () => {
      target.classList.remove(RING_CLASS);
      window.clearTimeout(timer);
      document.removeEventListener('pointerdown', clear);
      document.removeEventListener('keydown', clear);
    };

    timer = window.setTimeout(clear, FALLBACK_MS);
    document.addEventListener('pointerdown', clear);
    document.addEventListener('keydown', clear);
    return clear;
  }, [ready]);
}

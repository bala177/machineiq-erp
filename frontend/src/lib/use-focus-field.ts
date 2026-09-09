'use client';

import { useEffect } from 'react';

const RING_CLASS = 'field-focus-ring';

/**
 * How long the mark survives if the reader never touches the page. Long enough to still be
 * there when they finish reading the labels around it, short enough not to linger on a tab
 * left open. Any interaction clears it sooner.
 */
const FALLBACK_MS = 8000;

/** How long to wait for a destination that is still loading the section holding the field. */
const APPEAR_TIMEOUT_MS = 5000;

/**
 * Scrolls to and marks the field named by `?focus=`.
 *
 * The field often does not exist yet when this first runs — the destination is still fetching
 * the section that contains it — so this waits for the field to appear rather than requiring
 * every caller to report its own loading state. An unrecognised name is ignored rather than
 * treated as an error, so a stale bookmark still opens the page.
 *
 * @param ready pass false to defer entirely; the default suits pages that render immediately.
 */
export function useFocusField(ready = true) {
  useEffect(() => {
    if (!ready) return;
    const name = new URLSearchParams(window.location.search).get('focus');
    if (!name) return;
    const selector = `[data-field="${CSS.escape(name)}"]`;

    let release = () => {};

    const mark = (target: HTMLElement) => {
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
      release = clear;
    };

    const present = document.querySelector<HTMLElement>(selector);
    if (present) {
      mark(present);
      return () => release();
    }

    const observer = new MutationObserver(() => {
      const target = document.querySelector<HTMLElement>(selector);
      if (!target) return;
      observer.disconnect();
      window.clearTimeout(giveUp);
      mark(target);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const giveUp = window.setTimeout(() => observer.disconnect(), APPEAR_TIMEOUT_MS);

    return () => {
      observer.disconnect();
      window.clearTimeout(giveUp);
      release();
    };
  }, [ready]);
}

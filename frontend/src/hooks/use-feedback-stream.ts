'use client';

import { useEffect, useRef } from 'react';
import { getFeedbackSocket } from '@/lib/socket';

type Scope = 'admin' | 'mine';

/**
 * Calls `onChange` whenever feedback in `scope` changes anywhere in the system.
 *
 * The socket carries no feedback content — only the fact that something moved —
 * so the caller refetches through the authorized REST endpoints.
 *
 * Window focus is a deliberate second trigger: if the session token expires
 * while a tab sits open the socket drops silently, and refocusing the tab is
 * the moment a stale page would otherwise be noticed.
 */
export function useFeedbackStream(scope: Scope, onChange: () => void, enabled = true) {
  const handler = useRef(onChange);
  handler.current = onChange;

  useEffect(() => {
    if (!enabled) return;
    const notify = () => handler.current();
    const onSignal = (payload: { scope?: Scope }) => {
      if (payload?.scope === scope) notify();
    };

    const socket = getFeedbackSocket();
    socket?.on('feedback:changed', onSignal);
    window.addEventListener('focus', notify);

    return () => {
      socket?.off('feedback:changed', onSignal);
      window.removeEventListener('focus', notify);
    };
  }, [scope, enabled]);
}

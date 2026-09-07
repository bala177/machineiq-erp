'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';

/**
 * Signs a user out after a period of inactivity, with a countdown warning first.
 *
 * Activity is stored as a timestamp in localStorage rather than tracked with a
 * running timer, so the session is judged on elapsed wall-clock time: a laptop
 * that sleeps for two hours is idle when it wakes, and activity in one tab keeps
 * every other tab signed in.
 *
 * This is a client-side control. It clears the stored token and returns the user
 * to the sign-in screen, but the token itself stays valid on the server until it
 * expires (JWT_EXPIRATION). Enforcing idle expiry server-side needs short-lived
 * tokens with a refresh flow.
 */

const ACTIVITY_KEY = 'machineiq_last_activity';
export const SIGNED_OUT_REASON_KEY = 'machineiq_signed_out_reason';

const positiveNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

/** Total idle time allowed before the session ends. */
const IDLE_MS = positiveNumber(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES, 30) * 60_000;
/** How long the warning is shown before the session ends. */
const WARNING_MS = Math.min(positiveNumber(process.env.NEXT_PUBLIC_IDLE_WARNING_SECONDS, 120) * 1_000, IDLE_MS - 5_000);

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'wheel', 'click', 'focus'] as const;
/** Activity is common; only write to storage this often. */
const WRITE_INTERVAL_MS = 5_000;

const readLastActivity = () => {
  try {
    const stored = Number(localStorage.getItem(ACTIVITY_KEY));
    return Number.isFinite(stored) && stored > 0 ? stored : Date.now();
  } catch {
    return Date.now();
  }
};

const countdown = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

export function SessionTimeout() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  // Once the warning is up, only an explicit choice clears it — a stray mouse
  // move should not be taken as proof somebody is there.
  const warningShown = useRef(false);

  const markActive = useCallback(() => {
    try { localStorage.setItem(ACTIVITY_KEY, String(Date.now())); } catch { /* storage unavailable */ }
  }, []);

  const endSession = useCallback(() => {
    try { sessionStorage.setItem(SIGNED_OUT_REASON_KEY, 'idle'); } catch { /* storage unavailable */ }
    try { localStorage.removeItem(ACTIVITY_KEY); } catch { /* storage unavailable */ }
    warningShown.current = false;
    setRemainingMs(null);
    logout();
    router.replace('/login');
  }, [logout, router]);

  useEffect(() => {
    if (!user) return;
    markActive();

    let lastWrite = 0;
    const onActivity = () => {
      if (warningShown.current) return;
      const now = Date.now();
      if (now - lastWrite < WRITE_INTERVAL_MS) return;
      lastWrite = now;
      markActive();
    };

    for (const event of ACTIVITY_EVENTS) window.addEventListener(event, onActivity, { passive: true });
    return () => { for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, onActivity); };
  }, [user, markActive]);

  useEffect(() => {
    if (!user) return;
    const tick = setInterval(() => {
      const idleFor = Date.now() - readLastActivity();
      if (idleFor >= IDLE_MS) {
        endSession();
      } else if (idleFor >= IDLE_MS - WARNING_MS) {
        warningShown.current = true;
        setRemainingMs(IDLE_MS - idleFor);
      } else if (warningShown.current) {
        // Another tab reported activity — stand down.
        warningShown.current = false;
        setRemainingMs(null);
      }
    }, 1_000);
    return () => clearInterval(tick);
  }, [user, endSession]);

  const staySignedIn = () => {
    warningShown.current = false;
    setRemainingMs(null);
    markActive();
  };

  if (!user || remainingMs === null) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div role="alertdialog" aria-modal="true" aria-labelledby="session-timeout-title" aria-describedby="session-timeout-body" className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <h2 id="session-timeout-title" className="text-base font-bold text-fg">Still there?</h2>
            <p className="text-xs text-fg-muted">Signing out in {countdown(remainingMs)}</p>
          </div>
        </div>

        <p id="session-timeout-body" className="mt-4 text-sm leading-relaxed text-fg-secondary">
          You have been inactive for a while. We sign you out automatically to keep your company data safe on shared screens. Any draft you have not saved will be lost.
        </p>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={endSession} className="btn-secondary">Sign out now</button>
          <button type="button" autoFocus onClick={staySignedIn} className="btn-primary">Stay signed in</button>
        </div>
      </div>
    </div>
  );
}

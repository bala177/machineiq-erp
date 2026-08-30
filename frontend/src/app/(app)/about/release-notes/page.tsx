'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { RELEASES, type ChangeType } from '@/lib/app-meta';

const TYPE_STYLE: Record<ChangeType, { label: string; pill: string; dot: string }> = {
  feature:     { label: 'New',      pill: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',  dot: 'bg-violet-500'  },
  improvement: { label: 'Improved', pill: 'bg-sky-100    text-sky-700    dark:bg-sky-950/40    dark:text-sky-300',     dot: 'bg-sky-500'     },
  fix:         { label: 'Fix',      pill: 'bg-amber-100  text-amber-700  dark:bg-amber-950/40  dark:text-amber-300',   dot: 'bg-amber-500'   },
  security:    { label: 'Security', pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', dot: 'bg-emerald-500' },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ReleaseNotesPage() {
  return (
    <div className="mx-auto max-w-5xl pb-10">

      {/* ── Back + header ────────────────────────────────────────── */}
      <div className="mb-6">
        <Link
          href="/about"
          className="btn-back mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to About
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-fg">Release Notes</h1>
        <p className="mt-1 text-sm text-fg-muted">We ship continuously. Every release is documented here.</p>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-fg-muted">Legend</span>
          <span className="text-fg-muted">&middot;</span>
          {(Object.entries(TYPE_STYLE) as [ChangeType, (typeof TYPE_STYLE)[ChangeType]][]).map(([, cfg]) => (
            <span
              key={cfg.label}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${cfg.pill}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Releases ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        {RELEASES.map((release) => (
          <article key={release.version} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">

            {/* Release header */}
            <div className="flex flex-wrap items-center gap-2.5 border-b border-border bg-surface-secondary/50 px-5 py-3.5">
              <span className="rounded-lg bg-brand-50 px-2.5 py-1 font-mono text-sm font-bold text-brand-700 dark:bg-brand-950/30 dark:text-brand-300">
                v{release.version}
              </span>
              <span className="text-xs text-fg-muted">{fmtDate(release.date)}</span>
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                {release.channel}
              </span>
            </div>

            {/* Entries */}
            <ul className="divide-y divide-border">
              {release.entries.map((entry, idx) => {
                const cfg = TYPE_STYLE[entry.type];
                return (
                  <li key={idx} className="flex items-baseline gap-3 px-5 py-3">
                    <span className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide leading-none ${cfg.pill}`}>
                      {cfg.label}
                    </span>
                    <span className="text-sm leading-relaxed text-fg-secondary">{entry.text}</span>
                  </li>
                );
              })}
            </ul>

          </article>
        ))}
      </div>

    </div>
  );
}

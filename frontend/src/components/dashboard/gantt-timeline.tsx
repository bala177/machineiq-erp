'use client';

import Link from 'next/link';
import type { ProjectSummary } from './types';

const HEALTH_BAR: Record<string, string> = {
  healthy: 'bg-emerald-500',
  watch:   'bg-amber-400',
  at_risk: 'bg-orange-500',
  delayed: 'bg-red-500',
};

function buildMonths(start: Date, end: Date): { label: string; year: number; month: number }[] {
  const months: { label: string; year: number; month: number }[] = [];
  const d = new Date(start.getFullYear(), start.getMonth(), 1);
  while (d <= end) {
    months.push({
      label: d.toLocaleString('default', { month: 'short' }),
      year: d.getFullYear(),
      month: d.getMonth(),
    });
    d.setMonth(d.getMonth() + 1);
  }
  return months;
}

function pct(date: Date, rangeStart: Date, rangeEnd: Date): number {
  const total = rangeEnd.getTime() - rangeStart.getTime();
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, ((date.getTime() - rangeStart.getTime()) / total) * 100));
}

export function GanttTimeline({ projects }: { projects: ProjectSummary[] }) {
  if (projects.length === 0) return null;

  const now = new Date();
  const yearEnd = new Date(now.getFullYear(), 11, 31);

  const allDates = projects.flatMap((p) => {
    const dates: Date[] = [];
    if (p.createdAt) dates.push(new Date(p.createdAt));
    if (p.targetDeliveryDate) dates.push(new Date(p.targetDeliveryDate));
    return dates;
  });

  const rangeStart = allDates.length
    ? new Date(Math.min(now.getTime(), ...allDates.map((d) => d.getTime())))
    : now;
  const rangeEnd = allDates.length
    ? new Date(Math.max(yearEnd.getTime(), ...allDates.map((d) => d.getTime())))
    : yearEnd;

  // Pad range to full months
  const viewStart = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  const viewEnd = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth() + 1, 0);

  const months = buildMonths(viewStart, viewEnd);
  const todayPct = pct(now, viewStart, viewEnd);
  const labelOffset = 124;

  return (
    <div className="card overflow-x-auto p-3.5">
      <div className="min-w-[560px]">
        {/* Month header */}
        <div className="mb-2 flex text-[13px] font-semibold uppercase tracking-[0.16em] text-fg-muted" style={{ paddingLeft: `${labelOffset}px` }}>
          {months.map((m, i) => (
            <div key={i} className="flex-1 text-center">{m.label}</div>
          ))}
        </div>

        {/* Project rows */}
        <div className="space-y-2.5">
          {projects.map((p) => {
            const barColor = HEALTH_BAR[p.health] ?? HEALTH_BAR['watch'];
            const start = p.createdAt ? new Date(p.createdAt) : viewStart;
            const end = p.targetDeliveryDate ? new Date(p.targetDeliveryDate) : viewEnd;
            const leftPct = pct(start < viewStart ? viewStart : start, viewStart, viewEnd);
            const rightPct = pct(end > viewEnd ? viewEnd : end, viewStart, viewEnd);
            const widthPct = Math.max(0.5, rightPct - leftPct);

            return (
              <div key={p._id} className="flex items-center gap-2.5">
                <Link href={`/projects/${p._id}?ref=dashboard`} className="w-[116px] flex-shrink-0 truncate text-[13px] font-medium text-fg-secondary transition-colors hover:text-brand-600">
                  {p.name}
                </Link>
                <div className="relative h-4 flex-1">
                  {/* Month grid lines */}
                  {months.map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-l border-border/50"
                      style={{ left: `${(i / months.length) * 100}%` }}
                    />
                  ))}
                  {/* Bar */}
                  <div
                    className={`absolute top-[3px] bottom-[3px] rounded-full opacity-85 ${barColor}`}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  />
                  {/* Today marker */}
                  <div
                    className="absolute top-0 bottom-0 z-10 w-0.5 bg-red-500"
                    style={{ left: `${todayPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Today label */}
        <div className="relative mt-1" style={{ paddingLeft: `${labelOffset}px` }}>
          <div className="relative h-4">
            <div
              className="absolute -translate-x-1/2 text-[12px] font-semibold uppercase tracking-wide text-red-500"
              style={{ left: `${todayPct}%` }}
            >
              Today
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { ReactNode } from 'react';

type Accent = 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'violet';

const accentStyles: Record<Accent, { top: string; icon: string; value: string }> = {
  blue:   { top: 'border-t-brand-500',   icon: 'bg-brand-50 dark:bg-brand-950/30 text-brand-600',       value: 'text-fg' },
  green:  { top: 'border-t-emerald-500', icon: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600', value: 'text-fg' },
  amber:  { top: 'border-t-amber-400',   icon: 'bg-amber-50 dark:bg-amber-950/30 text-amber-500',       value: 'text-fg' },
  red:    { top: 'border-t-red-500',     icon: 'bg-red-50 dark:bg-red-950/30 text-red-600',             value: 'text-fg' },
  slate:  { top: 'border-t-slate-300 dark:border-t-slate-600', icon: 'bg-surface-secondary text-fg-tertiary', value: 'text-fg' },
  violet: { top: 'border-t-violet-500',  icon: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600',    value: 'text-fg' },
};

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  accent?: Accent;
  href?: string;
}

export function KpiCard({ label, value, icon, accent = 'blue', href }: KpiCardProps) {
  const s = accentStyles[accent];
  const inner = (
    <div className={`card border-t-[3px] ${s.top} flex h-[78px] flex-col justify-between px-3.5 py-3 transition-all duration-200 ${href ? 'cursor-pointer hover:shadow-card-hover' : ''}`}>
      {/* Top row: label + icon */}
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-[13px] font-semibold uppercase tracking-[0.14em] leading-tight text-fg-muted">
          {label}
        </p>
        {icon && (
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${s.icon}`}>
            <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
          </div>
        )}
      </div>
      {/* Bottom row: value */}
      <p className={`font-mono text-[24px] font-bold leading-none tracking-tight ${s.value}`}>
        {value}
      </p>
    </div>
  );

  if (href) {
    const url = href.includes('?') ? `${href}&ref=dashboard` : `${href}?ref=dashboard`;
    return <Link href={url}>{inner}</Link>;
  }
  return inner;
}

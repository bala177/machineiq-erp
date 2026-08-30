import { clsx } from 'clsx';
import { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'slate';
}

const accentStyles = {
  blue: { border: 'border-l-brand-500', icon: 'bg-brand-50 dark:bg-brand-950/30 text-brand-600', glow: 'shadow-brand-500/5' },
  green: { border: 'border-l-emerald-500', icon: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600', glow: 'shadow-emerald-500/5' },
  amber: { border: 'border-l-amber-500', icon: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600', glow: 'shadow-amber-500/5' },
  red: { border: 'border-l-red-500', icon: 'bg-red-50 dark:bg-red-950/30 text-red-600', glow: 'shadow-red-500/5' },
  slate: { border: 'border-l-slate-400', icon: 'bg-surface-secondary text-fg-tertiary', glow: 'shadow-slate-500/5' },
};

export function MetricCard({ label, value, icon, trend, trendValue, accent = 'blue' }: MetricCardProps) {
  const styles = accentStyles[accent];
  return (
    <div className={clsx('card border-l-4 p-5 transition-all duration-200 hover:shadow-card-hover', styles.border)}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-fg font-mono">{value}</p>
          {trendValue && (
            <p
              className={clsx('mt-1.5 flex items-center gap-1 text-xs font-semibold', {
                'text-emerald-600': trend === 'up',
                'text-red-600': trend === 'down',
                'text-slate-500 dark:text-slate-400': trend === 'flat',
              })}
            >
              {trendValue}
            </p>
          )}
        </div>
        {icon && <div className={clsx('ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', styles.icon)}>{icon}</div>}
      </div>
    </div>
  );
}

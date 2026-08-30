import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface AlertBannerProps {
  /** 'error' = red (blocked/critical), 'warning' = amber (overdue/watch) */
  variant: 'error' | 'warning';
  title: string;
  body?: string;
  /** Optional badges / actions rendered below the body text */
  children?: ReactNode;
  onClick?: () => void;
}

/**
 * Left-border alert banner for surface-level inline alerts —
 * e.g. blocked tasks, overdue items, procurement risks.
 */
export function AlertBanner({ variant, title, body, children, onClick }: AlertBannerProps) {
  const isError = variant === 'error';

  return (
    <div role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} onClick={onClick} onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined} className={clsx('rounded-lg border-l-4 px-3.5 py-3', onClick && 'cursor-pointer transition-opacity duration-100 hover:opacity-80', isError ? 'border-red-500 bg-red-50 dark:bg-red-950/30' : 'border-amber-400 bg-amber-50 dark:bg-amber-950/30')}>
      <p className={clsx('text-xs font-semibold', isError ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-500')}>{title}</p>
      {body && <p className={clsx('mt-0.5 text-xs leading-relaxed', isError ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-500')}>{body}</p>}
      {children && <div className="mt-2 flex flex-wrap gap-1.5">{children}</div>}
    </div>
  );
}

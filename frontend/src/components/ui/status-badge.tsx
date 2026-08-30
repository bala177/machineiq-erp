import { clsx } from 'clsx';
import { STATUS_COLORS, formatStatus } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS['not_started'];
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full font-semibold', colors.bg, colors.text, size === 'sm' ? 'px-2.5 py-0.5 text-[15px]' : 'px-3 py-1 text-xs')}>
      <span className={clsx('h-1.5 w-1.5 rounded-full', colors.dot)} />
      {formatStatus(status)}
    </span>
  );
}

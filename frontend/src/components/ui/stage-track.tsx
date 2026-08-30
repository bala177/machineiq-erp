import { clsx } from 'clsx';

interface StageTrackProps {
  /** Ordered list of all stage keys */
  stages: string[];
  /** The currently active stage key */
  currentStage: string;
  /**
   * First stage that applies to this entity. Stages before startStage were
   * never entered — shown as dimmed "—" rather than ✓ done.
   * Defaults to the first stage in the array.
   */
  startStage?: string;
  /**
   * 'rejected' colours the current stage pill red and appends a ✗ marker,
   * signalling the request was stopped at that point.
   */
  variant?: 'rejected';
  /** Optional formatter — defaults to replacing underscores with spaces and title-casing */
  formatLabel?: (stage: string) => string;
}

function defaultFormat(stage: string) {
  return stage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Horizontal scrollable stage-progress track.
 *
 * - Skipped stages (before startStage)  → dimmed "—"
 * - Done stages (startStage..current-1) → green ✓ pill
 * - Current stage                       → brand-blue pill (or red when variant="rejected")
 * - Upcoming stages                     → muted text
 */
export function StageTrack({ stages, currentStage, startStage, variant, formatLabel = defaultFormat }: StageTrackProps) {
  const currentIndex = stages.indexOf(currentStage);
  const startIndex   = startStage ? stages.indexOf(startStage) : 0;
  const isRejected   = variant === 'rejected';

  return (
    <div className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {stages.map((stage, index) => {
        const isSkipped = index < startIndex;
        const isDone    = !isSkipped && index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={stage} className="flex shrink-0 items-center">
            <div className={clsx(
              'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap',
              isSkipped && 'text-fg-muted/40 select-none',
              isDone    && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
              isCurrent && !isRejected && 'bg-brand-600 text-white shadow-sm',
              isCurrent && isRejected  && 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
              !isSkipped && !isDone && !isCurrent && 'text-fg-muted',
            )}>
              {isSkipped ? '—' : formatLabel(stage)}
              {isDone && ' ✓'}
              {isCurrent && isRejected && ' ✗'}
            </div>
            {index < stages.length - 1 && (
              <div className={clsx(
                'mx-1 h-px w-4 shrink-0',
                isSkipped         ? 'bg-border/30' :
                index < currentIndex ? 'bg-emerald-400 dark:bg-emerald-600' :
                                       'bg-border',
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import type { ProjectSummary } from './types';

const STAGES = [
  { key: 'inquiry',                  label: 'Inquiry' },
  { key: 'feasibility',              label: 'Feasibility' },
  { key: 'concept_approved',         label: 'Concept' },
  { key: 'engineering_in_progress',  label: 'Engineering' },
  { key: 'review_release',           label: 'Review' },
  { key: 'procurement_in_progress',  label: 'Procurement' },
  { key: 'build_assembly',           label: 'Assembly' },
  { key: 'fat_sat',                  label: 'FAT/SAT' },
  { key: 'completed',                label: 'Done' },
];

function stageIndex(stage: string): number {
  const idx = STAGES.findIndex((s) => s.key === stage);
  return idx >= 0 ? idx : 0;
}

export function StageProgressTrack({ projects }: { projects: ProjectSummary[] }) {
  if (projects.length === 0) return null;

  return (
    <div className="card overflow-x-auto p-3.5">
      <div className="min-w-[560px] space-y-2.5">
        {projects.map((p) => {
          const currentIdx = stageIndex(p.stage);
          const isOverdue = !!p.targetDeliveryDate && new Date(p.targetDeliveryDate) < new Date();

          return (
            <div key={p._id} className="flex items-center gap-2.5">
              {/* Project name */}
              <Link
                href={`/projects/${p._id}?ref=dashboard`}
                className="w-[116px] flex-shrink-0 truncate text-[13px] font-medium text-fg-secondary transition-colors hover:text-brand-600"
              >
                {p.name}
              </Link>

              {/* Stage dots */}
              <div className="flex flex-1 items-center">
                {STAGES.map((s, i) => {
                  const isPast    = i < currentIdx;
                  const isCurrent = i === currentIdx;
                  const dot = isPast
                    ? 'bg-emerald-500 border-emerald-500'
                    : isCurrent
                    ? 'bg-brand-600 border-brand-600 ring-2 ring-brand-200 dark:ring-brand-800'
                    : 'bg-surface border-border';

                  return (
                    <div key={s.key} className="flex flex-1 items-center">
                      <div className={`h-3 w-3 flex-shrink-0 rounded-full border-2 transition-all ${dot}`} title={s.label} />
                      {i < STAGES.length - 1 && (
                        <div className={`h-0.5 flex-1 ${isPast ? 'bg-emerald-400' : 'bg-border'}`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Completion + date */}
              <div className="w-[72px] flex-shrink-0 text-right text-[13px] text-fg-muted">
                <span className="font-semibold text-fg">{p.completionPct}%</span>
                {p.targetDeliveryDate && (
                  <div className={isOverdue ? 'font-medium text-red-500' : ''}>
                    {formatDate(p.targetDeliveryDate)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

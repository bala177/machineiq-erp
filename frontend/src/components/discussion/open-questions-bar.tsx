import { AlertCircle } from 'lucide-react';
import { DiscussionEntry } from '@/lib/discussion';

interface OpenQuestionsBarProps {
  entries: DiscussionEntry[];
}

export function OpenQuestionsBar({ entries }: OpenQuestionsBarProps) {
  const open = entries.filter((e) => e.isOpenQuestion && !e.resolvedAt);

  if (open.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 flex gap-3">
      <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-800">
          {open.length} open question{open.length !== 1 ? 's' : ''} need{open.length === 1 ? 's' : ''} follow-up
        </p>
        <ul className="mt-1 space-y-0.5">
          {open.slice(0, 3).map((e) => (
            <li key={e._id} className="text-xs text-amber-700 truncate">
              &bull; <span dangerouslySetInnerHTML={{ __html: e.content.replace(/<[^>]*>/g, ' ').slice(0, 100) }} />
            </li>
          ))}
          {open.length > 3 && (
            <li className="text-xs text-amber-600">and {open.length - 3} more...</li>
          )}
        </ul>
      </div>
    </div>
  );
}

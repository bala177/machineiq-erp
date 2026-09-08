'use client';

import { GlossaryTerm } from '@/lib/glossary';
import { InfoTip } from '@/components/ui/info-tip';

/**
 * A form label, optionally carrying an explanation of the term it names.
 *
 * `term` pulls the wording from the shared glossary so the same field means the
 * same thing everywhere; `tooltip` remains for one-off notes that are specific
 * to a single form.
 */
export function FieldLabel({ children, required, term, tooltip, as = 'label', className = '' }: {
  children: React.ReactNode;
  required?: boolean;
  term?: GlossaryTerm;
  tooltip?: string;
  /** Use `span` when the label is already wrapped in a <label> element. */
  as?: 'label' | 'span';
  className?: string;
}) {
  const Tag = as;
  return (
    <Tag className={`mb-1.5 flex items-center gap-1.5 text-sm font-medium text-fg-secondary ${className}`}>
      <span>{children}{required && <span className="text-red-500"> *</span>}</span>
      {term
        ? <InfoTip term={term} label={typeof children === 'string' ? children : undefined} />
        : tooltip && <span title={tooltip} aria-label={tooltip} className="inline-flex cursor-help text-fg-muted"><InfoGlyph /></span>}
    </Tag>
  );
}

function InfoGlyph() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>;
}

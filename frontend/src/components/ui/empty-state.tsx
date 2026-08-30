'use client';

export function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface-tertiary/30 py-20 text-center animate-fade-in">
      {icon && <div className="mb-4 text-fg-muted">{icon}</div>}
      <h3 className="text-sm font-semibold text-fg-secondary">{title}</h3>
      {description && <p className="mt-1.5 max-w-xs text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

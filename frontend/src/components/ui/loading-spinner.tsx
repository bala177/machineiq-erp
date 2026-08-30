export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-border border-t-brand-600" />
      <p className="mt-3 text-xs font-medium text-fg-muted">Loading...</p>
    </div>
  );
}

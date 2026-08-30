export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[15px] font-semibold uppercase tracking-wider text-fg-muted">
      {children}
    </p>
  );
}

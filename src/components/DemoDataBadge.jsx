/** Small label used wherever non-live (presentation) data appears. */
export default function DemoDataBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-risk-medium ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-risk-medium" aria-hidden="true" />
      Demo data
    </span>
  );
}

/**
 * Empty-state panel: shown when a list has no records or a page has
 * no data to render (never filled with fake content).
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface/70 px-6 py-12 text-center ${className}`}
    >
      {Icon && (
        <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sage text-primary">
          <Icon size={22} aria-hidden="true" />
        </span>
      )}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** KPI card used on the dashboard overview. */
export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = 'primary',
  className = '',
}) {
  const accents = {
    primary: { chip: 'bg-sage text-primary', bar: 'bg-primary' },
    high: { chip: 'bg-risk-high/10 text-risk-high', bar: 'bg-risk-high' },
    medium: { chip: 'bg-risk-medium/10 text-risk-medium', bar: 'bg-risk-medium' },
    low: { chip: 'bg-risk-low/10 text-risk-low', bar: 'bg-risk-low' },
  };
  const theme = accents[accent] ?? accents.primary;

  return (
    <div className={`card relative overflow-hidden p-4 sm:p-5 ${className}`}>
      <span
        className={`absolute inset-x-0 top-0 h-1 ${theme.bar}`}
        aria-hidden="true"
        style={{ opacity: 0.85 }}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-ink">
            {value ?? '—'}
            {value !== null && value !== undefined && (
              <span className="sr-only"> records</span>
            )}
          </p>
          {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </div>
        {Icon && (
          <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${theme.chip}`}>
            <Icon size={18} aria-hidden="true" />
          </span>
        )}
      </div>
    </div>
  );
}

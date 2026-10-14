import { RefreshCw, TriangleAlert } from 'lucide-react';

/**
 * Friendly error panel. Never swallows the cause: it always shows the
 * backend/transport message and optionally offers a retry action.
 */
export default function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Retry',
  className = '',
}) {
  return (
    <div
      className={`rounded-2xl border border-risk-high/25 bg-risk-high/5 p-5 sm:p-6 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-risk-high/10 text-risk-high">
          <TriangleAlert size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          <p className="mt-1 break-words text-sm leading-relaxed text-muted">
            {message || 'An unexpected error occurred. Please try again.'}
          </p>
          {onRetry && (
            <button type="button" onClick={onRetry} className="btn-outline mt-4 px-4 py-2">
              <RefreshCw size={15} aria-hidden="true" /> {retryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

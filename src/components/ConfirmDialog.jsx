import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useEscapeKey } from '../hooks/index.js';

/**
 * Accessible confirmation dialog used before destructive actions.
 * - role="dialog" + aria-modal
 * - Escape and backdrop close it
 * - focus moves to the confirm button (or cancel for neutral dialogs)
 */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
  error = null,
}) {
  const confirmRef = useRef(null);
  const cancelRef = useRef(null);

  useEscapeKey(open, onCancel);

  useEffect(() => {
    if (!open) return;
    const target = destructive ? confirmRef.current : cancelRef.current;
    target?.focus();
  }, [open, destructive]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <button
        type="button"
        className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-raised">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-sage hover:text-primary"
        >
          <X size={16} />
        </button>

        <h2 id="confirm-title" className="pr-8 text-lg font-bold tracking-tight text-ink">
          {title}
        </h2>
        {message && <p className="mt-2 text-sm leading-relaxed text-muted">{message}</p>}
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-risk-high/10 px-3 py-2 text-sm text-risk-high">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button ref={cancelRef} type="button" onClick={onCancel} className="btn-outline px-4 py-2.5" disabled={busy}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={destructive ? 'btn-danger px-4 py-2.5' : 'btn-primary px-4 py-2.5'}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

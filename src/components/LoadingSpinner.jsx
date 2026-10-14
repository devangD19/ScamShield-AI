/** Loading indicator with an accessible label. */
export default function LoadingSpinner({ label = 'Loading…', size = 'md', className = '' }) {
  const dims = size === 'sm' ? 'h-4 w-4 border-2' : size === 'lg' ? 'h-10 w-10 border-4' : 'h-6 w-6 border-2';

  return (
    <div className={`flex items-center justify-center gap-3 text-muted ${className}`} role="status">
      <span
        className={`${dims} inline-block animate-spin rounded-full border-primary/25 border-t-primary motion-reduce:animate-spin`}
        aria-hidden="true"
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}

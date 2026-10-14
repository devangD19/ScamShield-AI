/** Consistent shield-based brand mark used on every page. */
export default function Logo({ size = 'md', showWordmark = true, className = '' }) {
  const sizes = {
    sm: { box: 'h-7 w-7', icon: 16, text: 'text-[15px]' },
    md: { box: 'h-9 w-9', icon: 20, text: 'text-lg' },
    lg: { box: 'h-12 w-12', icon: 26, text: 'text-2xl' },
  };
  const s = sizes[size] ?? sizes.md;

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`${s.box} inline-flex shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-[0_6px_16px_-8px_rgba(21,91,70,0.9)]`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" width={s.icon} height={s.icon} fill="none" aria-hidden="true">
          <path
            d="M12 2.6l7 2.7v6.2c0 4.4-2.9 8.3-7 9.9-4.1-1.6-7-5.5-7-9.9V5.3l7-2.7z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M8.8 12.1l2.2 2.2 4.2-4.6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {showWordmark && (
        <span className={`font-bold tracking-tight text-ink ${s.text}`}>
          ScamShield <span className="text-primary">AI</span>
        </span>
      )}
    </span>
  );
}

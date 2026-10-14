/** Decorative botanical sprig - editorial warmth without external assets. */
export function LeafSprig({ className = '', flip = false }) {
  return (
    <svg
      viewBox="0 0 160 120"
      className={className}
      fill="none"
      aria-hidden="true"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path
        d="M12 108C42 92 74 70 96 40"
        stroke="#8FAE86"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M46 84c-14-2-24-12-26-26 15 0 27 9 30 22" fill="#C9DDC0" />
      <path d="M70 66c-12-6-19-19-17-33 14 4 24 16 24 30" fill="#A9C79D" />
      <path d="M92 46c-6-13 0-28 13-36 6 14 3 29-8 38" fill="#C9DDC0" />
      <path d="M58 78c8 10 21 15 34 12-7-12-20-19-33-17" fill="#8FAE86" />
      <path d="M84 56c10 7 24 7 34-1-10-9-24-11-35-4" fill="#A9C79D" />
      <circle cx="106" cy="30" r="5" fill="#E7B85C" />
      <circle cx="120" cy="18" r="3.4" fill="#F0CD8A" />
    </svg>
  );
}

/** Small potted plant used at section corners. */
export function PottedPlant({ className = '' }) {
  return (
    <svg viewBox="0 0 120 140" className={className} fill="none" aria-hidden="true">
      <path d="M60 96V44" stroke="#6F9A6A" strokeWidth="3" strokeLinecap="round" />
      <path d="M60 62C46 60 34 50 32 34c16 0 29 10 32 24" fill="#B7D3AC" />
      <path d="M60 74c14-4 25-16 26-32-16 2-28 14-30 30" fill="#9BC08F" />
      <path d="M60 50c-9-8-12-22-7-35 12 8 16 22 11 34" fill="#CFE3C6" />
      <path d="M38 96h44l-6 34a6 6 0 0 1-6 5H50a6 6 0 0 1-6-5l-6-34z" fill="#D9A05B" />
      <path d="M34 92h52v8H34z" fill="#C1873F" />
    </svg>
  );
}

export default LeafSprig;

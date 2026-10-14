import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { OUTCOMES } from '../utils/risk.js';

const ICONS = {
  fraud: ShieldAlert,
  legit: CheckCircle2,
};

/**
 * Coloured + labelled prediction chip ("Potentially Fraudulent" /
 * "Likely Legitimate"). Always shows colour AND text/icon.
 * Renders nothing when the record has no prediction.
 */
export default function RiskBadge({ outcome, size = 'md', className = '' }) {
  const level = OUTCOMES[outcome];
  if (!level) return null;

  const Icon = ICONS[outcome];
  const sizeCls =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] gap-1'
      : size === 'lg'
        ? 'px-3.5 py-1.5 text-sm gap-1.5'
        : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${level.bg} ${level.border} ${level.text} ${sizeCls} ${className}`}
    >
      <Icon size={size === 'sm' ? 11 : 13} aria-hidden="true" />
      {level.label}
    </span>
  );
}

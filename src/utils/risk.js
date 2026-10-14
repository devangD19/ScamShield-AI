/**
 * Prediction vocabulary shared across the app.
 *
 * The backend owns the prediction (fraud probability + threshold); these
 * helpers only *present* it. There are exactly two outcomes. If a record has
 * no usable prediction we return null and the UI hides the element instead
 * of inventing a value.
 */

export const OUTCOMES = {
  fraud: {
    key: 'fraud',
    label: 'Potentially Fraudulent',
    description:
      'The model estimates this listing resembles fraudulent postings it was trained on. Verify the company and recruiter independently before sharing personal details or paying anything.',
    text: 'text-risk-high',
    bg: 'bg-risk-high/10',
    border: 'border-risk-high/25',
    solid: '#DC2626',
    tint: '#FDECEC',
    dot: 'bg-risk-high',
  },
  legit: {
    key: 'legit',
    label: 'Likely Legitimate',
    description:
      'The model did not find this listing similar enough to known fraudulent postings to flag it. This is not a guarantee — still verify the employer before proceeding.',
    text: 'text-risk-low',
    bg: 'bg-risk-low/10',
    border: 'border-risk-low/25',
    solid: '#16805D',
    tint: '#E7F4EE',
    dot: 'bg-risk-low',
  },
};

/** 'fraud' | 'legit' from a backend record, or null when it has no prediction. */
export function outcomeOf(record) {
  if (typeof record?.is_fraudulent === 'boolean') {
    return record.is_fraudulent ? 'fraud' : 'legit';
  }
  return null;
}

/** 0.6873 -> "68.7%". Returns null for anything that is not a 0-1 probability. */
export function formatProbability(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) return null;
  return `${(value * 100).toFixed(1)}%`;
}

/** Splits an array of phrases/signals coming from the backend into strings. */
export function toStringArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          return item.text ?? item.phrase ?? item.signal ?? item.name ?? item.label ?? '';
        }
        return '';
      })
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

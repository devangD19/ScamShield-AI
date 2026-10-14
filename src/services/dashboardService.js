import { request } from './api.js';

/**
 * Dashboard statistics API (signed-in user's own analyses)
 *
 * GET /api/v1/dashboard/stats
 * {
 *   "total_analyzed": 12,
 *   "fraudulent": 4,          // predicted Potentially Fraudulent
 *   "legitimate": 8,          // predicted Likely Legitimate
 *   "recent_analyses": [ ... ]
 * }
 *
 * Missing values are reported as null and rendered as "—" instead of
 * being invented.
 */
function pickNumber(source, key) {
  const value = source?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export async function getDashboardStats() {
  const data = await request({ method: 'get', url: '/dashboard/stats' });

  return {
    total: pickNumber(data, 'total_analyzed'),
    fraudulent: pickNumber(data, 'fraudulent'),
    legitimate: pickNumber(data, 'legitimate'),
    recent: Array.isArray(data?.recent_analyses) ? data.recent_analyses : null,
  };
}

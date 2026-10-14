import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  LayoutGrid,
  Plus,
  Search,
  ShieldAlert,
} from 'lucide-react';

import StatCard from '../components/StatCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import EmptyState from '../components/EmptyState.jsx';
import RiskBadge from '../components/RiskBadge.jsx';
import { getDashboardStats } from '../services/dashboardService.js';
import { useAsync, useDocumentTitle, useSession } from '../hooks/index.js';
import { OUTCOMES, formatProbability, outcomeOf } from '../utils/risk.js';
import { formatCount, formatDate, greetingFor } from '../utils/format.js';

/* ---------------- helpers ---------------- */

function pickString(record, keys) {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '—';
}

function normalizeRecord(record, index) {
  return {
    id: record?.id ?? record?.analysis_id ?? `row-${index}`,
    title: pickString(record, ['job_title', 'title', 'jobTitle']),
    company: pickString(record, ['company_name', 'company', 'employer']),
    date: record?.created_at ?? record?.date ?? record?.analyzed_at ?? null,
    outcome: outcomeOf(record),
    probability: formatProbability(record?.fraud_probability),
    raw: record,
  };
}

/* ---------------- page ---------------- */

export default function DashboardPage() {
  useDocumentTitle('Dashboard');
  const navigate = useNavigate();
  const session = useSession();
  const firstName = session?.user?.full_name?.trim().split(/\s+/)[0] ?? '';

  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  const { loading, error, data, retry } = useAsync(async () => {
    const stats = await getDashboardStats();
    return {
      stats: { total: stats.total, fraudulent: stats.fraudulent, legitimate: stats.legitimate },
      records: (stats.recent ?? []).map(normalizeRecord),
    };
  }, []);

  const stats = data?.stats ?? null;
  // Treat the payload as unusable when none of the expected fields exist.
  const hasStats = Boolean(
    stats && ['total', 'fraudulent', 'legitimate'].some((key) => stats[key] !== null)
  );
  const records = data?.records ?? [];

  /* chart series — only rendered when the backend sent real numbers */
  const chartData = useMemo(() => {
    if (!stats) return [];
    const { fraudulent, legitimate } = stats;
    if ([fraudulent, legitimate].some((v) => v === null || v === undefined)) return [];
    return [
      { name: OUTCOMES.fraud.label, key: 'fraud', value: fraudulent, color: OUTCOMES.fraud.solid },
      { name: OUTCOMES.legit.label, key: 'legit', value: legitimate, color: OUTCOMES.legit.solid },
    ].filter((entry) => entry.value > 0);
  }, [stats]);

  const chartTotal = chartData.reduce((sum, entry) => sum + entry.value, 0);

  /* table filtering + sorting */
  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    let rows = records.filter((row) => {
      const matchesQuery =
        !query ||
        row.title.toLowerCase().includes(query) ||
        row.company.toLowerCase().includes(query);
      const matchesOutcome = outcomeFilter === 'all' || row.outcome === outcomeFilter;
      return matchesQuery && matchesOutcome;
    });

    rows = [...rows].sort((a, b) => {
      const ta = a.date ? new Date(a.date).getTime() : 0;
      const tb = b.date ? new Date(b.date).getTime() : 0;
      return sortOrder === 'newest' ? tb - ta : ta - tb;
    });

    return rows.slice(0, 8);
  }, [records, search, outcomeFilter, sortOrder]);

  const openRecord = (row) => {
    navigate(`/history?detail=${encodeURIComponent(row.id)}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Overview</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {greetingFor()}
            {firstName ? `, ${firstName}` : ''} 👋
          </h1>
          <p className="mt-1 text-sm text-muted">
            Here&apos;s an overview of the listings you&apos;ve analyzed.
          </p>
        </div>
        <Link to="/analyze" className="btn-primary px-4 py-2.5">
          <Plus size={16} aria-hidden="true" /> Analyze New Listing
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card flex items-center justify-center py-16">
          <LoadingSpinner label="Loading your dashboard…" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <ErrorMessage
          title="Dashboard statistics are unavailable"
          message={error.message}
          onRetry={retry}
        />
      )}

      {/* Content */}
      {(!loading && !error && hasStats) && (
        <>
          <section aria-label="Prediction statistics" className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Total Analyzed"
              value={formatCount(stats.total)}
              hint="Listings you have checked"
              icon={LayoutGrid}
              accent="primary"
            />
            <StatCard
              label={OUTCOMES.fraud.label}
              value={formatCount(stats.fraudulent)}
              hint="Verify before you proceed"
              icon={ShieldAlert}
              accent="high"
            />
            <StatCard
              label={OUTCOMES.legit.label}
              value={formatCount(stats.legitimate)}
              hint="Still verify independently"
              icon={CheckCircle2}
              accent="low"
            />
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
            {/* Chart */}
            <div className="card min-w-0 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-ink">Prediction Distribution</h2>
                  <p className="mt-0.5 text-xs text-muted">Share of your analyzed listings by model estimate</p>
                </div>
              </div>

              {chartData.length === 0 ? (
                <EmptyState
                  className="mt-4 border-0 bg-transparent py-10"
                  icon={LayoutGrid}
                  title="No analyses yet"
                  description="Once you analyze listings, the split between potentially fraudulent and likely legitimate predictions appears here."
                  action={
                    <Link to="/analyze" className="btn-primary px-4 py-2">
                      Analyze a listing
                    </Link>
                  }
                />
              ) : (
                <>
                  <div className="relative mt-4 h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={62}
                          outerRadius={92}
                          paddingAngle={3}
                          startAngle={90}
                          endAngle={-270}
                          stroke="none"
                          isAnimationActive={false}
                        >
                          {chartData.map((entry) => (
                            <Cell key={entry.key} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [formatCount(value), name]}
                          contentStyle={{
                            borderRadius: 12,
                            border: '1px solid #E5E5D7',
                            fontSize: 12,
                            background: '#fff',
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          formatter={(value) => (
                            <span style={{ color: '#183B32', fontSize: 12 }}>{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="pointer-events-none absolute inset-x-0 top-[86px] text-center">
                      <p className="text-2xl font-bold text-ink">{formatCount(chartTotal)}</p>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-muted">Total</p>
                    </div>
                  </div>

                  {/* Text equivalent of the chart for screen readers / quick reading */}
                  <ul className="mt-3 space-y-1.5">
                    {chartData.map((entry) => (
                      <li
                        key={entry.key}
                        className="flex items-center justify-between text-xs text-muted"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: entry.color }}
                            aria-hidden="true"
                          />
                          {entry.name}
                        </span>
                        <span className="font-semibold text-ink">
                          {formatCount(entry.value)} (
                          {chartTotal ? Math.round((entry.value / chartTotal) * 100) : 0}%)
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* Recent analyses */}
            <div className="card flex min-w-0 flex-col p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-ink">Recent Analyses</h2>
                  <p className="mt-0.5 text-xs text-muted">
                    Latest listings you assessed with ScamShield AI
                  </p>
                </div>
                <Link
                  to="/history"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  View all history <ArrowUpRight size={13} aria-hidden="true" />
                </Link>
              </div>

              {/* Quick filters */}
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="relative">
                  <Search
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    aria-hidden="true"
                  />
                  <label htmlFor="dash-search" className="sr-only">
                    Search by company or job title
                  </label>
                  <input
                    id="dash-search"
                    type="search"
                    className="input pl-9"
                    placeholder="Search by company or job title…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="dash-outcome" className="sr-only">
                    Filter by prediction
                  </label>
                  <select
                    id="dash-outcome"
                    className="input"
                    value={outcomeFilter}
                    onChange={(event) => setOutcomeFilter(event.target.value)}
                  >
                    <option value="all">All predictions</option>
                    <option value="fraud">{OUTCOMES.fraud.label}</option>
                    <option value="legit">{OUTCOMES.legit.label}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="dash-sort" className="sr-only">
                    Sort by date
                  </label>
                  <select
                    id="dash-sort"
                    className="input"
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value)}
                  >
                    <option value="newest">Sort by: Newest first</option>
                    <option value="oldest">Sort by: Oldest first</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="mt-4 -mx-5 overflow-x-auto px-5">
                <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                  <caption className="sr-only">Recent job listing analyses</caption>
                  <thead>
                    <tr className="border-b border-line text-xs uppercase tracking-[0.1em] text-muted">
                      <th scope="col" className="py-2.5 pr-3 font-semibold">Job Title</th>
                      <th scope="col" className="py-2.5 pr-3 font-semibold">Company</th>
                      <th scope="col" className="py-2.5 pr-3 font-semibold">Date</th>
                      <th scope="col" className="py-2.5 pr-3 font-semibold">Prediction</th>
                      <th scope="col" className="py-2.5 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => (
                      <tr key={row.id} className="border-b border-line/70 last:border-0">
                        <td className="py-3 pr-3 font-medium text-ink">{row.title}</td>
                        <td className="py-3 pr-3 text-muted">{row.company}</td>
                        <td className="py-3 pr-3 whitespace-nowrap text-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarClock size={13} aria-hidden="true" />
                            {formatDate(row.date)}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          {row.outcome ? (
                            <span className="inline-flex flex-wrap items-center gap-1.5">
                              <RiskBadge outcome={row.outcome} size="sm" />
                              {row.probability && (
                                <span className="text-xs tabular-nums text-muted">{row.probability}</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-xs text-muted">Not provided</span>
                          )}
                        </td>
                        <td className="py-3">
                          <button
                            type="button"
                            onClick={() => openRecord(row)}
                            className="btn-outline px-3 py-1.5 text-xs"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {visibleRows.length === 0 && (
                <EmptyState
                  className="mt-4 border-0 bg-transparent py-8"
                  icon={Search}
                  title="No matching analyses"
                  description={
                    records.length === 0
                      ? 'No analyses have been recorded yet. Submit a listing to see it here.'
                      : 'No records match your current search or prediction filter.'
                  }
                  action={
                    <Link to="/analyze" className="btn-primary px-4 py-2">
                      Analyze a listing
                    </Link>
                  }
                />
              )}

            </div>
          </section>
        </>
      )}

      {/* Nothing to show at all (loaded, no error, but backend sent no usable stats) */}
      {!loading && !error && data && !hasStats && (
        <EmptyState
          icon={LayoutGrid}
          title="Statistics unavailable"
          description="The backend responded but did not include the expected statistics fields. See docs/API_CONTRACT.md for the expected schema."
          action={
            <button type="button" className="btn-outline px-4 py-2" onClick={retry}>
              Retry
            </button>
          }
        />
      )}
    </div>
  );
}

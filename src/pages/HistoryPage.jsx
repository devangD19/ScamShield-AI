import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarRange,
  CalendarClock,
  Eye,
  History as HistoryIcon,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';

import RiskBadge from '../components/RiskBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { deleteHistory, getHistory, getHistoryDetail } from '../services/historyService.js';
import { useAsync, useDocumentTitle, useEscapeKey } from '../hooks/index.js';
import { OUTCOMES, formatProbability, outcomeOf } from '../utils/risk.js';
import { formatDate } from '../utils/format.js';

function pickString(record, keys) {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '—';
}

function normalize(record, index) {
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

/* ------------------------------ detail modal ------------------------------ */

function DetailDialog({ record, onClose, onRequestDelete }) {
  const [state, setState] = useState({ loading: true, error: null, data: null });

  useEscapeKey(true, onClose);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await getHistoryDetail(record.id);
      setState({ loading: false, error: null, data });
    } catch (error) {
      setState({ loading: false, error, data: null });
    }
  }, [record]);

  useEffect(() => {
    load();
  }, [load]);

  const data = state.data;
  const outcome = outcomeOf(data) ?? record.outcome;
  const level = outcome ? OUTCOMES[outcome] : null;
  const probability = formatProbability(data?.fraud_probability) ?? record.probability;
  const threshold = formatProbability(data?.threshold);
  const description = typeof data?.description === 'string' ? data.description : null;

  return (
    <>
      <div
        className="fixed inset-0 z-[55] flex items-end justify-center p-0 sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-detail-title"
      >
        <button
          type="button"
          className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
          aria-label="Close details"
          onClick={onClose}
        />

        <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-line bg-surface shadow-raised sm:rounded-2xl">
          <div
            className={`sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line px-5 py-4 ${
              level ? '' : 'bg-surface'
            }`}
            style={level ? { backgroundColor: level.tint } : { backgroundColor: '#FFFFFF' }}
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="history-detail-title" className="text-lg font-bold text-ink">
                  {pickString(data ?? record.raw, ['job_title', 'title'])}
                </h2>
                <RiskBadge outcome={outcome} size="sm" />
              </div>
              <p className="mt-1 text-sm text-muted">
                {pickString(data ?? record.raw, ['company_name', 'company'])} ·{' '}
                {formatDate(record.date, { withTime: true })}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface/80 hover:text-primary"
              aria-label="Close details"
            >
              <X size={17} />
            </button>
          </div>

          <div className="px-5 py-5">
            {state.loading && (
              <div className="py-10">
                <LoadingSpinner label="Loading analysis details…" />
              </div>
            )}

            {!state.loading && state.error && (
              <ErrorMessage
                title="Details could not be loaded"
                message={state.error.message}
                onRetry={load}
              />
            )}

            {!state.loading && !state.error && data && (
              <div className="space-y-5">
                <div className="rounded-xl border border-line bg-canvas/70 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Source
                  </h3>
                  <p className="mt-1 text-sm text-ink">
                    {pickString(data, ['source'])}
                    {data?.recruiter_email ? ` · ${data.recruiter_email}` : ''}
                  </p>
                </div>

                {description && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Submitted text
                    </h3>
                    <p className="mt-2 max-h-52 overflow-y-auto whitespace-pre-wrap rounded-xl border border-line bg-canvas/70 p-4 text-sm leading-relaxed text-ink/85">
                      {description}
                    </p>
                  </div>
                )}

                <div className="rounded-xl border border-line bg-canvas/70 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Model output
                  </h3>
                  <dl className="mt-2 grid gap-2 sm:grid-cols-3">
                    <div>
                      <dt className="text-xs text-muted">Prediction</dt>
                      <dd className="text-sm font-semibold text-ink">
                        {level ? level.label : 'Not provided'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Fraud probability</dt>
                      <dd className="text-sm font-semibold tabular-nums text-ink">
                        {probability ?? 'Not provided'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Decision threshold</dt>
                      <dd className="text-sm font-semibold tabular-nums text-ink">
                        {threshold ?? 'Not provided'}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs leading-relaxed text-muted">
                    A model estimate based on historical job postings — not proof that the listing
                    is fraudulent or legitimate.
                  </p>
                </div>

                <div className="flex justify-end border-t border-line pt-4">
                  <button
                    type="button"
                    className="btn-danger px-4 py-2.5"
                    onClick={() => onRequestDelete(record)}
                  >
                    <Trash2 size={15} aria-hidden="true" /> Delete this analysis
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* --------------------------------- page --------------------------------- */

export default function HistoryPage() {
  useDocumentTitle('Analysis History');

  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [deletedIds, setDeletedIds] = useState([]);
  const [notice, setNotice] = useState(null);

  // Delete flow: confirm first, update the UI only after the backend says OK.
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const { loading, error, data, retry } = useAsync(async () => {
    const history = await getHistory({ page_size: 100 });
    return history.items.map(normalize);
  }, []);

  const detailId = searchParams.get('detail');

  const records = useMemo(
    () => (data ?? []).filter((record) => !deletedIds.includes(String(record.id))),
    [data, deletedIds]
  );

  const selected = records.find((record) => String(record.id) === detailId) ?? null;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59`) : null;

    const rows = records.filter((row) => {
      const matchesQuery =
        !query ||
        row.title.toLowerCase().includes(query) ||
        row.company.toLowerCase().includes(query);
      const matchesOutcome = outcomeFilter === 'all' || row.outcome === outcomeFilter;

      let matchesDate = true;
      if (row.date && (from || to)) {
        const time = new Date(row.date).getTime();
        if (Number.isNaN(time)) matchesDate = false;
        else {
          if (from && time < from.getTime()) matchesDate = false;
          if (to && time > to.getTime()) matchesDate = false;
        }
      } else if ((from || to) && !row.date) {
        matchesDate = false;
      }
      return matchesQuery && matchesOutcome && matchesDate;
    });

    return [...rows].sort((a, b) => {
      const ta = a.date ? new Date(a.date).getTime() : 0;
      const tb = b.date ? new Date(b.date).getTime() : 0;
      return sortOrder === 'newest' ? tb - ta : ta - tb;
    });
  }, [records, search, outcomeFilter, fromDate, toDate, sortOrder]);

  const openDetail = (id) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('detail', String(id));
        return next;
      },
      { replace: true }
    );
  };

  const closeDetail = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('detail');
        return next;
      },
      { replace: true }
    );
  };

  const requestDelete = (record) => {
    setDeleteError(null);
    setDeleteTarget(record);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteHistory(deleteTarget.id); // backend confirms first
      setDeletedIds((prev) => [...prev, String(deleteTarget.id)]);
      setNotice(`“${deleteTarget.title}” was deleted from your history.`);
      setDeleting(false);
      setDeleteTarget(null);
      if (detailId === String(deleteTarget.id)) closeDetail();
      retry();
    } catch (error) {
      setDeleting(false);
      setDeleteError(error?.message ?? 'The analysis could not be deleted.');
    }
  };

  const hasActiveFilters =
    Boolean(search) || outcomeFilter !== 'all' || Boolean(fromDate) || Boolean(toDate);

  const clearFilters = () => {
    setSearch('');
    setOutcomeFilter('all');
    setFromDate('');
    setToDate('');
    setSortOrder('newest');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="eyebrow">
            <HistoryIcon size={13} aria-hidden="true" /> Your records
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Analysis History
          </h1>
          <p className="mt-2 text-sm text-muted">
            Every record below comes from the backend — search, open or delete the analyses you
            have run.
          </p>
        </div>
        <button type="button" onClick={retry} className="btn-outline px-4 py-2.5" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} aria-hidden="true" /> Refresh
        </button>
      </div>

      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-risk-low/30 bg-risk-low/10 px-4 py-3">
          <p className="text-sm text-ink">{notice}</p>
          <button
            type="button"
            className="btn-ghost px-3 py-1.5 text-xs"
            onClick={() => setNotice(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters */}
      <section aria-label="History filters" className="card p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <label htmlFor="history-search" className="sr-only">
              Search by job title or company
            </label>
            <input
              id="history-search"
              type="search"
              className="input pl-9"
              placeholder="Search job title or company…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="history-outcome" className="sr-only">
              Filter by prediction
            </label>
            <select
              id="history-outcome"
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
            <label htmlFor="history-from" className="sr-only">
              From date
            </label>
            <input
              id="history-from"
              type="date"
              className="input"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              aria-label="From date"
            />
          </div>

          <div>
            <label htmlFor="history-to" className="sr-only">
              To date
            </label>
            <input
              id="history-to"
              type="date"
              className="input"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              aria-label="To date"
            />
          </div>

          <div>
            <label htmlFor="history-sort" className="sr-only">
              Sort order
            </label>
            <select
              id="history-sort"
              className="input"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarRange size={13} aria-hidden="true" />
            Date range filters apply to the analysis timestamp.
          </span>
          {hasActiveFilters && (
            <button type="button" className="font-semibold text-primary hover:underline" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* States */}
      {loading && (
        <div className="card py-14">
          <LoadingSpinner label="Loading your history…" />
        </div>
      )}

      {!loading && error && (
        <ErrorMessage
          title="History could not be loaded"
          message={error.message}
          onRetry={retry}
        />
      )}

      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title={records.length === 0 ? 'No analyses yet' : 'No matching records'}
              description={
                records.length === 0
                  ? 'When you analyze a listing while signed in, it is saved to your account and appears here.'
                  : 'Try a different search term, prediction filter or date range.'
              }
              action={
                hasActiveFilters ? (
                  <button type="button" className="btn-outline px-4 py-2" onClick={clearFilters}>
                    Clear filters
                  </button>
                ) : null
              }
            />
          ) : (
            <ul className="space-y-3">
              {filtered.map((row) => (
                <li key={row.id} className="card p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="truncate text-base font-semibold text-ink">{row.title}</h2>
                        <RiskBadge outcome={row.outcome} size="sm" />
                        {row.probability && (
                          <span className="text-xs tabular-nums text-muted">
                            {row.probability} fraud probability
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-sm text-muted">{row.company}</p>
                      <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted">
                        <CalendarClock size={13} aria-hidden="true" />
                        {formatDate(row.date, { withTime: true })}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        className="btn-outline px-3.5 py-2"
                        onClick={() => openDetail(row.id)}
                      >
                        <Eye size={14} aria-hidden="true" /> View Details
                      </button>
                      <button
                        type="button"
                        className="btn-danger px-3.5 py-2"
                        onClick={() => requestDelete(row)}
                        aria-label={`Delete analysis ${row.title}`}
                      >
                        <Trash2 size={14} aria-hidden="true" /> Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Detail modal */}
      {selected && (
        <DetailDialog
          key={selected.id}
          record={selected}
          onClose={closeDetail}
          onRequestDelete={requestDelete}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        destructive
        busy={deleting}
        error={deleteError}
        title="Delete this analysis?"
        message={
          deleteTarget
            ? `This will permanently remove “${deleteTarget.title}” from your history on the backend. This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        onCancel={() => {
          if (!deleting) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}

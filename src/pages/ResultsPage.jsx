import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Info,
  ListChecks,
  MessageSquareWarning,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

import EmptyState from '../components/EmptyState.jsx';
import { useAnalysis } from '../context/AnalysisContext.jsx';
import { useDocumentTitle } from '../hooks/index.js';
import { OUTCOMES, formatProbability, toStringArray } from '../utils/risk.js';
import { formatDate } from '../utils/format.js';

const DISCLAIMER =
  'ScamShield AI provides an automated risk assessment, not a definitive determination of fraud. Independently verify job offers and recruiters before sharing sensitive information or making payments.';

const formatPercent = formatProbability;

/* ---------- tolerant field readers (backend owns the schema) ---------- */

function readSignals(value) {
  const items = Array.isArray(value) ? value : [];
  return items
    .map((item) => {
      if (typeof item === 'string') return { label: item, detail: '' };
      if (item && typeof item === 'object') {
        const label =
          item.signal ?? item.title ?? item.name ?? item.label ?? item.text ?? item.pattern ?? '';
        const detail =
          item.explanation ??
          item.description ??
          item.reason ??
          item.detail ??
          item.impact ??
          '';
        const severity = SEVERITY_STYLES[item.severity] ? item.severity : null;
        return { label: String(label || ''), detail: String(detail || ''), severity };
      }
      return { label: '', detail: '' };
    })
    .filter((item) => item.label);
}

// Rule-based signal severity (from the backend's text checks, not the ML model).
const SEVERITY_STYLES = {
  high: { label: 'High', dot: 'bg-risk-high', text: 'text-risk-high' },
  medium: { label: 'Medium', dot: 'bg-risk-medium', text: 'text-risk-medium' },
  low: { label: 'Low', dot: 'bg-muted', text: 'text-muted' },
};

function readChecklist(value) {
  const items = Array.isArray(value) ? value : [];
  return items
    .map((item) => {
      if (typeof item === 'string') return { label: item, hint: '' };
      if (item && typeof item === 'object') {
        const label = item.item ?? item.action ?? item.label ?? item.title ?? item.text ?? '';
        const hint = item.description ?? item.detail ?? item.note ?? item.why ?? '';
        return { label: String(label || ''), hint: String(hint || '') };
      }
      return { label: '', hint: '' };
    })
    .filter((item) => item.label);
}

/* -------------------------------- page -------------------------------- */

export default function ResultsPage() {
  useDocumentTitle('Analysis Results');
  const { analysis } = useAnalysis();

  if (!analysis) {
    return (
      <div className="mx-auto max-w-2xl py-6">
        <EmptyState
          icon={ShieldAlert}
          title="No analysis to show"
          description="This page only shows a real result returned by the analysis service. Submit a listing first and your assessment will appear here."
          action={
            <Link to="/analyze" className="btn-primary px-5 py-2.5">
              Go to Analyze Job
            </Link>
          }
        />
        <p className="mt-4 text-center text-xs text-muted">
          Reloading the page clears the current result by design — no results are stored or
          invented.
        </p>
      </div>
    );
  }

  // The backend applies the threshold; the UI never re-classifies.
  const isFraud = analysis.is_fraudulent === true;
  const outcome = isFraud ? OUTCOMES.fraud : OUTCOMES.legit;
  const level = outcome;
  const probability = analysis.fraud_probability;
  const threshold = typeof analysis.threshold === 'number' ? analysis.threshold : null;
  const disclaimer = analysis.disclaimer || DISCLAIMER;

  const signals = readSignals(
    analysis.warning_signals ?? analysis.signals ?? analysis.suspicious_signals
  );
  const phrases = toStringArray(
    analysis.suspicious_phrases ?? analysis.phrases ?? analysis.risky_phrases
  );
  const checklist = readChecklist(
    analysis.verification_checklist ?? analysis.verification ?? analysis.checklist
  );
  const nextSteps = toStringArray(
    analysis.recommended_actions ??
      analysis.recommended_next_steps ??
      analysis.next_steps ??
      analysis.recommendations
  );
  // An empty list means the checks ran and found nothing; a missing field means they did not run.
  const signalsChecked = Array.isArray(analysis.warning_signals);
  const phrasesChecked = Array.isArray(analysis.suspicious_phrases);

  const submittedTitle = analysis.job_title ?? analysis.submitted?.job_title ?? null;
  const submittedCompany = analysis.company_name ?? analysis.submitted?.company_name ?? null;
  const createdAt = analysis.created_at ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="eyebrow">
            <Sparkles size={13} aria-hidden="true" /> Analysis result
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {submittedTitle ? submittedTitle : 'Your listing assessment'}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            {submittedCompany && <span className="font-medium text-ink/80">{submittedCompany}</span>}
            {createdAt && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock size={13} aria-hidden="true" />
                {formatDate(createdAt, { withTime: true })}
              </span>
            )}
            {analysis.saved === true && (
              <Link to="/history" className="inline-flex items-center gap-1.5 text-primary hover:underline">
                <CheckCircle2 size={13} aria-hidden="true" /> Saved to your history
              </Link>
            )}
          </p>
        </div>
        <Link to="/analyze" className="btn-outline px-4 py-2.5">
          Analyze Another Listing
        </Link>
      </div>

      {/* ---- Risk summary ---- */}
      <section
        aria-labelledby="risk-summary-heading"
        className={`card overflow-hidden border ${level ? level.border : 'border-line'}`}
        style={level ? { backgroundColor: level.tint } : undefined}
      >
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div>
            <div className="flex items-start gap-4">
              <span
                className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${level.bg} ${level.text}`}
              >
                {isFraud ? (
                  <ShieldAlert size={24} aria-hidden="true" />
                ) : (
                  <CheckCircle2 size={24} aria-hidden="true" />
                )}
              </span>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 id="risk-summary-heading" className="text-2xl font-bold tracking-tight text-ink">
                    {outcome.label}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${level.bg} ${level.border} ${level.text}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${level.dot}`} aria-hidden="true" />
                    Model estimate
                  </span>
                </div>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink/80">
                  {outcome.description}
                </p>
              </div>
            </div>

            {/* Fraud probability meter */}
            <div className="mt-6 max-w-xl">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Estimated fraud probability
                </span>
                <span className={`text-sm font-bold tabular-nums ${level.text}`}>
                  {formatPercent(probability)}
                </span>
              </div>
              <div
                className="relative mt-2.5 h-2.5 w-full rounded-full bg-line"
                role="meter"
                aria-valuenow={Math.round(probability * 1000) / 10}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={`${formatPercent(probability)} estimated fraud probability — ${outcome.label}`}
                aria-label="Estimated fraud probability"
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 motion-reduce:transition-none"
                  style={{ width: `${probability * 100}%`, backgroundColor: level.solid }}
                />
                {threshold !== null && (
                  <span
                    className="absolute -inset-y-1 w-0.5 rounded bg-ink/60"
                    style={{ left: `${threshold * 100}%` }}
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-muted">
                <span>0%</span>
                {threshold !== null && <span>Threshold {formatPercent(threshold)}</span>}
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Model output */}
          <div className="rounded-2xl border border-line bg-surface/90 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Model output
            </h3>

            <dl className="mt-3 space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-sm text-muted">Prediction</dt>
                <dd className="text-sm font-semibold text-ink">{outcome.label}</dd>
              </div>

              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-sm text-muted">Fraud probability</dt>
                <dd className="text-sm font-semibold tabular-nums text-ink">
                  {formatPercent(probability)}
                </dd>
              </div>

              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-sm text-muted">Decision threshold</dt>
                <dd className="text-sm font-semibold tabular-nums text-ink">
                  {threshold !== null ? (
                    formatPercent(threshold)
                  ) : (
                    <span className="font-normal text-muted">Not provided</span>
                  )}
                </dd>
              </div>
            </dl>

            <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-muted">
              Listings at or above the threshold are flagged as potentially fraudulent. This is
              an estimate from a model trained on historical postings, not proof either way.
            </p>
          </div>
        </div>
      </section>

      {/* ---- Signals + phrases ---- */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5 sm:p-6" aria-labelledby="signals-heading">
          <h2 id="signals-heading" className="flex items-center gap-2 text-base font-semibold text-ink">
            <MessageSquareWarning size={17} className="text-risk-medium" aria-hidden="true" />
            Warning Signals
          </h2>
          <p className="mt-2 text-xs text-muted">
            Rule-based checks for common scam patterns in your text. They are separate from the
            model&apos;s fraud probability above.
          </p>

          {signals.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {signals.map((signal, index) => {
                const severity = SEVERITY_STYLES[signal.severity];
                return (
                  <li
                    key={`${signal.label}-${index}`}
                    className="rounded-xl border border-line bg-canvas/70 p-4"
                  >
                    <p className="flex items-start gap-2 text-sm font-medium text-ink">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${severity ? severity.dot : level.dot}`}
                        aria-hidden="true"
                      />
                      <span className="flex-1">{signal.label}</span>
                      {severity && (
                        <span className={`text-[11px] font-semibold uppercase tracking-wider ${severity.text}`}>
                          {severity.label}
                        </span>
                      )}
                    </p>
                    {signal.detail && (
                      <p className="mt-1 pl-4 text-xs leading-relaxed text-muted">{signal.detail}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
              {signalsChecked
                ? 'No obvious warning signals detected in the provided text. This does not guarantee the job is legitimate.'
                : 'The backend did not return any warning signals for this analysis.'}
            </p>
          )}
        </section>

        <section className="card p-5 sm:p-6" aria-labelledby="phrases-heading">
          <h2 id="phrases-heading" className="flex items-center gap-2 text-base font-semibold text-ink">
            <Sparkles size={17} className="text-risk-high" aria-hidden="true" />
            Suspicious Phrases
          </h2>

          {phrases.length > 0 ? (
            <>
              <p className="mt-2 text-xs text-muted">
                Exact text from your submission that matched a rule-based check (not chosen by the
                ML model).
              </p>
              <ul className="mt-4 flex flex-wrap gap-2.5">
                {phrases.map((phrase, index) => (
                  <li
                    key={`${phrase}-${index}`}
                    className="rounded-lg border border-risk-high/25 bg-risk-high/10 px-3 py-1.5 text-sm font-medium text-risk-high"
                  >
                    <mark className="bg-transparent text-inherit">“{phrase}”</mark>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
              {phrasesChecked
                ? 'None of the text you submitted matched a known scam phrase.'
                : 'No suspicious phrases were provided in this response.'}
            </p>
          )}
        </section>
      </div>

      {/* ---- Checklist + next steps ---- */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5 sm:p-6" aria-labelledby="checklist-heading">
          <h2 id="checklist-heading" className="flex items-center gap-2 text-base font-semibold text-ink">
            <ClipboardCheck size={17} className="text-primary" aria-hidden="true" />
            Verification Checklist
          </h2>

          {checklist.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {checklist.map((entry, index) => (
                <li key={`${entry.label}-${index}`} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-sage text-primary">
                    <CheckCircle2 size={13} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{entry.label}</p>
                    {entry.hint && (
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">{entry.hint}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
              The backend did not return a verification checklist for this analysis.
            </p>
          )}
        </section>

        <section className="card p-5 sm:p-6" aria-labelledby="steps-heading">
          <h2 id="steps-heading" className="flex items-center gap-2 text-base font-semibold text-ink">
            <ListChecks size={17} className="text-primary" aria-hidden="true" />
            Recommended Next Steps
          </h2>

          {nextSteps.length > 0 ? (
            <ol className="mt-4 space-y-3">
              {nextSteps.map((step, index) => (
                <li key={`${step}-${index}`} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-ink/90">{step}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
              The backend did not return recommended next steps for this analysis.
            </p>
          )}
        </section>
      </div>

      {/* ---- Disclaimer ---- */}
      <div className="rounded-2xl border border-primary/20 bg-sage/70 p-5" role="note">
        <div className="flex items-start gap-3">
          <Info size={17} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-ink">Important disclaimer</p>
            <p className="mt-1 text-sm leading-relaxed text-ink/80">{disclaimer}</p>
          </div>
        </div>
      </div>

      {/* ---- Actions ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link to="/" className="btn-ghost px-5 py-2.5">
          <ArrowLeft size={15} aria-hidden="true" /> Back to Home
        </Link>
        <Link to="/dashboard" className="btn-outline px-5 py-2.5">
          Back to Dashboard
        </Link>
        <Link to="/analyze" className="btn-primary px-5 py-2.5">
          Analyze Another Listing
        </Link>
      </div>
    </div>
  );
}

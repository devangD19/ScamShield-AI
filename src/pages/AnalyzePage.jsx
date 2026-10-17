import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronDown,
  Eraser,
  Loader2,
  Send,
  Sparkles,
  ClipboardList,
} from 'lucide-react';

import ErrorMessage from '../components/ErrorMessage.jsx';
import DemoDataBadge from '../components/DemoDataBadge.jsx';
import { analyzeJob } from '../services/analysisService.js';
import { useAnalysis } from '../context/AnalysisContext.jsx';
import { useDocumentTitle } from '../hooks/index.js';
import { DEMO_EXAMPLES } from '../utils/demoExamples.js';
import { validateOptionalEmail, validateRequired } from '../utils/validation.js';

const MAX_LENGTH = 5000;

const SOURCES = [
  'LinkedIn',
  'Naukri',
  'Internshala',
  'WhatsApp',
  'Telegram',
  'Company Website',
  'Other',
];

// Option values match the labels used in the model's training data.
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Other'];
const EXPERIENCE_LEVELS = [
  'Internship',
  'Entry level',
  'Associate',
  'Mid-Senior level',
  'Director',
  'Executive',
  'Not Applicable',
];
const EDUCATION_LEVELS = [
  'High School or equivalent',
  'Some High School Coursework',
  'Some College Coursework Completed',
  'Vocational',
  'Vocational - HS Diploma',
  'Vocational - Degree',
  'Certification',
  'Associate Degree',
  "Bachelor's Degree",
  "Master's Degree",
  'Doctorate',
  'Professional',
  'Unspecified',
];

const DETAIL_MAX_LENGTH = 5000;

// Optional details the model was trained on. Keys must match OPTIONAL_MODEL_FIELDS.
const DETAIL_FIELDS = [
  { name: 'companyProfile', label: 'Company profile', multiline: true, placeholder: 'What the posting says about the company' },
  { name: 'requirements', label: 'Requirements', multiline: true, placeholder: 'Skills, qualifications or documents asked for' },
  { name: 'benefits', label: 'Benefits', multiline: true, placeholder: 'Perks, stipend details, certificates…' },
  { name: 'location', label: 'Location', placeholder: 'e.g. Pune, India or Remote' },
  { name: 'salaryRange', label: 'Salary range', placeholder: 'e.g. 25000-30000 per month' },
  { name: 'industry', label: 'Industry', placeholder: 'e.g. Information Technology' },
  { name: 'jobFunction', label: 'Function', placeholder: 'e.g. Engineering, Sales' },
  { name: 'employmentType', label: 'Employment type', options: EMPLOYMENT_TYPES },
  { name: 'requiredExperience', label: 'Required experience', options: EXPERIENCE_LEVELS },
  { name: 'requiredEducation', label: 'Required education', options: EDUCATION_LEVELS },
];

const INITIAL_FORM = {
  jobTitle: '',
  companyName: '',
  recruiterEmail: '',
  source: 'LinkedIn',
  description: '',
  ...Object.fromEntries(DETAIL_FIELDS.map((field) => [field.name, ''])),
};

export default function AnalyzePage() {
  useDocumentTitle('Analyze a Job');
  const navigate = useNavigate();
  const { saveAnalysis } = useAnalysis();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeExample, setActiveExample] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const errorRef = useRef(null);

  const descriptionLength = form.description.length;
  const nearLimit = descriptionLength > MAX_LENGTH * 0.9;
  const filledDetails = DETAIL_FIELDS.filter((field) => form[field.name].trim()).length;

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev));
  };

  const validate = () => {
    const next = {};
    const jobTitle = validateRequired(form.jobTitle, 'Job title');
    if (jobTitle) next.jobTitle = jobTitle;

    const companyName = validateRequired(form.companyName, 'Company name');
    if (companyName) next.companyName = companyName;

    const email = validateOptionalEmail(form.recruiterEmail);
    if (email) next.recruiterEmail = email;

    const description = validateRequired(form.description, 'Job description');
    if (description) next.description = description;
    else if (form.description.trim().length < 30) {
      next.description =
        'Please paste at least a few sentences of the listing or message (30+ characters).';
    }

    if (descriptionLength > MAX_LENGTH) {
      next.description = `Description must be ${MAX_LENGTH.toLocaleString()} characters or fewer.`;
    }

    for (const field of DETAIL_FIELDS) {
      if (form[field.name].length > DETAIL_MAX_LENGTH) {
        next[field.name] = `${field.label} must be ${DETAIL_MAX_LENGTH.toLocaleString()} characters or fewer.`;
      }
    }
    // Make sure an invalid optional field is visible so it can be focused.
    if (DETAIL_FIELDS.some((field) => next[field.name])) setShowDetails(true);

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return; // block duplicate submissions
    setSubmitError(null);

    if (!validate()) {
      // Focus the first invalid field after React has re-rendered.
      window.setTimeout(() => document.querySelector('[aria-invalid="true"]')?.focus(), 0);
      return;
    }

    setSubmitting(true);
    try {
      const response = await analyzeJob(form);
      saveAnalysis(response);
      navigate('/results');
    } catch (error) {
      setSubmitError(error);
      // Move focus to the error banner so it is announced.
      window.setTimeout(() => errorRef.current?.focus(), 0);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setSubmitError(null);
    setActiveExample(null);
  };

  const applyExample = (example) => {
    // Populates the form only — no prediction is generated until submit.
    // Starting from INITIAL_FORM clears any optional details left from before.
    setForm({
      ...INITIAL_FORM,
      jobTitle: example.jobTitle,
      companyName: example.companyName,
      recruiterEmail: example.recruiterEmail,
      source: example.source,
      description: example.description,
    });
    setErrors({});
    setSubmitError(null);
    setActiveExample(example.id);
  };

  const sourceOptions = useMemo(() => SOURCES, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <span className="eyebrow">
            <Sparkles size={13} aria-hidden="true" /> Analyze a Job / Internship
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Check a listing before you trust it
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
            Paste a job description, internship offer, recruiter email or WhatsApp/Telegram
            message. The backend model reviews the text and returns a risk assessment.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        {/* ------------- FORM ------------- */}
        <section className="card p-5 sm:p-6" aria-labelledby="form-heading">
          <h2 id="form-heading" className="text-base font-semibold text-ink">
            Listing details
          </h2>

          {submitError && (
            <div className="mt-4" tabIndex={-1} ref={errorRef}>
              <ErrorMessage
                title="We couldn't analyze this listing"
                message={submitError.message}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="jobTitle" className="label">
                  Job title <span className="text-risk-high" aria-hidden="true">*</span>
                </label>
                <input
                  id="jobTitle"
                  name="jobTitle"
                  type="text"
                  className="input"
                  placeholder="e.g. Frontend Development Intern"
                  value={form.jobTitle}
                  onChange={(event) => setField('jobTitle', event.target.value)}
                  aria-invalid={Boolean(errors.jobTitle)}
                  aria-describedby={errors.jobTitle ? 'jobTitle-error' : undefined}
                  required
                />
                {errors.jobTitle && (
                  <p id="jobTitle-error" role="alert" className="mt-1.5 text-xs text-risk-high">
                    {errors.jobTitle}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="companyName" className="label">
                  Company name <span className="text-risk-high" aria-hidden="true">*</span>
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  className="input"
                  placeholder="e.g. Krishna Infotech Pvt Ltd"
                  value={form.companyName}
                  onChange={(event) => setField('companyName', event.target.value)}
                  aria-invalid={Boolean(errors.companyName)}
                  aria-describedby={errors.companyName ? 'companyName-error' : undefined}
                  required
                />
                {errors.companyName && (
                  <p id="companyName-error" role="alert" className="mt-1.5 text-xs text-risk-high">
                    {errors.companyName}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="recruiterEmail" className="label">
                  Recruiter email{' '}
                  <span className="text-xs font-normal text-muted">(optional)</span>
                </label>
                <input
                  id="recruiterEmail"
                  name="recruiterEmail"
                  type="email"
                  className="input"
                  placeholder="recruiter@company.com"
                  value={form.recruiterEmail}
                  onChange={(event) => setField('recruiterEmail', event.target.value)}
                  aria-invalid={Boolean(errors.recruiterEmail)}
                  aria-describedby={errors.recruiterEmail ? 'recruiterEmail-error' : undefined}
                />
                {errors.recruiterEmail && (
                  <p
                    id="recruiterEmail-error"
                    role="alert"
                    className="mt-1.5 text-xs text-risk-high"
                  >
                    {errors.recruiterEmail}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="source" className="label">
                  Source
                </label>
                <select
                  id="source"
                  name="source"
                  className="input"
                  value={form.source}
                  onChange={(event) => setField('source', event.target.value)}
                >
                  {sourceOptions.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-end justify-between gap-3">
                <label htmlFor="description" className="label mb-0">
                  Job description or message{' '}
                  <span className="text-risk-high" aria-hidden="true">*</span>
                </label>
                <span
                  className={`text-xs tabular-nums ${
                    descriptionLength > MAX_LENGTH ? 'font-semibold text-risk-high' : 'text-muted'
                  }`}
                  aria-live="polite"
                >
                  {descriptionLength.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
                </span>
              </div>
              <textarea
                id="description"
                name="description"
                rows={11}
                className="input resize-y font-mono text-[13px] leading-relaxed"
                placeholder="Paste the full job description, offer message or recruiter email here…"
                value={form.description}
                onChange={(event) => setField('description', event.target.value.slice(0, MAX_LENGTH + 200))}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={`description-hint${errors.description ? ' description-error' : ''}`}
                required
              />
              <p id="description-hint" className="mt-1.5 text-xs text-muted">
                Minimum 30 characters · maximum {MAX_LENGTH.toLocaleString()} characters · your text
                is sent only to the configured ScamShield backend.
              </p>
              {errors.description && (
                <p id="description-error" role="alert" className="mt-1 text-xs text-risk-high">
                  {errors.description}
                </p>
              )}
              {nearLimit && !errors.description && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-risk-medium">
                  <AlertTriangle size={13} aria-hidden="true" /> You are close to the character
                  limit.
                </p>
              )}
            </div>

            {/* Optional details — the model was trained on these fields too */}
            <div className="rounded-xl border border-line bg-canvas/60">
              <button
                type="button"
                onClick={() => setShowDetails((open) => !open)}
                aria-expanded={showDetails}
                aria-controls="optional-details"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span>
                  <span className="block text-sm font-medium text-ink">
                    More details{' '}
                    <span className="text-xs font-normal text-muted">(optional)</span>
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {filledDetails > 0
                      ? `${filledDetails} of ${DETAIL_FIELDS.length} added`
                      : 'Copy any extra sections from the posting — more detail gives the model more to work with.'}
                  </span>
                </span>
                <ChevronDown
                  size={17}
                  aria-hidden="true"
                  className={`shrink-0 text-muted transition-transform motion-reduce:transition-none ${
                    showDetails ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showDetails && (
                <div id="optional-details" className="grid gap-4 border-t border-line px-4 pb-4 pt-4 sm:grid-cols-2">
                  {DETAIL_FIELDS.map((field) => {
                    const id = `detail-${field.name}`;
                    const error = errors[field.name];
                    const common = {
                      id,
                      name: field.name,
                      value: form[field.name],
                      onChange: (event) => setField(field.name, event.target.value),
                      'aria-invalid': Boolean(error),
                      'aria-describedby': error ? `${id}-error` : undefined,
                    };
                    return (
                      <div key={field.name} className={field.multiline ? 'sm:col-span-2' : undefined}>
                        <label htmlFor={id} className="label">
                          {field.label}
                        </label>
                        {field.options ? (
                          <select {...common} className="input">
                            <option value="">Not specified</option>
                            {field.options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : field.multiline ? (
                          <textarea
                            {...common}
                            rows={3}
                            className="input resize-y"
                            placeholder={field.placeholder}
                          />
                        ) : (
                          <input {...common} type="text" className="input" placeholder={field.placeholder} />
                        )}
                        {error && (
                          <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-risk-high">
                            {error}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={handleClear} className="btn-ghost px-4 py-2.5">
                <Eraser size={15} aria-hidden="true" /> Clear
              </button>
              <button type="submit" className="btn-primary px-6 py-2.5" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Analyzing…
                  </>
                ) : (
                  <>
                    <Send size={15} aria-hidden="true" /> Analyze Job
                  </>
                )}
              </button>
            </div>

            {submitting && (
              <p className="text-center text-xs text-muted" role="status">
                Sending the listing to the analysis service…
              </p>
            )}
          </form>
        </section>

        {/* ------------- DEMO EXAMPLES ------------- */}
        <aside className="card h-fit p-5" aria-labelledby="examples-heading">
          <div className="flex items-center justify-between gap-3">
            <h2 id="examples-heading" className="flex items-center gap-2 text-base font-semibold text-ink">
              <ClipboardList size={17} className="text-primary" aria-hidden="true" />
              Try Demo Examples
            </h2>
            <DemoDataBadge />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Sample texts for demonstration. Selecting one fills the form — nothing is analyzed
            until you press <span className="font-semibold text-ink">Analyze Job</span>.
          </p>

          <ul className="mt-4 space-y-2">
            {DEMO_EXAMPLES.map((example) => (
              <li key={example.id}>
                <button
                  type="button"
                  onClick={() => applyExample(example)}
                  className={`w-full rounded-xl border px-3.5 py-3 text-left transition-colors ${
                    activeExample === example.id
                      ? 'border-primary bg-sage'
                      : 'border-line bg-surface hover:border-primary/40 hover:bg-sage/60'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink">{example.title}</span>
                    <span className="rounded-full bg-sage px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {example.tag}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {example.source} · {example.companyName}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-xl border border-line bg-canvas p-4">
            <p className="text-xs leading-relaxed text-muted">
              Results are estimates from a model trained on historical job postings. Analyses are
              saved to your account so you can revisit them in History.
            </p>
            <Link to="/about" className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline">
              How the analysis works →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

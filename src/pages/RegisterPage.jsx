import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, LockKeyhole, Mail, UserPlus } from 'lucide-react';

import ErrorMessage from '../components/ErrorMessage.jsx';
import { register } from '../services/authService.js';
import { useDocumentTitle } from '../hooks/index.js';
import { passwordIssues, validateEmail, validateRequired } from '../utils/validation.js';

function PasswordField({ id, label, value, onChange, autoComplete, error }) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="label mb-0">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={13} /> : <Eye size={13} />}
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        className="input"
        placeholder="••••••••"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-risk-high">
          {error}
        </p>
      )}
    </div>
  );
}

export default function RegisterPage() {
  useDocumentTitle('Create Account');

  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    const name = validateRequired(form.fullName, 'Full name');
    if (name) next.fullName = name;

    const email = validateEmail(form.email);
    if (email) next.email = email;

    const password = passwordIssues(form.password);
    if (password) next.password = password;

    if (!form.confirmPassword) next.confirmPassword = 'Please confirm your password.';
    else if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.';

    if (!form.acceptedTerms) next.acceptedTerms = 'You must acknowledge the terms to continue.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });
      setSubmitting(false);
      navigate('/login', { state: { registered: true } });
    } catch (error) {
      setSubmitting(false);
      setSubmitError(error);
    }
  };

  return (
    <div className="card p-6 sm:p-8">
      <span className="eyebrow">
        <LockKeyhole size={13} aria-hidden="true" /> Create your account
      </span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">Join ScamShield AI</h1>
      <p className="mt-1.5 text-sm text-muted">
        Save your analysis history and revisit past assessments.
      </p>

      {submitError && (
        <div className="mt-5">
          <ErrorMessage title="Registration failed" message={submitError.message} />
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <div>
          <label htmlFor="reg-name" className="label">
            Full name
          </label>
          <input
            id="reg-name"
            type="text"
            autoComplete="name"
            className="input"
            placeholder="Akash Sharma"
            value={form.fullName}
            onChange={(event) => setField('fullName', event.target.value)}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? 'reg-name-error' : undefined}
          />
          {errors.fullName && (
            <p id="reg-name-error" role="alert" className="mt-1.5 text-xs text-risk-high">
              {errors.fullName}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="reg-email" className="label">
            Email address
          </label>
          <div className="relative">
            <Mail
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              className="input pl-9"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) => setField('email', event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'reg-email-error' : undefined}
            />
          </div>
          {errors.email && (
            <p id="reg-email-error" role="alert" className="mt-1.5 text-xs text-risk-high">
              {errors.email}
            </p>
          )}
        </div>

        <PasswordField
          id="reg-password"
          label="Password"
          autoComplete="new-password"
          value={form.password}
          onChange={(value) => setField('password', value)}
          error={errors.password}
        />
        <PasswordField
          id="reg-confirm"
          label="Confirm password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={(value) => setField('confirmPassword', value)}
          error={errors.confirmPassword}
        />

        <div>
          <label htmlFor="reg-terms" className="flex cursor-pointer items-start gap-3 text-sm text-ink/85">
            <input
              id="reg-terms"
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-line accent-[#155B46]"
              checked={form.acceptedTerms}
              onChange={(event) => setField('acceptedTerms', event.target.checked)}
              aria-invalid={Boolean(errors.acceptedTerms)}
              aria-describedby={errors.acceptedTerms ? 'reg-terms-error' : undefined}
            />
            <span>
              I understand this is an{' '}
              <strong>educational project</strong>: results are automated risk assessments, not
              proof of fraud, and I will verify recruiters independently before sharing
              information or paying anything.
            </span>
          </label>
          {errors.acceptedTerms && (
            <p id="reg-terms-error" role="alert" className="mt-1.5 text-xs text-risk-high">
              {errors.acceptedTerms}
            </p>
          )}
        </div>

        <button type="submit" className="btn-primary w-full py-3" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Creating account…
            </>
          ) : (
            <>
              <UserPlus size={16} aria-hidden="true" /> Create Account
            </>
          )}
        </button>

        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

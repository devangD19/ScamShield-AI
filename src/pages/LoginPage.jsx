import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, Info, Loader2, LockKeyhole, LogIn, Mail } from 'lucide-react';

import ErrorMessage from '../components/ErrorMessage.jsx';
import { login } from '../services/authService.js';
import { useDocumentTitle } from '../hooks/index.js';
import { validateEmail } from '../utils/validation.js';

export default function LoginPage() {
  useDocumentTitle('Login');

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('expired') === '1';
  const justRegistered = Boolean(location.state?.registered);
  // Only return to in-app paths, never to an arbitrary URL.
  const returnTo =
    typeof location.state?.from === 'string' && location.state.from.startsWith('/')
      ? location.state.from
      : '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [recoveryNotice, setRecoveryNotice] = useState(false);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    const emailError = validateEmail(form.email);
    if (emailError) next.email = emailError;
    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < 6) next.password = 'Password must be at least 6 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login(form);
      setSubmitting(false);
      navigate(returnTo, { replace: true });
    } catch (error) {
      setSubmitting(false);
      setSubmitError(error);
    }
  };

  return (
    <div className="card p-6 sm:p-8">
      <span className="eyebrow">
        <LockKeyhole size={13} aria-hidden="true" /> Account access
      </span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">Welcome back</h1>
      <p className="mt-1.5 text-sm text-muted">
        Sign in to keep a record of the listings you have analysed.
      </p>

      {justRegistered && !submitError && (
        <div
          className="mt-5 flex items-start gap-3 rounded-xl border border-risk-low/30 bg-risk-low/10 px-4 py-3"
          role="status"
        >
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-risk-low" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-ink/85">
            <strong>Account created.</strong> Sign in with your email and password to continue.
          </p>
        </div>
      )}

      {sessionExpired && !justRegistered && !submitError && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-primary/20 bg-sage/70 px-4 py-3" role="status">
          <Info size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-ink/85">
            Your session has ended. Please sign in again.
          </p>
        </div>
      )}

      {submitError && (
        <div className="mt-5">
          <ErrorMessage title="Sign-in failed" message={submitError.message} />
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <div>
          <label htmlFor="login-email" className="label">
            Email address
          </label>
          <div className="relative">
            <Mail
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className="input pl-9"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) => setField('email', event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
            />
          </div>
          {errors.email && (
            <p id="login-email-error" role="alert" className="mt-1.5 text-xs text-risk-high">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="login-password" className="label mb-0">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className="input"
            placeholder="••••••••"
            value={form.password}
            onChange={(event) => setField('password', event.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
          />
          {errors.password && (
            <p id="login-password-error" role="alert" className="mt-1.5 text-xs text-risk-high">
              {errors.password}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setRecoveryNotice(true)}
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot password?
          </button>
        </div>

        {recoveryNotice && (
          <p role="status" className="rounded-xl bg-sage/70 px-4 py-3 text-sm leading-relaxed text-ink/80">
            Password reset by email is not available yet. If you cannot sign in, create a new
            account with a different email address.
          </p>
        )}

        <button type="submit" className="btn-primary w-full py-3" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Signing in…
            </>
          ) : (
            <>
              <LogIn size={16} aria-hidden="true" /> Sign In
            </>
          )}
        </button>

        <p className="text-center text-sm text-muted">
          New here?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}

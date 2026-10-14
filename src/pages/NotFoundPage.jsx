import { Link, useLocation } from 'react-router-dom';
import { Compass, Home, SearchX } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { useDocumentTitle } from '../hooks/index.js';

export default function NotFoundPage() {
  useDocumentTitle('Page not found');
  const location = useLocation();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-lg text-center">
        <div className="flex justify-center">
          <Logo size="lg" showWordmark={false} />
        </div>

        <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-sage px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          <SearchX size={13} aria-hidden="true" /> Error 404
        </p>

        <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          This page slipped past our checks
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          We couldn&apos;t find <code className="rounded bg-sage px-1.5 py-0.5 text-primary">{location.pathname}</code>.
          The link may be outdated, or the page may have moved.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/" className="btn-primary px-6 py-3">
            <Home size={16} aria-hidden="true" /> Back to Home
          </Link>
          <Link to="/analyze" className="btn-outline px-6 py-3">
            <Compass size={16} aria-hidden="true" /> Analyze a Job
          </Link>
        </div>

        <p className="mt-10 text-xs text-muted">
          ScamShield AI · Don&apos;t Let a Fake Job Steal Your Future.
        </p>
      </div>
    </main>
  );
}

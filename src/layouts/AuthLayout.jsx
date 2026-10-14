import { Link, Outlet, useLocation } from 'react-router-dom';
import { ArrowLeft, Leaf } from 'lucide-react';
import Logo from '../components/Logo.jsx';

export default function AuthLayout() {
  const location = useLocation();
  const isRegister = location.pathname.startsWith('/register');

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Brand panel */}
      <aside className="relative hidden w-[42%] max-w-xl flex-col justify-between overflow-hidden bg-primary p-10 text-white lg:flex">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-white/5"
          aria-hidden="true"
        />

        <Link to="/" className="relative inline-flex w-fit items-center gap-2.5 text-white">
          <Logo className="[&_span:last-child]:text-white" />
        </Link>

        <div className="relative">
          <p className="eyebrow border-white/25 bg-white/10 text-white">Stay safe · Work smart</p>
          <h1 className="mt-5 text-3xl font-bold leading-snug tracking-tight">
            {isRegister ? 'Join ScamShield AI.' : 'Welcome back to ScamShield AI.'}
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80">
            AI-powered job and internship risk assessment to help Indian students and job seekers
            identify suspicious recruitment offers and make safer career decisions.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-white/70">
            <Leaf size={16} aria-hidden="true" />
            Don&apos;t Let a Fake Job Steal Your Future.
          </div>
        </div>

        <p className="relative text-xs leading-relaxed text-white/60">
          Educational project. Not affiliated with any government or official organisation.
        </p>
      </aside>

      {/* Form side */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-4 py-5 sm:px-8">
          <Link to="/" className="lg:hidden">
            <Logo size="sm" />
          </Link>
          <Link
            to="/"
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-primary"
          >
            <ArrowLeft size={15} aria-hidden="true" /> Back to home
          </Link>
        </div>

        <main
          id="main-content"
          className="flex flex-1 items-start justify-center px-4 pb-14 pt-2 sm:px-8"
        >
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

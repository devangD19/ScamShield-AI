import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  HeartHandshake,
  History,
  Home,
  Info,
  LayoutDashboard,
  LogOut,
  ScanSearch,
  UserRound,
} from 'lucide-react';
import Logo from './Logo.jsx';
import { useSession } from '../hooks/index.js';
import { logout } from '../services/authService.js';

export const SIDEBAR_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/analyze', label: 'Analyze Job', icon: ScanSearch },
  { to: '/history', label: 'History', icon: History },
  { to: '/app/about', label: 'About', icon: Info },
];

function linkClass({ isActive }) {
  return [
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary text-white shadow-[0_8px_18px_-12px_rgba(21,91,70,0.9)]'
      : 'text-ink/85 hover:bg-sage hover:text-primary',
  ].join(' ');
}

function SidebarNav({ onNavigate }) {
  const session = useSession();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onNavigate?.();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-full flex-col gap-6 p-5">
      <Link
        to="/"
        aria-label="ScamShield AI home"
        className="inline-flex"
        onClick={onNavigate}
      >
        <Logo />
      </Link>

      <nav aria-label="Dashboard" className="flex flex-col gap-1.5">
        {SIDEBAR_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={linkClass} onClick={onNavigate}>
            <Icon size={17} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      {session && (
        <div className="mt-auto rounded-xl border border-line p-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-primary">
              <UserRound size={15} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{session.user.full_name}</p>
              <p className="truncate text-xs text-muted">{session.user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="btn-ghost mt-2.5 w-full justify-center px-3 py-2 text-xs"
          >
            <LogOut size={14} aria-hidden="true" /> Log out
          </button>
        </div>
      )}

      <div className={`${session ? '' : 'mt-auto '}rounded-xl border border-line bg-sage/60 p-4`}>
        <div className="flex items-center gap-2 text-primary">
          <HeartHandshake size={16} aria-hidden="true" />
          <span className="text-sm font-semibold">AI for a safer tomorrow</span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          Educational project. Always verify recruiters independently before sharing information.
        </p>
        <Link
          to="/"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          onClick={onNavigate}
        >
          <Home size={13} aria-hidden="true" /> Back to home
        </Link>
      </div>
    </div>
  );
}

/** Desktop rail + mobile drawer for the application pages. */
export default function Sidebar({ open, onClose }) {
  const location = useLocation();

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-surface lg:block">
        <SidebarNav />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button
            type="button"
            className="absolute inset-0 bg-ink/30"
            aria-label="Close menu"
            onClick={onClose}
          />
          <div
            className="absolute inset-y-0 left-0 w-[17rem] max-w-[85%] overflow-y-auto border-r border-line bg-surface shadow-raised"
            key={location.pathname}
          >
            <SidebarNav onNavigate={onClose} />
          </div>
        </div>
      )}
    </>
  );
}

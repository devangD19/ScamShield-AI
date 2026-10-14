import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo.jsx';
import { useSession } from '../hooks/index.js';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/analyze', label: 'Analyze Job' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/about', label: 'About & Safety' },
];

function linkClass({ isActive }) {
  return [
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-sage text-primary' : 'text-ink/80 hover:bg-sage/70 hover:text-primary',
  ].join(' ');
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const session = useSession();

  // Close the mobile menu whenever the route changes.
  const currentPath = location.pathname;
  const [lastPath, setLastPath] = useState(currentPath);
  if (lastPath !== currentPath) {
    setLastPath(currentPath);
    if (open) setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" aria-label="ScamShield AI home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass} end={link.to === '/'}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <Link to="/dashboard" className="btn-primary px-4 py-2">
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost px-3 py-2">
                Login
              </Link>
              <Link to="/register" className="btn-primary px-4 py-2">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile primary"
          className="border-t border-line bg-surface md:hidden"
        >
          <div className="container-page flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass} end={link.to === '/'}>
                {link.label}
              </NavLink>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              {session ? (
                <Link to="/dashboard" className="btn-primary w-full px-4 py-2.5">
                  Open Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-outline w-full px-4 py-2.5">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary w-full px-4 py-2.5">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

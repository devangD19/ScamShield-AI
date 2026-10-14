import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import Logo from '../components/Logo.jsx';
import { logout } from '../services/authService.js';

function ScrollManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

export default function DashboardLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Close the drawer when the route changes.
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    if (menuOpen) setMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-canvas">
      <ScrollManager />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="lg:pl-64">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-surface px-4 lg:hidden">
          <Link to="/" aria-label="ScamShield AI home">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleLogout} className="btn-ghost px-3 py-2 text-xs">
              <LogOut size={14} aria-hidden="true" /> Log out
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink"
              aria-expanded={menuOpen}
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </header>

        <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>

        <footer className="mx-auto w-full max-w-7xl px-4 pb-8 text-xs text-muted sm:px-6 lg:px-8">
          ScamShield AI · Educational project. Predictions are automated estimates and must be
          verified independently.
        </footer>
      </div>
    </div>
  );
}

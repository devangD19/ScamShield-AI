import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';

const NAV_COLUMNS = [
  {
    title: 'Product',
    links: [
      { to: '/', label: 'Home' },
      { to: '/analyze', label: 'Analyze Job' },
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/history', label: 'History' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { to: '/about', label: 'About & Safety' },
      { to: '/about', label: 'How NLP detection works', hash: '#how-it-works' },
      { to: '/about', label: 'How to verify a recruiter', hash: '#verify' },
      { to: '/about', label: 'What not to share', hash: '#dont-share' },
    ],
  },
  {
    title: 'Account',
    links: [
      { to: '/login', label: 'Login' },
      { to: '/register', label: 'Create account' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)] md:gap-8">
        <div>
          <Logo />
          <p className="mt-3 text-sm font-medium text-primary">AI for a safer tomorrow.</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            AI-powered job and internship risk assessment to help Indian students and job seekers
            identify suspicious recruitment offers and make safer career decisions.
          </p>
        </div>

        {NAV_COLUMNS.map((column) => (
          <nav key={column.title} aria-label={`Footer ${column.title}`}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              {column.title}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link, index) => (
                <li key={`${column.title}-${link.label}-${index}`}>
                  <Link
                    to={link.hash ? `${link.to}${link.hash}` : link.to}
                    className="text-sm text-ink/80 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-6 text-xs leading-relaxed text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ScamShield AI · Final-year CSE (AIML) project.</p>
          <p className="sm:max-w-xl sm:text-right">
            Educational purposes only. Not affiliated with any government, police or official
            organisation. ScamShield AI does not guarantee detection of fraudulent listings.
          </p>
        </div>
      </div>
    </footer>
  );
}

import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  CircleSlash,
  FileSearch,
  Fingerprint,
  Info,
  Lightbulb,
  MailWarning,
  ScanSearch,
  ShieldCheck,
  UserRoundX,
} from 'lucide-react';

import { LeafSprig } from '../components/illustrations/Botanicals.jsx';
import { useDocumentTitle } from '../hooks/index.js';

const SECTIONS = [
  { id: 'why', label: 'Why this matters' },
  { id: 'how-it-works', label: 'How NLP classification works' },
  { id: 'signals', label: 'Spotting warning signs' },
  { id: 'false-positives', label: 'When legitimate jobs get flagged' },
  { id: 'verify', label: 'Verifying recruiters' },
  { id: 'dont-share', label: 'What not to share' },
];

export default function AboutPage() {
  useDocumentTitle('About & Safety');

  return (
    <div className="space-y-10 py-10 sm:py-14">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-sage p-6 sm:p-10">
        <LeafSprig className="pointer-events-none absolute -right-4 -top-6 h-36 w-44 opacity-60" flip />
        <div className="relative max-w-3xl">
          <span className="eyebrow">
            <Info size={13} aria-hidden="true" /> About &amp; Safety
          </span>
          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Understanding recruitment scams — and what our model can (and can&apos;t) tell you
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/80 sm:text-base">
            ScamShield AI supports your decision-making. It does not replace independent
            verification of recruiters, companies or offers.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/analyze" className="btn-primary px-5 py-2.5">
              Analyze a Job <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link to="/" className="btn-outline bg-surface px-5 py-2.5">
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* On-page navigation */}
        <nav aria-label="On this page" className="hidden lg:block">
          <div className="sticky top-24">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              On this page
            </h2>
            <ul className="mt-4 space-y-2.5 border-l border-line pl-4">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-sm text-muted transition-colors hover:text-primary"
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="max-w-3xl space-y-10">
          {/* WHY */}
          <section id="why" className="scroll-mt-24">
            <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Why recruitment scams hit Indian students and job seekers
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/85 sm:text-[15px]">
              <p>
                Fresh graduates and students face intense pressure to land internships and first
                jobs, and most hiring now happens over WhatsApp, Telegram, LinkedIn and
                Instagram. That makes Indian candidates a large, reachable target for people
                impersonating recruiters.
              </p>
              <p>
                Common patterns include demands for <strong>registration, training or “refundable” security fees</strong>,
                UPI transfers to personal accounts, requests for OTPs or Aadhaar/PAN details during
                “KYC”, work-from-home offers with guaranteed daily income, and salary promises far
                above market rates. Because these messages imitate real campus drives and
                consultancies, they are easy to mistake for legitimate opportunities.
              </p>
              <p>
                A careful second opinion on the text of an offer — before you pay or share
                anything — is the simple idea behind ScamShield AI.
              </p>
            </div>
          </section>

          {/* HOW NLP WORKS */}
          <section id="how-it-works" className="scroll-mt-24">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sage text-primary">
                <BrainCircuit size={18} aria-hidden="true" />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                How NLP-based text classification works
              </h2>
            </div>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/85 sm:text-[15px]">
              <p>
                At a high level, a natural language processing (NLP) model reads the words and
                structure of your submitted text and converts it into numbers — a process called
                <em> vectorisation</em> or <em>feature extraction</em>. Patterns in those numbers
                are learned during training from labelled examples of legitimate and suspicious
                job postings.
              </p>
              <p>
                ScamShield uses a TF-IDF vectoriser and a logistic regression model trained on
                historical job postings. For a new listing it estimates the probability that the
                text resembles fraudulent postings. If that probability is 55% or higher the
                listing is shown as <strong>Potentially Fraudulent</strong>; otherwise as{' '}
                <strong>Likely Legitimate</strong>.
              </p>
              <p>
                The app only sends your text to the ScamShield backend and displays what the model
                returns — it never fabricates scores or predictions on its own.
              </p>
            </div>
          </section>

          {/* SIGNALS */}
          <section id="signals" className="scroll-mt-24">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sage text-primary">
                <ScanSearch size={18} aria-hidden="true" />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                How text analysis spots warning signs
              </h2>
            </div>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/85 sm:text-[15px]">
              <p>Certain signals recur across reported recruitment frauds:</p>
              <ul className="ml-5 list-disc space-y-2 marker:text-primary">
                <li>
                  <strong>Money requests</strong> — registration fees, “software deposits”,
                  interview charges, refundable security amounts paid by UPI or bank transfer.
                </li>
                <li>
                  <strong>Urgency and secrecy</strong> — limited slots, deadlines tonight, “do not
                  contact the company directly”.
                </li>
                <li>
                  <strong>Too-good-to-be-true pay</strong> — very high salaries for unskilled or
                  part-time work, guaranteed daily payouts.
                </li>
                <li>
                  <strong>Sensitive data requests</strong> — OTPs, card PINs, Aadhaar/PAN scans or
                  remote-access apps during “verification”.
                </li>
                <li>
                  <strong>Contact and channel patterns</strong> — free email domains, personal
                  messaging numbers, job offers that never appear on an official career page.
                </li>
              </ul>
              <p>
                The model weighs these and other cues together and returns the ones it found with
                your specific listing.
              </p>
            </div>
          </section>

          {/* FALSE POSITIVES */}
          <section id="false-positives" className="scroll-mt-24">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-risk-medium/10 text-risk-medium">
                <Lightbulb size={18} aria-hidden="true" />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Why legitimate listings can be flagged too
              </h2>
            </div>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/85 sm:text-[15px]">
              <p>
                Automated classification is statistical, not certain. A genuine work-from-home
                role may be flagged because it shares vocabulary with known scams — words like
                “immediate joining”, “daily payment” or “no experience required” appear in both
                legitimate and fraudulent posts.
              </p>
              <p>
                Small companies, early-stage startups and campus drives can also look unusual to a
                model trained mostly on large, formal job descriptions. A “Potentially Fraudulent”
                prediction therefore means <strong>“verify carefully”</strong>, not “this company
                is a fraud”. Equally, “Likely Legitimate” never guarantees an offer is genuine —
                short scam messages (for example, UPI deposit or registration-fee requests) can be
                missed.
              </p>
              <p>
                ScamShield AI has <strong>no integration</strong> with government databases, police
                records, or employer verification registries. Its output is one input into your
                decision, nothing more.
              </p>
            </div>
          </section>

          {/* VERIFY */}
          <section id="verify" className="scroll-mt-24">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sage text-primary">
                <BadgeCheck size={18} aria-hidden="true" />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                How to verify recruiters and employers independently
              </h2>
            </div>
            <ol className="mt-4 space-y-3 text-sm leading-relaxed text-ink/85 sm:text-[15px]">
              {[
                'Find the company’s official website yourself (search, not the link in the message) and use the careers or contact page listed there.',
                'Check that the recruiter’s email domain matches the official company domain — free or look-alike domains are a warning sign.',
                'Search for the recruiter’s name and designation on LinkedIn and confirm they actually work there.',
                'Look for the same role on the company’s own careers page or verified job portals like Naukri, LinkedIn or Internshala.',
                'Call the company’s published landline or HR number to confirm the hiring drive and the recruiter’s identity.',
                'Never pay anything to apply. Legitimate employers do not charge candidates for registration, interviews or equipment.',
                'If an offer arrived on WhatsApp or Telegram, ask for an official offer letter on company letterhead and verify it through official channels.',
              ].map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* DON'T SHARE */}
          <section id="dont-share" className="scroll-mt-24">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-risk-high/10 text-risk-high">
                <CircleSlash size={18} aria-hidden="true" />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                What information you should avoid sharing
              </h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { icon: Fingerprint, text: 'One-time passwords (OTPs) — no genuine recruiter ever needs yours.' },
                { icon: MailWarning, text: 'Bank credentials, card numbers, UPI PINs or wallet passwords.' },
                { icon: UserRoundX, text: 'Aadhaar/PAN scans before you have verified the employer and signed an offer.' },
                { icon: FileSearch, text: 'Large “KYC” document uploads to messaging IDs instead of an official portal.' },
                { icon: ShieldCheck, text: 'Money for registration, training, kits or “refundable deposits”.' },
                { icon: Info, text: 'Remote-access apps (AnyDesk/TeamViewer) during an interview — they expose your device.' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="rounded-xl border border-line bg-surface p-4">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-risk-high/10 text-risk-high">
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink/85">{text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Closing note */}
          <div className="rounded-2xl border border-primary/20 bg-sage/70 p-5" role="note">
            <div className="flex items-start gap-3">
              <Info size={17} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-ink/85">
                <strong>ScamShield AI provides an automated risk assessment, not a definitive
                determination of fraud.</strong>{' '}
                It is a final-year CSE (AIML) educational project and is not affiliated with any
                government, police or official organisation. Independently verify job offers and
                recruiters before sharing sensitive information or making payments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

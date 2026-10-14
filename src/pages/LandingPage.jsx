import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BrainCircuit,
  FileText,
  Globe,
  IndianRupee,
  Lightbulb,
  Radar,
  ScanSearch,
  SearchCheck,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
  Wallet,
} from 'lucide-react';
import HeroIllustration from '../components/illustrations/HeroIllustration.jsx';
import { LeafSprig } from '../components/illustrations/Botanicals.jsx';
import { useDocumentTitle } from '../hooks/index.js';

const FEATURES = [
  {
    icon: BrainCircuit,
    title: 'AI Text Analysis',
    description:
      'Understands job descriptions, recruiter messages and internship offers using NLP and machine learning.',
  },
  {
    icon: Radar,
    title: 'Suspicious Signal Detection',
    description:
      'Finds common scam patterns such as fee demands, UPI deposits, OTP requests and unrealistic salaries.',
  },
  {
    icon: Lightbulb,
    title: 'Explainable Results',
    description:
      'Clear reasons behind every assessment, plus practical verification steps you can actually follow.',
  },
];

const STEPS = [
  {
    title: 'Submit a Listing',
    description: 'Paste the job description, internship offer or recruiter message you received.',
    icon: FileText,
  },
  {
    title: 'Analyze Signals',
    description: 'The model scans the text for suspicious patterns and risky phrases.',
    icon: ScanSearch,
  },
  {
    title: 'Review Risk',
    description: 'Get a clear estimate — potentially fraudulent or likely legitimate — with the fraud probability.',
    icon: ShieldCheck,
  },
];

const SAFETY_TIPS = [
  {
    icon: Wallet,
    text: 'Never pay registration or interview fees without independently verifying the offer.',
  },
  {
    icon: SearchCheck,
    text: 'Verify recruiter identity through independently located official channels.',
  },
  {
    icon: IndianRupee,
    text: 'Be cautious about UPI deposits, OTP requests and unrealistic salary promises.',
  },
  {
    icon: Globe,
    text: 'Check official company career pages and independently confirm recruiter contact details.',
  },
];

export default function LandingPage() {
  useDocumentTitle("Don't Let a Fake Job Steal Your Future");

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-sage/70"
          aria-hidden="true"
        />
        <LeafSprig className="pointer-events-none absolute -left-10 top-24 hidden h-28 w-36 opacity-70 lg:block" />

        <div className="container-page relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:py-20">
          <div className="max-w-2xl">
            <span className="eyebrow">
              <Sparkles size={13} aria-hidden="true" /> Stay safe · Work smart
            </span>

            <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.06] tracking-tight text-ink sm:text-5xl lg:text-[3.35rem]">
              Don&apos;t Let a <span className="text-risk-high">Fake Job</span> Steal Your Future.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              AI-powered analysis for job and internship offers in India. Paste job descriptions,
              recruiter messages or work-from-home offers and get an instant risk assessment.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/analyze" className="btn-primary px-6 py-3 text-[15px]">
                Analyze a Job <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link to="/dashboard" className="btn-outline px-6 py-3 text-[15px]">
                Explore Dashboard
              </Link>
            </div>

            <p className="mt-6 flex items-start gap-2 text-sm leading-relaxed text-muted">
              <ShieldQuestion size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              ScamShield AI gives an automated second opinion — always verify recruiters
              independently before sharing information or paying anything.
            </p>
          </div>

          <div className="relative">
            <HeroIllustration className="w-full max-w-xl mx-auto" />
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section aria-labelledby="features-heading" className="pb-6 sm:pb-10">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="features-heading" className="section-title">
              Built to read between the lines
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
              Three focused capabilities that turn an untrusted message into an understandable
              assessment.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <article key={title} className="card p-6 transition-shadow hover:shadow-raised">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sage text-primary">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section aria-labelledby="how-heading" className="py-8 sm:py-12">
        <div className="container-page">
          <div className="max-w-xl">
            <span className="eyebrow">How it works</span>
            <h2 id="how-heading" className="mt-4 section-title">
              Get your job or internship analysed in 3 simple steps
            </h2>
          </div>

          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {STEPS.map(({ title, description, icon: Icon }, index) => (
              <li key={title} className="relative">
                <div className="card h-full p-6">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
                      Step {index + 1}
                    </span>
                  </div>
                  <div className="mt-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sage text-primary">
                    <Icon size={18} aria-hidden="true" />
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
                </div>

                {index < STEPS.length - 1 && (
                  <ArrowRight
                    className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-primary/50 md:block"
                    size={18}
                    aria-hidden="true"
                  />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============ SAFETY TIPS ============ */}
      <section aria-labelledby="safety-heading" className="py-8 sm:py-12">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-sage p-6 sm:p-9">
            <LeafSprig className="pointer-events-none absolute -right-6 -top-4 h-32 w-40 opacity-60" flip />

            <div className="relative flex flex-wrap items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                <ShieldCheck size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 id="safety-heading" className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                  Recruitment Safety Tips
                </h2>
                <p className="text-sm text-muted">
                  Practical habits for Indian job seekers — verify before you trust.
                </p>
              </div>
            </div>

            <ul className="relative mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SAFETY_TIPS.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="rounded-2xl border border-primary/10 bg-surface/80 p-4 backdrop-blur-sm"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-sage text-primary">
                    <Icon size={17} aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-sm leading-relaxed text-ink/85">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section aria-labelledby="cta-heading" className="py-10 sm:py-14">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-center text-white sm:px-12 sm:py-14">
            <div
              className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-24 -right-10 h-64 w-64 rounded-full bg-white/5"
              aria-hidden="true"
            />

            <div className="relative mx-auto max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
Educational project
              </span>
              <h2 id="cta-heading" className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
                Got an offer that feels too good to be true?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/80 sm:text-base">
                Paste it into ScamShield AI and see the warning signals, suspicious phrases and
                verification steps — before you pay or share anything.
              </p>

              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/analyze"
                  className="btn w-full bg-white px-6 py-3 text-[15px] text-primary hover:bg-sage sm:w-auto"
                >
                  Analyze a Job <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link
                  to="/dashboard"
                  className="btn w-full border border-white/40 px-6 py-3 text-[15px] text-white hover:bg-white/10 sm:w-auto"
                >
                  Explore Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

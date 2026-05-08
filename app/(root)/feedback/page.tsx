import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  Share2,
  TrendingUp,
  Star,
  Calendar,
} from "lucide-react";

const overall = 84;
const createdAt = "May 1, 2026 · 2:30 PM";

const categoryScores = [
  { name: "Communication Skills", score: 88, comment: "Clear, well-paced delivery with confident framing throughout." },
  { name: "Technical Knowledge", score: 79, comment: "Solid breadth across the stack; deepen on tradeoffs and edge cases." },
  { name: "Problem-Solving", score: 86, comment: "Strong top-down decomposition and clarifying questions." },
  { name: "Cultural & Role Fit", score: 90, comment: "Showed ownership, curiosity, and a collaborative mindset." },
  { name: "Confidence & Clarity", score: 82, comment: "Steady tone; a few hedges in the deeper technical sections." },
];

const strengths = [
  "Excellent clarification questions before diving into solutions.",
  "Used precise vocabulary (CRDTs, idempotency, backpressure) accurately.",
  "Drew clean boundaries between client and server responsibilities.",
  "Connected technical choices back to user impact.",
];

const improvements = [
  "Spend ~30s longer on tradeoffs before committing to an approach.",
  "Quantify scale: QPS, payload sizes, fan-out costs.",
  "Address observability — metrics, traces, alerting.",
  "Tighten STAR stories with measurable outcomes.",
];

const finalAssessment =
  "Strong, well-structured interview with confident delivery. You demonstrated clear architectural thinking and made smart, principled tradeoffs. To convert from a 'hire' to 'strong hire', sharpen the quantitative reasoning and proactively cover failure modes and observability. With one focused practice round on tradeoffs and scale, you're offer-ready.";

const Ring = ({ value }: { value: number }) => {
  const r = 56;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative h-40 w-40">
      <svg className="h-40 w-40 -rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(258 90% 66%)" />
            <stop offset="100%" stopColor="hsl(190 95% 60%)" />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r={r} stroke="hsl(var(--secondary))" strokeWidth="10" fill="none" />
        <circle
          cx="80"
          cy="80"
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s var(--transition-smooth)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold text-gradient">{value}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
};

const Feedback = () => {
  return (
    <div className="container mx-auto py-10 px-4 md:px-8 space-y-6">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto pt-2">
        <p className="text-xs uppercase tracking-widest text-aurora">Session report</p>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mt-2">
          Feedback on the Interview —{" "}
          <span className="text-aurora capitalize">Frontend Engineer</span>
        </h1>

        {/* Meta strip */}
        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 px-4 py-2 rounded-full glass">
          <span className="inline-flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 fill-accent text-accent" />
            Overall Impression:
            <span className="font-semibold text-gradient">{overall}</span>
            <span className="text-muted-foreground">/100</span>
          </span>
          <span className="h-4 w-px bg-white/10" />
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" /> {createdAt}
          </span>
        </div>
      </div>

      {/* Hero score + final assessment */}
      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        <div className="rounded-3xl glass-strong p-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-aurora opacity-20 blur-3xl" />
          <div className="relative flex flex-col items-center">
            <Ring value={overall} />
            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success-100/15 text-success-100 text-xs font-medium">
              <TrendingUp className="h-3.5 w-3.5" /> +6 vs last session
            </div>
            <p className="text-center text-sm text-muted-foreground mt-5">
              You're in the <span className="text-foreground font-medium">top 14%</span> of candidates this week.
            </p>
            <div className="mt-6 flex gap-2 w-full">
              <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full glass hover:ring-glow transition text-sm text-white">
                <Share2 className="h-4 w-4" /> Share
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full glass hover:ring-glow transition text-sm text-white">
                <Download className="h-4 w-4" /> Export
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl glass p-8 relative overflow-hidden">
          <div className="absolute -bottom-24 -right-24 h-60 w-60 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 text-xs text-aurora">
              <Sparkles className="h-3.5 w-3.5" /> Final assessment
            </div>
            <h2 className="text-xl font-semibold mt-2 text-white">The bottom line</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">{finalAssessment}</p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { v: "32m", l: "Duration" },
                { v: "6", l: "Questions" },
                { v: "94%", l: "Talk clarity" },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl bg-secondary/50 border border-white/5 p-4 text-center">
                  <div className="text-xl font-semibold text-gradient">{s.v}</div>
                  <div className="text-[11px] text-muted-foreground mt-1 uppercase tracking-widest">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="rounded-3xl glass p-7">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Breakdown of the Interview</h2>
            <p className="text-sm text-muted-foreground mt-1">
              How you scored across the dimensions interviewers care about.
            </p>
          </div>
        </div>
        <div className="mt-6 grid sm:grid-cols-2 gap-x-8 gap-y-6">
          {categoryScores.map((c, i) => (
            <div key={c.name}>
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-medium text-white">
                  <span className="text-muted-foreground mr-2">{i + 1}.</span>
                  {c.name}
                </span>
                <span className="text-sm text-gradient font-semibold">{c.score}/100</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-aurora rounded-full"
                  style={{ width: `${c.score}%`, transition: "width 1s var(--transition-smooth)" }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{c.comment}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths + improvements */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-3xl glass p-7">
          <div className="flex items-center gap-2">
            <span className="h-9 w-9 rounded-xl bg-success-100/15 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-success-100" />
            </span>
            <h3 className="font-semibold text-lg text-white">Strengths</h3>
          </div>
          <ul className="mt-5 space-y-3">
            {strengths.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-success-100 shrink-0" />
                <span className="text-muted-foreground">{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl glass p-7">
          <div className="flex items-center gap-2">
            <span className="h-9 w-9 rounded-xl bg-warning/15 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-warning" />
            </span>
            <h3 className="font-semibold text-lg text-white">Areas for Improvement</h3>
          </div>
          <ul className="mt-5 space-y-3">
            {improvements.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
                <span className="text-muted-foreground">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-3xl glass-strong p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -bottom-20 -right-10 h-60 w-60 rounded-full bg-accent opacity-20 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs text-aurora">
              <Sparkles className="h-3.5 w-3.5" /> AI Coach
            </div>
            <h3 className="text-2xl font-semibold mt-2 text-white">
              You're one round of focused practice away from offer-ready.
            </h3>
            <p className="text-muted-foreground mt-2">
              Sharpen quantitative tradeoffs next — that's the gap between strong-hire and hire.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full glass hover:ring-glow transition text-white self-start"
            >
              Back to dashboard
            </Link>
            <Link
              href="/interview"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-aurora text-primary-foreground font-medium shadow-[var(--shadow-glow)] hover:scale-[1.02] transition-transform self-start"
            >
              Practice again <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;

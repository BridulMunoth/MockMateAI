import Link from "next/link";
import Image from "next/image";
import { Calendar, Star, ArrowRight, Code2, Palette, LineChart, Target, Users, Rocket, Briefcase } from "lucide-react";
import { Suspense } from "react";
import DisplayTechIcons from "@/components/DisplayTechIcons";
import CompanyLogo from "@/components/CompanyLogo";
import CardSpotlight from "@/components/CardSpotlight";

const getRoleIcon = (role: string = "", type: string = "") => {
  const r = role.toLowerCase();
  const t = type.toLowerCase();
  if (r.includes("engineer") || r.includes("developer") || t.includes("technical")) return <Code2 className="h-6 w-6 text-white" />;
  if (r.includes("design") || t.includes("creative")) return <Palette className="h-6 w-6 text-white" />;
  if (r.includes("data") || r.includes("analy") || t.includes("scientific")) return <LineChart className="h-6 w-6 text-white" />;
  if (r.includes("manager") || r.includes("product") || t.includes("managerial")) return <Target className="h-6 w-6 text-white" />;
  if (r.includes("hr") || r.includes("human") || t.includes("behavioral")) return <Users className="h-6 w-6 text-white" />;
  if (r.includes("market") || r.includes("sale")) return <Rocket className="h-6 w-6 text-white" />;
  return <Briefcase className="h-6 w-6 text-white" />;
};

export type Interview = {
  id: string;
  role: string;
  type: string | string[];
  techstack: string[];
  createdAt: string;
  score?: number | null;
  cover?: string;
  coverGradient?: string;
  companyName?: string;
  latestScore?: number | null;
  attemptCount?: number;
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${date} • ${time}`;
};

const scoreColor = (s: number) =>
  s >= 90 ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" :
  s >= 75 ? "text-yellow-400  bg-yellow-400/10  border-yellow-400/30"  :
  s >= 50 ? "text-orange-400  bg-orange-400/10  border-orange-400/30"  :
             "text-red-400    bg-red-400/10    border-red-400/30";

const scoreLabel = (s: number) =>
  s >= 90 ? "Excellent" : s >= 75 ? "Good" : s >= 50 ? "Average" : "Needs Work";

const InterviewCard = ({ interview }: { interview: Interview }) => {
  const score    = interview.latestScore ?? interview.score;
  const sessionLogs = (interview as any).sessionLogs || [];
  const taken    = (interview.attemptCount != null && interview.attemptCount > 0) || 
                   score != null || 
                   (Array.isArray(sessionLogs) && sessionLogs.length > 0);
  const typeStr  = Array.isArray(interview.type) ? interview.type[0] : interview.type;
  const company  = interview.companyName?.trim() || "";

  return (
    <CardSpotlight>
      {taken && score != null && (
        <div className="absolute top-3 right-3 z-20 group/star cursor-help">
          <div className="relative flex items-center justify-center h-12 w-12 hover:scale-110 transition-transform">
            <Star className={`h-10 w-10 fill-current ${
              score >= 90 ? "text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]" :
              score >= 75 ? "text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]" :
              score >= 50 ? "text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.6)]" :
              "text-red-400 drop-shadow-[0_0_12px_rgba(248,113,113,0.6)]"
            }`} />
            <span className="absolute text-[11px] font-bold text-[hsl(250_25%_9%)] pt-0.5 pointer-events-none">
              {score}
            </span>
          </div>

          {/* Hover Tooltip explaining ranges */}
          <div className="absolute top-12 right-0 w-44 p-3 rounded-xl bg-[hsl(250_25%_15%)] border border-white/10 shadow-2xl opacity-0 translate-y-2 group-hover/star:opacity-100 group-hover/star:translate-y-0 transition-all pointer-events-none z-30">
             <div className="text-xs font-semibold text-white mb-2">Score Scale</div>
             <div className="space-y-1.5 text-[10px]">
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_5px_#34d399]"></div><span className="text-muted-foreground">90-100 Excellent</span></div>
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_5px_#facc15]"></div><span className="text-muted-foreground">75-89 Good</span></div>
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_5px_#fb923c]"></div><span className="text-muted-foreground">50-74 Average</span></div>
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_5px_#f87171]"></div><span className="text-muted-foreground">&lt; 50 Needs Work</span></div>
             </div>
          </div>
        </div>
      )}

      {/* ── Top accent line ── */}
      <div className="h-[2px] w-full bg-gradient-to-r from-violet-500 via-purple-400 to-indigo-500 opacity-60 group-hover:opacity-100 transition-opacity relative z-10" />

      {/* ── Header: logo + company name + type badge ── */}
      <div className="p-5 pb-3 flex items-start gap-3 justify-between">

        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Logo container without white background */}
          <div className="h-12 w-12 flex-shrink-0 flex items-center justify-center overflow-hidden">
            {company ? (
              <CompanyLogo name={company} fallbackNode={getRoleIcon(interview.role, typeStr)} />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-inner drop-shadow-md">
                {getRoleIcon(interview.role, typeStr)}
              </div>
            )}
          </div>

          <div className="min-w-0">
            {/* Company name */}
            <p className="text-[10px] font-semibold uppercase tracking-widest text-aurora truncate">
              {company || "Independent"}
            </p>
            {/* Role */}
            <h3 className="text-[15px] font-bold text-white capitalize leading-snug truncate mt-0.5">
              {interview.role} Interview
            </h3>
          </div>
        </div>

        {/* Type badge */}
        <span className="flex-shrink-0 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-muted-foreground font-medium">
          {typeStr}
        </span>
      </div>

      {/* ── Date + score row ── */}
      <div className="px-5 pb-3 flex items-center gap-3 flex-wrap">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 flex-shrink-0" />
          {formatDate(interview.createdAt)}
        </span>

        {score != null ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="h-3 w-3 flex-shrink-0" />
            Completed
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="h-3 w-3 flex-shrink-0" />
            {taken ? "Completed" : "Not taken"}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="mx-5 mt-auto h-px bg-white/[0.05]" />

      {/* ── Footer: tech icons + CTA ── */}
      <div className="p-4 pt-3 flex items-center justify-between gap-3">
        <Suspense fallback={<div className="h-7 w-24 rounded-full bg-white/5 animate-pulse" />}>
          <DisplayTechIcons techstack={interview.techstack ?? []} />
        </Suspense>

        <div className="flex items-center gap-2 flex-shrink-0">
          {taken && (
            <Link
              href={`/feedback?id=${interview.id}`}
              className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/10 text-white/70 hover:text-white transition-all font-medium"
            >
              Feedback
            </Link>
          )}
          <Link
            href={`/interview/new?id=${interview.id}`}
            className="inline-flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-full bg-aurora text-white font-semibold hover:scale-[1.04] active:scale-[0.98] transition-transform shadow-[0_0_14px_rgba(139,92,246,0.4)]"
          >
            {taken ? "Try again" : "Take it"}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </CardSpotlight>
  );
};

export default InterviewCard;

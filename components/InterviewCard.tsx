import Link from "next/link";
import { Calendar, Star, ArrowRight } from "lucide-react";
import DisplayTechIcons from "@/components/DisplayTechIcons";

export type Interview = {
  id: string;
  role: string;
  /** Free-form category: Technical, Behavioral, Mixed, Managerial, Scientific, Creative, etc. */
  type: string;
  /** Skills, tools, or domains relevant to this interview */
  techstack: string[];
  createdAt: string; // ISO
  score?: number | null;
  cover: string; // emoji or single char
  coverGradient: string; // tailwind gradient classes
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getScoreColor = (score: number | null | undefined) => {
  if (score == null) return "";
  if (score >= 90) return "fill-emerald-400 text-emerald-400";
  if (score >= 75) return "fill-yellow-400 text-yellow-400";
  if (score >= 50) return "fill-orange-400 text-orange-400";
  return "fill-red-400 text-red-400";
};

const InterviewCard = ({ interview }: { interview: Interview }) => {
  const taken = interview.score != null;
  return (
    <div className="group relative rounded-3xl glass hover:ring-glow transition-all overflow-hidden flex flex-col">
      <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-aurora opacity-10 group-hover:opacity-20 blur-3xl transition" />

      {/* Header */}
      <div className="p-6 flex items-start justify-between gap-4">
        <div className={`h-14 w-14 rounded-2xl ${interview.coverGradient} flex items-center justify-center text-2xl ring-1 ring-white/10 shadow-[var(--shadow-soft)]`}>
          <span>{interview.cover}</span>
        </div>
        <span className="text-[11px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-secondary/70 border border-white/5 text-muted-foreground">
          {interview.type}
        </span>
      </div>

      {/* Body */}
      <div className="px-6 pb-2 flex-1">
        <h3 className="text-xl font-semibold capitalize leading-tight">
          {interview.role} Interview
        </h3>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(interview.createdAt)}
          </span>
          <span className="relative inline-flex items-center gap-1.5 group/star cursor-help">
            <Star className={`h-3.5 w-3.5 transition-colors ${getScoreColor(interview.score)}`} />
            {taken ? `${interview.score}/100` : "Not taken"}

            {/* Custom Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-3 rounded-xl glass-strong border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] opacity-0 translate-y-2 pointer-events-none group-hover/star:opacity-100 group-hover/star:translate-y-0 transition-all duration-300 z-50">
              <p className="text-[10px] font-bold text-white/80 mb-2 uppercase tracking-wider text-center">Score Guide</p>
              <div className="space-y-1.5 text-xs font-medium">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-emerald-400"><Star className="h-3 w-3 fill-emerald-400" /> Excellent</span>
                  <span className="text-white/70">90+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-yellow-400"><Star className="h-3 w-3 fill-yellow-400" /> Good</span>
                  <span className="text-white/70">75-89</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-orange-400"><Star className="h-3 w-3 fill-orange-400" /> Average</span>
                  <span className="text-white/70">50-74</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-red-400"><Star className="h-3 w-3 fill-red-400" /> Poor</span>
                  <span className="text-white/70">&lt;50</span>
                </div>
              </div>
            </div>
          </span>
        </div>

        <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
          {taken
            ? "Great effort! Review your feedback to sharpen your answers and keep climbing."
            : "Practice this interview to improve your confidence and benchmark your skills."}
        </p>
      </div>

      {/* Footer */}
      <div className="p-6 pt-4 flex items-center justify-between z-10">
        <DisplayTechIcons techstack={interview.techstack} />
        
        <Link
          href={taken ? `/feedback` : `/interview`}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-1.5 rounded-full bg-aurora text-primary-foreground hover:scale-[1.03] transition-transform"
        >
          {taken ? "View feedback" : "Take it"}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default InterviewCard;

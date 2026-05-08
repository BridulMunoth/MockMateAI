"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  X,
  Building2,
  Briefcase,
  Code2,
  Target,
  Upload,
  Sparkles,
} from "lucide-react";
import { FileUploadZone } from "./FileUploadZone";

/* ── Types ── */
export interface FormData {
  companyName: string;
  role: string;
  interviewTypes: string[];
  techStack: string[];
  level: string;
  amountMode: "time" | "questions" | null;
  duration: number | null;
  questionCount: number | null;
  resume: File | null;
  jobDescription: File | null;
  prepMaterial: File | null;
}

interface Props {
  userName: string;
  onSubmit: (data: FormData) => void;
  onBack: () => void;
}

/* ── Constants ── */
const INTERVIEW_TYPES = [
  { id: "Technical",   label: "Technical",   emoji: "🧑‍💻" },
  { id: "Behavioral",  label: "Behavioral",  emoji: "🤝" },
  { id: "HR",          label: "HR",          emoji: "🧑‍🤝‍🧑" },
  { id: "Managerial",  label: "Managerial",  emoji: "📊" },
  { id: "Scientific",  label: "Scientific",  emoji: "🔬" },
  { id: "Creative",    label: "Creative",    emoji: "🎨" },
];

const LEVELS = [
  { id: "Internship", label: "Intern",   sub: "Fresh / 0 yrs" },
  { id: "Junior",     label: "Junior",   sub: "0-2 years" },
  { id: "Mid",        label: "Mid",      sub: "2-5 years" },
  { id: "Senior",     label: "Senior",   sub: "5-10 years" },
  { id: "Lead",       label: "Lead",     sub: "10+ years" },
];

const DURATIONS = [15, 20, 30, 45, 60];
const QUESTION_COUNTS = [3, 5, 10, 15, 20];

const POPULAR_SKILLS: Record<string, string[]> = {
  Technical:   ["React", "TypeScript", "Node.js", "Python", "SQL", "AWS", "Docker", "GraphQL"],
  Behavioral:  ["Leadership", "Communication", "Problem Solving", "Teamwork", "Conflict Resolution"],
  HR:          ["Recruitment", "Onboarding", "Culture Fit", "Compensation & Benefits", "Employee Relations", "HRIS"],
  Managerial:  ["Stakeholder Management", "Agile", "OKRs", "Roadmapping", "Hiring"],
  Scientific:  ["Python", "R", "SPSS", "Statistics", "Machine Learning", "Research"],
  Creative:    ["Figma", "UX Design", "Branding", "Storytelling", "Illustration"],
};

const STEPS = [
  { id: 0, label: "Company",   icon: Building2 },
  { id: 1, label: "Role",      icon: Briefcase },
  { id: 2, label: "Skills",    icon: Code2 },
  { id: 3, label: "Level",     icon: Target },
  { id: 4, label: "Files",     icon: Upload },
];

/* ── Component ── */
export const InterviewFormWizard = ({ userName, onSubmit, onBack }: Props) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [tagInput, setTagInput] = useState("");

  const [data, setData] = useState<FormData>({
    companyName:    "",
    role:           "",
    interviewTypes: [],
    techStack:      [],
    level:          "",
    amountMode:     null,
    duration:       null,
    questionCount:  null,
    resume:         null,
    jobDescription: null,
    prepMaterial:   null,
  });

  const update = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setData((d) => ({ ...d, [key]: val }));

  const toggleInterviewType = (typeId: string) => {
    setData((d) => {
      const selected = d.interviewTypes;
      if (selected.includes(typeId)) {
        return { ...d, interviewTypes: selected.filter((t) => t !== typeId) };
      }
      return { ...d, interviewTypes: [...selected, typeId] };
    });
  };

  const addTag = (tag: string) => {
    const clean = tag.trim();
    if (clean && !data.techStack.includes(clean)) {
      update("techStack", [...data.techStack, clean]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    update("techStack", data.techStack.filter((t) => t !== tag));

  const next = () => { setDirection("forward"); setStep((s) => s + 1); };
  const back = () => { if (step === 0) { onBack(); return; } setDirection("back"); setStep((s) => s - 1); };

  const canProceed = () => {
    if (step === 0) return data.companyName.trim().length > 0;
    if (step === 1) return data.role.trim().length > 0 && data.interviewTypes.length > 0;
    if (step === 3) {
      const levelSelected = data.level !== "";
      if (data.amountMode === "time") return levelSelected && data.duration !== null;
      if (data.amountMode === "questions") return levelSelected && data.questionCount !== null;
      return false;
    }
    return true;
  };

  const suggestions = Array.from(
    new Set(data.interviewTypes.flatMap((t) => POPULAR_SKILLS[t] ?? []))
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 pt-12 pb-20 relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-aurora opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-800/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Greeting */}
        <div className="text-center mb-8 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/10 text-xs text-muted-foreground mb-4">
            <Sparkles className="h-3 w-3 text-aurora" />
            Step {step + 1} of {STEPS.length}
          </div>
          {step === 0 && (
            <>
              <h2 className="text-3xl font-bold text-white">
                Great move, {userName}! 🚀
              </h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed max-w-sm mx-auto">
                Investing in yourself is always the right decision. Let's set up your personalised interview — it takes less than a minute!
              </p>
            </>
          )}
          {step === 1 && (
            <>
              <h2 className="text-3xl font-bold text-white">What role?</h2>
              <p className="text-muted-foreground mt-2 text-sm">Tell us the position and interview style.</p>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="text-3xl font-bold text-white">Your skills</h2>
              <p className="text-muted-foreground mt-2 text-sm">Add the technologies or domains relevant to this role.</p>
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="text-3xl font-bold text-white">Your level</h2>
              <p className="text-muted-foreground mt-2 text-sm">We'll calibrate question difficulty accordingly.</p>
            </>
          )}
          {step === 4 && (
            <>
              <h2 className="text-3xl font-bold text-white">Upload files</h2>
              <p className="text-muted-foreground mt-2 text-sm">All optional — upload whatever's helpful for personalisation.</p>
            </>
          )}
        </div>

        {/* Step progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  i < step ? "bg-aurora shadow-[var(--shadow-glow)]" :
                  i === step ? "bg-aurora/30 ring-2 ring-aurora/60" :
                  "bg-secondary"
                }`}>
                  {i < step ? <Check className="h-4 w-4 text-white" /> : <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${i < step ? "bg-aurora" : "bg-secondary"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Panel */}
        <div key={step} className="animate-fadeIn">
          {/* ── Step 0: Company ── */}
          {step === 0 && (
            <div className="space-y-5 rounded-3xl glass-strong border border-white/5 p-6 md:p-8">
              <div>
                <label className="text-sm font-medium text-white/80 block mb-2">
                  Company / Organisation Name <span className="text-destructive-100 text-xs">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Google, IIT Delhi, your startup…"
                  value={data.companyName}
                  onChange={(e) => update("companyName", e.target.value)}
                  className="w-full rounded-2xl bg-secondary/60 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-aurora/50 focus:ring-1 focus:ring-aurora/30 transition-all"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Helps us tailor questions to the company's culture and interview style.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 1: Role & Type ── */}
          {step === 1 && (
            <div className="space-y-5 rounded-3xl glass-strong border border-white/5 p-6 md:p-8">
              <div>
                <label className="text-sm font-medium text-white/80 block mb-2">Job Role / Position <span className="text-destructive-100 text-xs">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Frontend Engineer, Product Manager, Data Scientist…"
                  value={data.role}
                  onChange={(e) => update("role", e.target.value)}
                  className="w-full rounded-2xl bg-secondary/60 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-aurora/50 focus:ring-1 focus:ring-aurora/30 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/80 block mb-1">Interview Type <span className="text-destructive-100 text-xs">*</span></label>
                <p className="text-xs text-muted-foreground mb-3">Select all that apply — you can mix types.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {INTERVIEW_TYPES.map((t) => {
                    const isActive = data.interviewTypes.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleInterviewType(t.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border text-sm transition-all ${
                          isActive
                            ? "bg-aurora/15 border-aurora/50 text-white ring-1 ring-aurora/30"
                            : "glass border-white/10 text-muted-foreground hover:text-white hover:border-white/20"
                        }`}
                      >
                        <span>{t.emoji}</span>
                        <span className="flex-1 text-left">{t.label}</span>
                        {isActive && <Check className="h-3.5 w-3.5 text-aurora flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Tech Stack ── */}
          {step === 2 && (
            <div className="space-y-5 rounded-3xl glass-strong border border-white/5 p-6 md:p-8">
              <div>
                <label className="text-sm font-medium text-white/80 block mb-2">Skills / Tech Stack</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a skill and press Enter…"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); } }}
                    className="flex-1 rounded-2xl bg-secondary/60 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-aurora/50 focus:ring-1 focus:ring-aurora/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => addTag(tagInput)}
                    className="h-10 w-10 rounded-2xl bg-aurora/20 border border-aurora/30 flex items-center justify-center hover:bg-aurora/30 transition-all"
                  >
                    <Plus className="h-4 w-4 text-white" />
                  </button>
                </div>

                {/* Tags */}
                {data.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {data.techStack.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-aurora/15 border border-aurora/30 text-xs text-white animate-fadeIn"
                      >
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Suggestions */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Popular for {data.interviewTypes.join(" + ")}:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions
                    .filter((s) => !data.techStack.includes(s))
                    .map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addTag(s)}
                        className="text-xs px-2.5 py-1 rounded-full glass border border-white/10 text-muted-foreground hover:text-white hover:border-white/25 transition-all"
                      >
                        + {s}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Level & Duration ── */}
          {step === 3 && (
            <div className="space-y-6 rounded-3xl glass-strong border border-white/5 p-6 md:p-8">
              <div>
                <label className="text-sm font-medium text-white/80 block mb-3">Experience Level <span className="text-destructive-100 text-xs">*</span></label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {LEVELS.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => update("level", l.id)}
                      className={`flex flex-col items-start px-4 py-3 rounded-2xl border text-sm transition-all text-left ${
                        data.level === l.id
                          ? "bg-aurora/15 border-aurora/50 text-white ring-1 ring-aurora/30"
                          : "glass border-white/10 text-muted-foreground hover:text-white hover:border-white/20"
                      }`}
                    >
                      <span className="font-medium">{l.label}</span>
                      <span className="text-[11px] opacity-70 mt-0.5">{l.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-white/80">
                    Interview Length <span className="text-destructive-100 text-xs">*</span>
                  </label>
                  <div className="flex bg-secondary/50 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => update("amountMode", "time")}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                        data.amountMode === "time" ? "bg-aurora text-white shadow" : "text-muted-foreground hover:text-white"
                      }`}
                    >
                      By Time
                    </button>
                    <button
                      type="button"
                      onClick={() => update("amountMode", "questions")}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                        data.amountMode === "questions" ? "bg-aurora text-white shadow" : "text-muted-foreground hover:text-white"
                      }`}
                    >
                      By Questions
                    </button>
                  </div>
                </div>

                {data.amountMode === "time" ? (
                  <div className="flex gap-2 flex-wrap">
                    {DURATIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => update("duration", d)}
                        className={`px-4 py-2 rounded-full text-sm border transition-all ${
                          data.duration === d
                            ? "bg-aurora/15 border-aurora/50 text-white ring-1 ring-aurora/30"
                            : "glass border-white/10 text-muted-foreground hover:text-white"
                        }`}
                      >
                        {d} min
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {QUESTION_COUNTS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => update("questionCount", q)}
                        className={`px-4 py-2 rounded-full text-sm border transition-all ${
                          data.questionCount === q
                            ? "bg-aurora/15 border-aurora/50 text-white ring-1 ring-aurora/30"
                            : "glass border-white/10 text-muted-foreground hover:text-white"
                        }`}
                      >
                        {q} Qs
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 4: File Uploads ── */}
          {step === 4 && (
            <div className="space-y-4 rounded-3xl glass-strong border border-white/5 p-6 md:p-8">
              <FileUploadZone
                label="Resume / CV"
                description="Upload your resume so we can ask experience-specific questions"
                file={data.resume}
                onFile={(f) => update("resume", f)}
              />
              <FileUploadZone
                label="Job Description"
                description="Paste the JD from the company portal or upload the PDF"
                file={data.jobDescription}
                onFile={(f) => update("jobDescription", f)}
              />
              <FileUploadZone
                label="Prep Material"
                description="Any notes, study guides, or files shared by your college/company"
                file={data.prepMaterial}
                onFile={(f) => update("prepMaterial", f)}
              />
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <div className="flex justify-between gap-3 mt-6">
          <button
            type="button"
            onClick={back}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-strong border border-white/10 text-sm text-muted-foreground hover:text-white transition-all hover:border-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 0 ? "Back" : "Previous"}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              disabled={!canProceed()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-aurora text-primary-foreground text-sm font-medium shadow-[var(--shadow-glow)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSubmit(data)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-aurora text-primary-foreground text-sm font-semibold shadow-[var(--shadow-glow)] hover:scale-[1.02] transition-all"
            >
              Generate Interview 🚀
            </button>
          )}
        </div>

        {/* Skip files hint on step 4 */}
        {step === 4 && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            All files are optional — you can skip and generate without them.
          </p>
        )}
      </div>
    </div>
  );
};

export default InterviewFormWizard;

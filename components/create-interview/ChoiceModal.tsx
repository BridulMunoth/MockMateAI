"use client";

import { Mic, FileText, Sparkles, Zap, Brain } from "lucide-react";
import { useState } from "react";

interface Props {
  userName: string;
  onSelect: (path: "form" | "voice") => void;
}

export const ChoiceModal = ({ userName, onSelect }: Props) => {
  const [hovered, setHovered] = useState<"form" | "voice" | null>(null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative">
      {/* Background aurora blobs */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-aurora opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-aurora opacity-10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-14 animate-fade-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-muted-foreground mb-6 border border-white/10">
          <Sparkles className="h-3.5 w-3.5 text-aurora" />
          <span className="bg-clip-text text-transparent bg-aurora">New Interview Session</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
          Hey {userName}! 👋
          <br />
          <span className="text-aurora">Let's get you interview-ready</span>
        </h1>
        <p className="mt-5 text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
          Taking this step already shows your dedication. Choose how you'd like
          to set up your practice session.
        </p>
      </div>

      {/* Choice Cards */}
      <div className="grid sm:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Form Card */}
        <button
          onClick={() => onSelect("form")}
          onMouseEnter={() => setHovered("form")}
          onMouseLeave={() => setHovered(null)}
          className="group relative rounded-3xl glass-strong p-8 text-left border border-white/10 hover:border-primary/40 hover:ring-glow transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
          <div className="relative z-10">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(139,92,246,0.4)] group-hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] transition-shadow">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Fill the Form</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Type in your role, skills, and optionally upload your resume or job
              description. Quick and precise.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Role & Skills", "File Upload", "Custom Level"].map((tag) => (
                <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full bg-secondary/70 border border-white/5 text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </button>

        {/* Voice Card */}
        <button
          disabled
          onMouseEnter={() => setHovered("voice")}
          onMouseLeave={() => setHovered(null)}
          className="group relative rounded-3xl glass-strong p-8 text-left border border-white/5 opacity-60 grayscale-[0.5] transition-all duration-300 cursor-not-allowed overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
          
          {/* Upcoming Feature Badge */}
          <div className="absolute top-4 right-4 z-20">
            <span className="px-2.5 py-1 rounded-md bg-secondary border border-white/10 text-[10px] font-bold uppercase tracking-tighter text-muted-foreground group-hover:text-aurora group-hover:border-aurora/30 transition-colors">
              Coming Soon
            </span>
          </div>

          <div className="relative z-10">
            <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center mb-5 border border-white/10 group-hover:border-aurora/30 transition-colors">
              <Mic className="h-7 w-7 text-muted-foreground group-hover:text-aurora transition-colors" />
            </div>
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">Use Voice Agent</h3>
            <p className="text-sm text-muted-foreground/60 leading-relaxed">
              Tell our AI assistant about your interview needs. Just speak
              naturally — it'll handle the rest.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Hands-Free", "AI Powered", "Upcoming"].map((tag) => (
                <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full bg-secondary/30 border border-white/5 text-muted-foreground/40">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Hover Overlay Message */}
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
             <p className="text-sm font-medium text-white bg-aurora/80 px-4 py-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
               🚀 Upcoming Feature
             </p>
          </div>
        </button>
      </div>

      {/* Trust badge */}
      <div className="mt-12 flex items-center gap-2 text-xs text-muted-foreground animate-fade-up">
        <Brain className="h-3.5 w-3.5" />
        AI generates personalised questions in under 30 seconds
        <Zap className="h-3.5 w-3.5 text-aurora" />
      </div>
    </div>
  );
};

export default ChoiceModal;

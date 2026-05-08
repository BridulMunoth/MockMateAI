"use client";

import { useState } from "react";
import { Mic, MicOff, Volume2, ChevronRight } from "lucide-react";
import { FileUploadZone } from "./FileUploadZone";

interface Props {
  onSubmit: (data: { companyName: string; resume: File | null; jobDescription: File | null; prepMaterial: File | null }) => void;
  onBack: () => void;
}

type VoiceState = "idle" | "listening" | "processing";

export const VoiceCollectView = ({ onSubmit, onBack }: Props) => {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [companyName, setCompanyName] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<File | null>(null);
  const [prepMaterial, setPrepMaterial] = useState<File | null>(null);

  const toggleListen = () => {
    if (voiceState === "idle") {
      setVoiceState("listening");
    } else if (voiceState === "listening") {
      setVoiceState("processing");
      // Simulate processing
      setTimeout(() => setVoiceState("idle"), 2000);
    }
  };

  const handleSubmit = () => {
    onSubmit({ companyName, resume, jobDescription, prepMaterial });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative">
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg flex flex-col gap-8 animate-fade-up">
        {/* Header */}
        <div className="text-center">
          <button onClick={onBack} className="text-xs text-muted-foreground hover:text-white transition-colors mb-4 inline-flex items-center gap-1">
            ← Back
          </button>
          <h2 className="text-3xl font-bold text-white">Voice Setup</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Tap the mic and tell the AI your role, company, and what kind of interview you want.
          </p>
        </div>

        {/* Voice button */}
        <div className="flex flex-col items-center gap-6">
          {/* Mic button with rings */}
          <div className="relative">
            {voiceState === "listening" && (
              <>
                <span className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping" />
                <span className="absolute inset-[-12px] rounded-full bg-cyan-500/10 animate-ping" style={{ animationDelay: "150ms" }} />
              </>
            )}
            <button
              onClick={toggleListen}
              className={`relative h-24 w-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-[var(--shadow-glow)] ${
                voiceState === "listening"
                  ? "bg-gradient-to-br from-cyan-500 to-teal-600 scale-110"
                  : voiceState === "processing"
                  ? "bg-secondary animate-pulse cursor-not-allowed"
                  : "bg-gradient-to-br from-violet-600 to-indigo-700 hover:scale-105"
              }`}
            >
              {voiceState === "listening" ? (
                <MicOff className="h-10 w-10 text-white" />
              ) : voiceState === "processing" ? (
                <Volume2 className="h-10 w-10 text-muted-foreground" />
              ) : (
                <Mic className="h-10 w-10 text-white" />
              )}
            </button>
          </div>

          {/* Voice state label */}
          <p className="text-sm text-muted-foreground h-5">
            {voiceState === "idle" && "Tap to speak"}
            {voiceState === "listening" && (
              <span className="text-cyan-400 animate-pulse">Listening… tap again to stop</span>
            )}
            {voiceState === "processing" && (
              <span className="text-violet-400">Processing your voice…</span>
            )}
          </p>

          {/* Voice waveform (decorative) */}
          {voiceState === "listening" && (
            <div className="flex items-end gap-1 h-10 animate-fadeIn">
              {Array.from({ length: 20 }).map((_, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-cyan-400 transition-all"
                  style={{
                    height: `${8 + Math.abs(Math.sin(i * 0.7)) * 28}px`,
                    opacity: 0.4 + (i % 3) * 0.2,
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-xs text-muted-foreground">Or fill in manually</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {/* Manual company name */}
        <div>
          <label className="text-sm font-medium text-white/80 block mb-2">
            Company Name <span className="text-muted-foreground font-normal text-xs">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Google, your college, startup name…"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full rounded-2xl bg-secondary/60 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-aurora/50 focus:ring-1 focus:ring-aurora/30 transition-all"
          />
        </div>

        {/* File Uploads */}
        <div className="space-y-4">
          <FileUploadZone label="Resume / CV" description="Upload your resume for personalised questions" file={resume} onFile={setResume} />
          <FileUploadZone label="Job Description" description="The JD shared by the company" file={jobDescription} onFile={setJobDescription} />
          <FileUploadZone label="Prep Material" description="Notes, study material, or any file shared by your college/company" file={prepMaterial} onFile={setPrepMaterial} />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full py-3.5 rounded-2xl bg-aurora text-primary-foreground font-semibold shadow-[var(--shadow-glow)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
        >
          Generate My Interview <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default VoiceCollectView;

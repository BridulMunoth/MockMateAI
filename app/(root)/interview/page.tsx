"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mic, MicOff, Pause, Play, PhoneOff, Bot, User, Volume2 } from "lucide-react";
import { getCurrentUser } from "@/lib/actions/auth.action";

type Msg = { role: "ai" | "user"; text: string; time: string };

const initialMsgs: Msg[] = [
  {
    role: "ai",
    text: "Hi! I'm Mira, your interviewer today. We'll spend ~30 minutes on a frontend system design round. Ready when you are.",
    time: "00:00",
  },
  {
    role: "ai",
    text: "Let's start with a warm-up: walk me through how you'd architect a real-time collaborative document editor.",
    time: "00:08",
  },
];

const techstack = ["React", "TypeScript", "Next", "GraphQL"];
const techDot: Record<string, string> = {
  React: "bg-cyan-400",
  TypeScript: "bg-blue-400",
  Next: "bg-white",
  GraphQL: "bg-pink-400",
};

const formatTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const VoiceWave = ({ active }: { active: boolean }) => (
  <div className="flex items-end gap-1 h-12">
    {Array.from({ length: 28 }).map((_, i) => (
      <span
        key={i}
        className="w-1 rounded-full bg-aurora transition-all"
        style={{
          height: active ? `${20 + Math.abs(Math.sin(i * 0.6 + Date.now() / 200)) * 36}px` : "6px",
          opacity: active ? 0.6 + (i % 4) * 0.1 : 0.3,
        }}
      />
    ))}
  </div>
);

const Interview = () => {
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [msgs, setMsgs] = useState<Msg[]>(initialMsgs);
  const [tick, setTick] = useState(0);
  const [user, setUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isSpeaking = !paused;

  useEffect(() => {
    getCurrentUser().then((u) => setUser(u));
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setSeconds((s) => s + 1);
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [paused]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const sendDemo = () => {
    setMsgs((m) => [
      ...m,
      {
        role: "user",
        text: "I'd start by clarifying the collaboration model — is it OT or CRDT-based? Then I'd sketch the client/server boundaries…",
        time: formatTime(seconds),
      },
    ]);
    setTimeout(() => {
      setMsgs((m) => [
        ...m,
        {
          role: "ai",
          text: "Good direction. Let's go deeper — how would you handle offline edits and reconcile them when the user reconnects?",
          time: formatTime(seconds + 4),
        },
      ]);
    }, 900);
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-8 space-y-6">
      {/* Interview header — cover, role, tech stack, type */}
      <div className="rounded-3xl glass-strong p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-700 ring-1 ring-white/10 flex items-center justify-center text-2xl shadow-[var(--shadow-soft)]">
            🪐
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-aurora">Live session</p>
            <h1 className="text-2xl md:text-3xl font-semibold capitalize mt-1 text-white">
              Frontend Engineer Interview
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {techstack.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full glass text-xs text-white"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${techDot[t] ?? "bg-secondary"}`} />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full bg-secondary/70 border border-white/5 text-xs text-muted-foreground">
            Technical
          </span>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-white">
            <span className="h-2 w-2 rounded-full bg-success-100 animate-pulse-glow" />
            Recording · {formatTime(seconds)}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Stage */}
        <div className="rounded-3xl glass-strong p-6 md:p-10 relative overflow-hidden min-h-[560px] flex flex-col">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-aurora opacity-30 blur-3xl" />

          <div className="relative grid sm:grid-cols-2 gap-6 items-center">
            {/* Interviewer */}
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className={`absolute inset-0 rounded-full bg-aurora opacity-40 blur-2xl ${!paused && "animate-pulse-glow"}`} />
                <div className="relative h-28 w-28 rounded-full overflow-hidden ring-2 ring-aurora/50 shadow-[var(--shadow-glow)] animate-float">
                  <Image
                    src="/AI_Logo.png"
                    alt="AI MockMate"
                    fill
                    className="object-cover scale-[1.75]"
                  />
                  {isSpeaking && <span className="animate-speak"></span>}
                </div>
              </div>
              <h2 className="mt-5 text-lg font-semibold text-white">AI MockMate</h2>
              <p className="text-xs text-muted-foreground">Your AI Interviewer</p>
            </div>

            {/* You */}
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="relative h-28 w-28 rounded-full bg-secondary flex items-center justify-center ring-1 ring-white/10 overflow-hidden">
                  {user?.photoURL ? (
                    <Image src={user.photoURL} alt="Your Avatar" fill className="object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
              </div>
              <h2 className="mt-5 text-lg font-semibold text-white">You</h2>
              <p className="text-xs text-muted-foreground">{muted ? "Muted" : "Listening…"}</p>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <VoiceWave active={!paused && !muted} key={tick} />
          </div>

          {/* Transcript */}
          <div className="mt-6 flex-1 min-h-[180px]">
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
              <Volume2 className="h-3.5 w-3.5" /> Live transcript
            </div>
            <div ref={scrollRef} className="space-y-3 max-h-[240px] overflow-y-auto pr-2">
              {msgs.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ring-1 ring-white/10 ${
                      m.role === "ai" ? "bg-aurora" : "bg-secondary"
                    }`}
                  >
                    {m.role === "ai" ? (
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    ) : (
                      <User className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "ai"
                        ? "bg-secondary/60 border border-white/5 text-white"
                        : "bg-aurora/15 border border-primary/30 text-white"
                    }`}
                  >
                    <p>{m.text}</p>
                    <span className="text-[10px] text-muted-foreground mt-1 block">{m.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => setMuted((m) => !m)}
              className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                muted
                  ? "bg-destructive-100/20 text-destructive-100 ring-1 ring-destructive-100/40"
                  : "glass hover:ring-glow text-white"
              }`}
            >
              {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <button
              onClick={sendDemo}
              className="px-5 h-12 rounded-full bg-aurora text-primary-foreground font-medium shadow-[var(--shadow-glow)] hover:scale-[1.02] transition-transform"
            >
              Speak (demo)
            </button>
            <button
              onClick={() => setPaused((p) => !p)}
              className="h-12 w-12 rounded-full glass hover:ring-glow flex items-center justify-center text-white"
            >
              {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </button>
            <Link
              href="/feedback"
              className="h-12 w-12 rounded-full bg-destructive-100/20 text-destructive-100 ring-1 ring-destructive-100/40 flex items-center justify-center hover:bg-destructive-100/30 transition"
            >
              <PhoneOff className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="p-5 rounded-2xl glass">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Question 2 of 6</h3>
              <span className="text-xs text-muted-foreground">Medium</span>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full w-1/3 bg-aurora rounded-full" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Real-time collaborative editor — focus on architecture, sync model and conflict resolution.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass">
            <h3 className="font-semibold mb-3 text-white">Live signals</h3>
            {[
              { label: "Clarity", v: 82 },
              { label: "Structure", v: 74 },
              { label: "Depth", v: 68 },
              { label: "Pace", v: 91 },
            ].map((s) => (
              <div key={s.label} className="mb-3 last:mb-0">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{s.label}</span>
                  <span className="text-foreground">{s.v}</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-aurora rounded-full" style={{ width: `${s.v}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-2xl glass">
            <h3 className="font-semibold text-white">Hints</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>· Mention CRDT vs OT trade-offs</li>
              <li>· Cover presence & cursors</li>
              <li>· Discuss offline reconciliation</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Interview;

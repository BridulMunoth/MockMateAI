"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mic, MicOff, PhoneOff, Bot, User, Phone } from "lucide-react";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getInterviewById } from "@/lib/actions/interview.action";
import { verifyAssistant } from "@/lib/actions/vapi.action";
import { vapi } from "@/lib/vapi.sdk";
import CompanyLogo from "@/components/CompanyLogo";

type Msg = { role: "ai" | "user"; text: string; time: string };

const initialMsgs: Msg[] = [];

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

const InterviewContent = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const secondsRef = useRef(0);
  const [msgs, setMsgs] = useState<Msg[]>(initialMsgs);
  const [tick, setTick] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [interviewData, setInterviewData] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Vapi specific state
  const [callStatus, setCallStatus] = useState<'INACTIVE'|'CONNECTING'|'ACTIVE'|'FINISHED'>('INACTIVE');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [vapiError, setVapiError] = useState<string | null>(null);
  const [partialMsg, setPartialMsg] = useState<Msg | null>(null);

  // ── Session tracking ──────────────────────────────────────────────────────
  // 'limit' = free-tier cut-off (friendly), 'error' = real failure, null = normal end
  const [callEndReason, setCallEndReason]   = useState<'limit' | 'error' | 'normal' | null>(null);
  const [questionCount, setQuestionCount]   = useState(0);
  const startedAtRef   = useRef<Date | null>(null);
  const endedAtRef     = useRef<Date | null>(null);
  const questionCountRef = useRef(0);
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);

  useEffect(() => {
    getCurrentUser().then((u) => setUser(u));
  }, []);

  useEffect(() => {
    if (id) {
      getInterviewById(id).then((data) => {
        if (data) {
          setInterviewData(data);
        }
      });
    }

    // Verify Vapi Assistant configuration on the server using the private API Key
    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    if (assistantId) {
      verifyAssistant(assistantId).then((res) => {
        if (!res.success) {
          console.error("Vapi Configuration Error:", res.message);
          setVapiError(`Vapi Setup Error: ${res.message}`);
        } else {
          console.log(`Vapi Assistant Verified: ${res.name} (${res.model})`);
        }
      });
    }
  }, [id]);

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus('ACTIVE');
      setPaused(false);
      startedAtRef.current = new Date();
      setCallEndReason(null);
      questionCountRef.current = 0;
      setQuestionCount(0);
    };

    const onCallEnd = () => {
      endedAtRef.current = new Date();
      setCallStatus('FINISHED');
      setPaused(true);

      // Determine if this ended because the free tier limit was hit
      const isFreeData = interviewData && !interviewData.isPremium;
      const freeDurationCap = 15 * 60; // 15 min in seconds
      const freeQuestionCap = 5;
      const hitTimeLimit = secondsRef.current >= freeDurationCap - 10; // within 10s of cap
      const hitQuestionLimit = questionCountRef.current >= freeQuestionCap;

      if (isFreeData && (hitTimeLimit || hitQuestionLimit)) {
        setCallEndReason('limit');
      } else {
        setCallEndReason('normal');
      }

      // Save session stats to the interview document
      if (id && id !== 'unknown') {
        fetch('/api/vapi/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interviewId: id,
            startedAt: startedAtRef.current?.toISOString(),
            endedAt: endedAtRef.current?.toISOString(),
            durationSeconds: secondsRef.current,
            questionsCovered: questionCountRef.current,
          }),
        }).catch(console.error);
      }
    };

    const onMessage = (message: any) => {
      if (message.type !== 'transcript') return;
      const role: 'ai' | 'user' = message.role === 'assistant' ? 'ai' : 'user';
      const text: string = message.transcript;

      // Count AI questions (heuristic: ends with '?' or is a final AI message)
      if (role === 'ai' && message.transcriptType === 'final' && text.includes('?')) {
        questionCountRef.current += 1;
        setQuestionCount(questionCountRef.current);
      }

      if (message.transcriptType === 'partial') {
        setPartialMsg({ role, text, time: formatTime(secondsRef.current) });
      } else if (message.transcriptType === 'final') {
        setPartialMsg(null);
        setMsgs(prev => [...prev, { role, text, time: formatTime(secondsRef.current) }]);
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd   = () => setIsSpeaking(false);

    const onError = (error: any) => {
      // Vapi wraps the actual error inside error.error (daily-error envelope)
      // Shape: { type: 'daily-error', error: { type: 'ejected', msg: 'Meeting has ended' } }
      const inner = error?.error ?? error?.message ?? error;
      const isNaturalEnd =
        inner?.type === 'ejected' ||
        inner?.msg  === 'Meeting has ended' ||
        error?.type === 'ejected' ||
        error?.errorMsg === 'Meeting has ended';

      if (isNaturalEnd) {
        // This is NOT an error — Vapi naturally ends the call this way.
        // Silently treat as call-end (the call-end event may fire too, that's fine).
        endedAtRef.current = new Date();
        setCallStatus('FINISHED');
        setPaused(true);

        const isFreeData = interviewData && !interviewData.isPremium;
        const hitTimeLimit    = secondsRef.current >= 15 * 60 - 10;
        const hitQuestionLimit = questionCountRef.current >= 5;
        setCallEndReason((isFreeData && (hitTimeLimit || hitQuestionLimit)) ? 'limit' : 'normal');
      } else {
        // Genuine technical error — log it and show the red error UI
        console.error('[MockMate] Vapi error:', inner?.msg || error?.errorMsg || error);
        setVapiError(inner?.msg || error?.errorMsg || 'Connection error. Please try again.');
        setCallEndReason('error');
        setCallStatus('INACTIVE');
        setPaused(true);
      }
    };

    vapi.on('call-start', onCallStart);
    vapi.on('call-end', onCallEnd);
    vapi.on('message', onMessage);
    vapi.on('speech-start', onSpeechStart);
    vapi.on('speech-end', onSpeechEnd);
    vapi.on('error', onError);

    return () => {
      vapi.off('call-start', onCallStart);
      vapi.off('call-end', onCallEnd);
      vapi.off('message', onMessage);
      vapi.off('speech-start', onSpeechStart);
      vapi.off('speech-end', onSpeechEnd);
      vapi.off('error', onError);
    };
  }, [id, interviewData]);

  useEffect(() => {
    if (paused || callStatus !== 'ACTIVE') return;
    const id = setInterval(() => {
      setSeconds((s) => s + 1);
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [paused, callStatus]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const toggleCall = async () => {
    if (callStatus === 'INACTIVE' || callStatus === 'FINISHED') {
      setCallStatus('CONNECTING');
      setMsgs([]);
      setSeconds(0);
      setVapiError(null);
      
      try {
        const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
        
        if (!assistantId) {
          throw new Error("NEXT_PUBLIC_VAPI_ASSISTANT_ID is missing from your environment variables.");
        }

        console.log("Starting Vapi call with Assistant ID:", assistantId);

        await vapi.start(assistantId, {
            variableValues: {
                username: user?.name?.split(' ')[0] || "there",
                userid: user?.uid || user?.id || "anonymous",
                interviewId: id || "unknown",
                companyName: interviewData?.companyName || "the company",
                role: interviewData?.role || "Software Engineer",
                level: interviewData?.level || "mid-level",
                techstack: interviewData?.techstack?.join(', ') || "general technologies",
                interviewType: interviewData?.type?.join(', ') || "technical",
                questionCount: interviewData?.questionCount || 5,
                resumeText: interviewData?.resumeText || "No resume provided.",
                jobDescription: interviewData?.jdText || "No JD provided.",
            }
        });
      } catch (e: any) {
        console.error("Failed to start Vapi call", e);
        setVapiError(e.message || "Failed to start the interview.");
        setCallStatus('INACTIVE');
      }
    } else {
      vapi.stop();
      setCallStatus('FINISHED');
    }
  };

  const handleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    vapi.setMuted(newMuted);
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-8 space-y-6">
      {/* Interview header — cover, role, tech stack, type */}
      <div className="rounded-3xl glass-strong p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-700 ring-1 ring-white/10 flex items-center justify-center text-2xl shadow-[var(--shadow-soft)] overflow-hidden">
            {interviewData?.companyName ? (
              <CompanyLogo
                name={interviewData.companyName}
                fallback={interviewData.companyName.substring(0, 2).toUpperCase()}
              />
            ) : (
              <span>🪐</span>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-aurora">Live session</p>
            <h1 className="text-2xl md:text-3xl font-semibold capitalize mt-1 text-white">
              {interviewData?.role || "Frontend"} Engineer Interview
            </h1>
            <div className="mt-3 flex -space-x-2">
              {(interviewData?.techstack || techstack).map((t: string, index: number) => {
                let iconSlug = t.toLowerCase().replace(/\.js$/, "").replace(/\s+/g, "");
                if (iconSlug === "next") iconSlug = "nextdotjs";
                if (iconSlug === "reactjs") iconSlug = "react";
                
                return (
                  <div
                    key={index}
                    title={t}
                    className="relative group/tech z-10 hover:z-20 h-6 w-6 flex items-center justify-center transition-all duration-200 hover:scale-110"
                  >
                    <img 
                      src={`https://cdn.simpleicons.org/${iconSlug}`} 
                      alt={t} 
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = `<span class="text-[10px] font-bold text-white bg-secondary px-1.5 py-0.5 rounded-full">${t.substring(0, 1)}</span>`;
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full bg-secondary/70 border border-white/5 text-xs text-muted-foreground capitalize">
            {Array.isArray(interviewData?.type)
              ? interviewData.type[0]
              : interviewData?.type || "Interview"}
          </span>
          {callStatus === 'ACTIVE' && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-white">
              <span className="h-2 w-2 rounded-full bg-success-100 animate-pulse-glow" />
              Recording · {formatTime(seconds)}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Stage */}
        <div className="rounded-3xl glass-strong p-5 md:p-10 relative overflow-hidden min-h-[440px] md:min-h-[560px] flex flex-col">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-aurora opacity-30 blur-3xl" />

          <div className="relative grid sm:grid-cols-2 gap-6 items-center">
            {/* Interviewer */}
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className={`absolute inset-0 rounded-full bg-aurora opacity-40 blur-2xl ${callStatus === 'ACTIVE' && "animate-pulse-glow"}`} />
                <div className="relative h-28 w-28 rounded-full overflow-hidden ring-2 ring-aurora/50 shadow-[var(--shadow-glow)] animate-float">
                  <Image
                    src="/AI_Logo.png"
                    alt="AI MockMate"
                    fill
                    sizes="112px"
                    priority
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
                    <img src={user.photoURL} alt="Your Avatar" className="h-full w-full object-cover" />
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
            <VoiceWave active={isSpeaking} key={tick} />
          </div>

          {/* Transcript / Status State */}
          <div className="mt-6 flex-1 min-h-[120px] flex items-center justify-center">

            {/* ── Free Limit Hit ── */}
            {callEndReason === 'limit' && (
              <div className="text-center animate-fadeIn max-w-md w-full px-4">
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 space-y-4">
                  <div className="h-14 w-14 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
                    <span className="text-2xl">⏱️</span>
                  </div>
                  <div>
                    <p className="text-amber-400 font-semibold text-lg">Free Session Ended</p>
                    <p className="text-sm text-white/70 mt-1">
                      Your free interview limit has been reached. Upgrade to Pro or Elite for unlimited sessions.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-4 text-xs text-white/60 border-t border-white/10 pt-4">
                    <span>⏳ {formatTime(seconds)} covered</span>
                    {questionCount > 0 && <span>❓ {questionCount} questions asked</span>}
                  </div>
                  <a href="/pricing" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-all shadow-[0_0_20px_rgba(217,119,6,0.3)]">
                    Upgrade to Continue →
                  </a>
                </div>
              </div>
            )}

            {/* ── Normal End ── */}
            {callEndReason === 'normal' && (
              <div className="text-center animate-fadeIn max-w-md w-full px-4">
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 space-y-4">
                  <div className="h-14 w-14 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-2xl">🎉</span>
                  </div>
                  <div>
                    <p className="text-emerald-400 font-semibold text-lg">Interview Complete!</p>
                    <p className="text-sm text-white/70 mt-1">
                      Great work! Your responses are being analysed. Feedback will appear on your dashboard shortly.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-4 text-xs text-white/60 border-t border-white/10 pt-4">
                    <span>⏳ {formatTime(seconds)}</span>
                    {questionCount > 0 && <span>❓ {questionCount} Qs</span>}
                  </div>
                  <a href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all">
                    Go to Dashboard →
                  </a>
                </div>
              </div>
            )}

            {/* ── Real Error ── */}
            {callEndReason === 'error' && vapiError && (
              <div className="text-center animate-fadeIn max-w-xl p-6 rounded-2xl bg-destructive-100/10 border border-destructive-100/20">
                <p className="text-destructive-100 font-medium">{vapiError}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  If this keeps happening, check your microphone permissions or try refreshing.
                </p>
              </div>
            )}

            {/* ── Live / Idle Transcript ── */}
            {!callEndReason && (
              <div ref={scrollRef} className="w-full flex justify-center px-4">
                {partialMsg ? (
                  <div className="text-center max-w-2xl">
                    <p className={`text-xl md:text-2xl font-medium leading-relaxed tracking-wide opacity-70 ${partialMsg.role === 'ai' ? 'text-white' : 'text-aurora'}`}>
                      &ldquo;{partialMsg.text}&rdquo;
                    </p>
                    <span className="text-xs text-muted-foreground mt-3 block uppercase tracking-widest animate-pulse">
                      {partialMsg.role === 'ai' ? 'MockMate is speaking…' : 'You are speaking…'}
                    </span>
                  </div>
                ) : msgs.length > 0 ? (
                  <div className="text-center animate-fadeIn max-w-2xl">
                    <p className={`text-xl md:text-2xl font-medium leading-relaxed tracking-wide ${msgs[msgs.length - 1].role === 'ai' ? 'text-white' : 'text-aurora'}`}>
                      &ldquo;{msgs[msgs.length - 1].text}&rdquo;
                    </p>
                    <span className="text-xs text-muted-foreground mt-3 block uppercase tracking-widest">
                      {msgs[msgs.length - 1].role === 'ai' ? 'MockMate said' : 'You said'}
                    </span>
                  </div>
                ) : (
                  <div className="text-center animate-fadeIn max-w-2xl">
                    <p className="text-xl md:text-2xl font-medium leading-relaxed tracking-wide text-muted-foreground/50">
                      Waiting for conversation to begin...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            {callStatus === 'INACTIVE' || callStatus === 'FINISHED' ? (
              <button
                onClick={toggleCall}
                className="px-8 h-14 rounded-full font-medium transition-transform flex items-center gap-2 bg-success-100 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:scale-[1.02]"
              >
                <Phone className="h-5 w-5" />
                Connect
              </button>
            ) : (
              <>
                <button
                  onClick={handleMute}
                  className={`h-14 w-14 rounded-full flex items-center justify-center transition-all ${
                    muted
                      ? "bg-destructive-100/20 text-destructive-100 ring-1 ring-destructive-100/40"
                      : "glass hover:ring-glow text-white"
                  }`}
                >
                  {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                <button
                  onClick={toggleCall}
                  className="px-8 h-14 rounded-full font-medium transition-transform flex items-center gap-2 bg-destructive-100 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-[1.02]"
                >
                  <PhoneOff className="h-5 w-5" />
                  {callStatus === 'CONNECTING' ? 'Connecting...' : 'Disconnect'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sidebar — hidden on mobile, visible on lg+ */}
        <aside className="hidden lg:flex flex-col gap-4">
          {callStatus === 'ACTIVE' ? (
            <>
              <div className="p-5 rounded-2xl glass">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Live signals</h3>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    { label: "Clarity", v: 82 },
                    { label: "Structure", v: 74 },
                    { label: "Depth", v: 68 },
                    { label: "Pace", v: 91 },
                  ].map((s) => (
                    <div key={s.label}>
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
              </div>
              
              <div className="p-5 rounded-2xl glass">
                <h3 className="font-semibold text-white">Hints</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>· Speak clearly and take your time</li>
                  <li>· Ask clarifying questions if needed</li>
                  <li>· Think out loud when solving problems</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="p-6 rounded-2xl glass-strong border border-white/5 h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-aurora/10 flex items-center justify-center">
                <Bot className="h-6 w-6 text-aurora" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Ready when you are</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Click the <strong className="text-success-100">Connect</strong> button to begin your interview. Ensure you are in a quiet environment.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default function InterviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-aurora">Loading interview...</div>}>
      <InterviewContent />
    </Suspense>
  );
}

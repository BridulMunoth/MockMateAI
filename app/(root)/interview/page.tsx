"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mic, MicOff, PhoneOff, Bot, User, Phone, Sparkles, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
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
  const msgsRef = useRef<Msg[]>(initialMsgs);
  const [tick, setTick] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [interviewData, setInterviewData] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
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

  // ── Feedback generation states ──
  const [generatingFeedback, setGeneratingFeedback] = useState(false);
  const [generatedFeedbackId, setGeneratedFeedbackId] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const generateFeedback = async (currentMsgs: Msg[]) => {
    if (!currentMsgs || currentMsgs.length === 0) {
      console.log("[MockMate] No messages in conversation, skipping feedback generation.");
      return;
    }

    setGeneratingFeedback(true);
    setFeedbackError(null);

    const transcriptText = currentMsgs
      .map(m => `${m.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${m.text}`)
      .join('\n\n');

    try {
      const res = await fetch('/api/feedback/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: id,
          userId: user?.uid,
          transcript: transcriptText
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate feedback report");
      }

      console.log("[MockMate] Feedback generated successfully:", data.feedbackId);
      setGeneratedFeedbackId(data.feedbackId);
    } catch (err: any) {
      console.error("[MockMate] Feedback generation failed:", err);
      setFeedbackError(err.message || "Something went wrong while generating feedback.");
    } finally {
      setGeneratingFeedback(false);
    }
  };

  const completeInterviewSession = () => {
    // Avoid duplicate executions if already ended
    if (endedAtRef.current) return;
    
    endedAtRef.current = new Date();
    setCallStatus('FINISHED');
    setPaused(true);

    const plan = user?.plan ?? "free";
    const planExpiresAt = user?.planExpiresAt;
    const isUserPremium = (plan !== "free" && !!planExpiresAt && new Date(planExpiresAt) > new Date()) || !!interviewData?.isPremium;
    const isFreeData = !isUserPremium;

    const durationCap = (interviewData?.duration || 15) * 60; 
    const questionCap = (interviewData?.questionCount || 5);
    
    const hitTimeLimit = secondsRef.current >= durationCap - 5; 
    const hitQuestionLimit = questionCountRef.current >= questionCap;

    if (isFreeData && (hitTimeLimit || hitQuestionLimit)) {
      setCallEndReason('limit');
    } else {
      setCallEndReason('normal');
    }

    // Save session stats & trigger feedback
    if (id && id !== 'unknown' && startedAtRef.current && secondsRef.current > 5) {
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

      // Trigger automatic real-time evaluation
      generateFeedback(msgsRef.current);
    }
  };

  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);

  useEffect(() => {
    async function checkAuthAndLoad() {
      try {
        const u = await getCurrentUser();
        setUser(u);
        
        if (id) {
          const data = await getInterviewById(id);
          if (data) {
            setInterviewData(data);
          }
        }
      } catch (err) {
        console.error("Auth and interview load error:", err);
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuthAndLoad();

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
      
      setGeneratingFeedback(false);
      setGeneratedFeedbackId(null);
      setFeedbackError(null);
    };

    const onCallEnd = () => {
      completeInterviewSession();
    };

    const onMessage = (message: any) => {
      if (message.type !== 'transcript') return;
      const role: 'ai' | 'user' = message.role === 'assistant' ? 'ai' : 'user';
      const text: string = message.transcript;

      // Count AI questions (heuristic: ends with '?' or is a final AI message)
      if (role === 'ai' && message.transcriptType === 'final' && text.includes('?')) {
        questionCountRef.current += 1;
        setQuestionCount(questionCountRef.current);

        // Programmatically end the call if free tier limit is reached
        const plan = user?.plan ?? "free";
        const planExpiresAt = user?.planExpiresAt;
        const isUserPremium = (plan !== "free" && !!planExpiresAt && new Date(planExpiresAt) > new Date()) || !!interviewData?.isPremium;
        const isFreeData = !isUserPremium;
        const questionCap = (interviewData?.questionCount || 5);

        if (isFreeData && questionCountRef.current >= questionCap) {
          console.log("[MockMate] Free question limit reached. Ending call.");
          vapi.stop();
          completeInterviewSession();
        }
      }

      if (message.transcriptType === 'partial') {
        setPartialMsg({ role, text, time: formatTime(secondsRef.current) });
      } else if (message.transcriptType === 'final') {
        setPartialMsg(null);
        setMsgs(prev => {
          const next = [...prev, { role, text, time: formatTime(secondsRef.current) }];
          msgsRef.current = next;
          return next;
        });
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd   = () => setIsSpeaking(false);

    const onError = (error: any) => {
      const inner = error?.error ?? error?.message ?? error;
      const isNaturalEnd =
        inner?.type === 'ejected' ||
        inner?.msg  === 'Meeting has ended' ||
        error?.type === 'ejected' ||
        error?.errorMsg === 'Meeting has ended';

      if (isNaturalEnd) {
        completeInterviewSession();
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
  }, [id, interviewData, user]);

  useEffect(() => {
    if (paused || callStatus !== 'ACTIVE') return;
    const id = setInterval(() => {
      const nextSeconds = secondsRef.current + 1;
      setSeconds(nextSeconds);
      setTick((t) => t + 1);

      // Programmatically end the call if free tier time limit is reached
      const plan = user?.plan ?? "free";
      const planExpiresAt = user?.planExpiresAt;
      const isUserPremium = (plan !== "free" && !!planExpiresAt && new Date(planExpiresAt) > new Date()) || !!interviewData?.isPremium;
      const isFreeData = !isUserPremium;
      const durationCap = (interviewData?.duration || 15) * 60;

      if (isFreeData && nextSeconds >= durationCap) {
        console.log("[MockMate] Free duration limit reached. Ending call.");
        vapi.stop();
        completeInterviewSession();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [paused, callStatus, user, interviewData]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const toggleCall = async () => {
    if (callStatus === 'INACTIVE' || callStatus === 'FINISHED') {
      setCallStatus('CONNECTING');
      setMsgs([]);
      msgsRef.current = [];
      setSeconds(0);
      setVapiError(null);
      setGeneratingFeedback(false);
      setGeneratedFeedbackId(null);
      setFeedbackError(null);
      
      try {
        const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
        
        if (!assistantId) {
          throw new Error("NEXT_PUBLIC_VAPI_ASSISTANT_ID is missing from your environment variables.");
        }

        console.log("Starting Vapi call with Assistant ID:", assistantId);

        await vapi.start(assistantId, {
            transcriber: {
                provider: "deepgram",
                model: "nova-2",
                language: "en-US",
                smartFormat: true,
                keywords: [
                    "React", "Next.js", "TypeScript", "JavaScript", "GraphQL", "Tailwind", 
                    "Firebase", "Node.js", "MongoDB", "Express", "Vite", "MockMate", "API",
                    "Redux", "Recoil", "Zustand", "Context API", "CSS", "HTML", "SQL", "NoSQL"
                ]
            },
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
                prepText: interviewData?.prepText || "No prep material provided.",
                prepMaterial: interviewData?.prepText || "No prep material provided.",
            }
        });
      } catch (e: any) {
        console.error("Failed to start Vapi call", e);
        setVapiError(e.message || "Failed to start the interview.");
        setCallStatus('INACTIVE');
      }
    } else {
      vapi.stop();
      completeInterviewSession();
    }
  };

  const handleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    vapi.setMuted(newMuted);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-aurora bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-aurora/30 border-t-aurora rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium animate-pulse">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground bg-background px-4">
        <div className="text-center p-8 glass-strong rounded-3xl max-w-md border border-white/5 shadow-[var(--shadow-soft)]">
          <h2 className="text-2xl font-bold text-white mb-4">Please Sign In</h2>
          <p className="text-sm mb-6 text-white/60 leading-relaxed">You must be logged in to view and participate in this interview.</p>
          <Link href="/sign-in" className="inline-flex items-center justify-center w-full py-3 rounded-full bg-aurora text-white font-semibold shadow-[var(--shadow-glow)] hover:scale-[1.02] transition-transform">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!interviewData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground bg-background px-4">
        <div className="text-center p-8 glass-strong rounded-3xl max-w-md border border-white/5 shadow-[var(--shadow-soft)]">
          <h2 className="text-2xl font-bold text-white mb-4">Interview Not Found</h2>
          <p className="text-sm mb-6 text-white/60 leading-relaxed">This interview does not exist, may have been deleted, or the link is invalid.</p>
          <Link href="/dashboard" className="inline-flex items-center justify-center w-full py-3 rounded-full bg-aurora text-white font-semibold shadow-[var(--shadow-glow)] hover:scale-[1.02] transition-transform">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (interviewData.userId !== user.uid) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center p-8 md:p-12 glass-strong rounded-[32px] max-w-lg border border-red-500/20 relative overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.1)]">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-red-500 opacity-10 blur-3xl" />
          <div className="h-20 w-20 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6">
            <span className="text-3xl text-red-500">🔒</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Access Denied</h2>
          <p className="text-white/60 mb-8 text-sm leading-relaxed">
            This interview session belongs to another account. For security and privacy reasons, you do not have permission to view or participate in this session.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-sm text-white transition-all font-semibold"
            >
              Go to Dashboard
            </Link>
            <Link 
              href="/interview/new" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-red-500 to-orange-500 hover:opacity-90 text-sm text-white transition-all font-semibold shadow-[0_0_20px_rgba(239,68,68,0.3)]"
            >
              Create New Interview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-8 space-y-6">
      {/* Interview header — cover, role, tech stack, type */}
      <div className="rounded-3xl glass-strong p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="h-14 w-14 flex items-center justify-center overflow-hidden">
            {interviewData?.companyName ? (
              <CompanyLogo
                name={interviewData.companyName}
                fallbackNode={<span>{interviewData.companyName.substring(0, 1).toUpperCase()}</span>}
              />
            ) : (
              <span className="text-2xl">🪐</span>
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
                    className="relative group/tech z-10 hover:z-20 h-8 w-8 rounded-full bg-secondary ring-2 ring-card flex items-center justify-center overflow-hidden p-1.5 transition-all duration-200 hover:ring-aurora/60 hover:scale-110 shadow-[var(--shadow-soft)]"
                  >
                    <img 
                      src={`https://cdn.simpleicons.org/${iconSlug}`} 
                      alt={t} 
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = `<span class="text-[10px] font-bold text-white">${t.substring(0, 1)}</span>`;
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
                    <Image 
                      src={user.photoURL} 
                      alt="Your Avatar" 
                      fill 
                      sizes="112px"
                      className="object-cover" 
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-aurora/20 text-aurora text-3xl font-semibold">
                      {user?.name?.charAt(0).toUpperCase() || <User className="h-12 w-12 text-muted-foreground" />}
                    </div>
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

            {/* ── Feedback Generation States ── */}
            {generatingFeedback && (
              <div className="text-center animate-fadeIn max-w-md w-full px-4">
                <div className="rounded-3xl border border-aurora/30 bg-aurora/5 p-8 space-y-6 shadow-[0_0_40px_rgba(139,92,246,0.15)] relative overflow-hidden backdrop-blur-sm">
                  {/* Decorative orbital blur */}
                  <div className="absolute -top-12 -left-12 h-24 w-24 rounded-full bg-aurora/20 blur-2xl animate-pulse" />
                  <div className="absolute -bottom-12 -right-12 h-24 w-24 rounded-full bg-aurora/15 blur-2xl animate-pulse" />

                  <div className="relative h-20 w-20 mx-auto flex items-center justify-center">
                    {/* Ring animation */}
                    <div className="absolute inset-0 rounded-full border-[3px] border-aurora/10 border-t-aurora animate-spin" />
                    <div className="absolute inset-2 rounded-full border-[2px] border-aurora/5 border-b-aurora animate-spin-reverse" style={{ animationDirection: 'reverse' }} />
                    <Sparkles className="h-8 w-8 text-aurora animate-pulse" />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <p className="text-white font-bold text-xl tracking-tight">Analyzing with Gemini AI...</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      We are evaluating your answers, technical depth, and communication skills to generate your rich feedback report.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {generatedFeedbackId && (
              <div className="text-center animate-fadeIn max-w-md w-full px-4">
                <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-8 space-y-6 shadow-[0_0_40px_rgba(16,185,129,0.15)] relative overflow-hidden backdrop-blur-sm">
                  <div className="absolute -top-12 -left-12 h-24 w-24 rounded-full bg-emerald-500/20 blur-2xl" />
                  
                  <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <p className="text-emerald-400 font-extrabold text-2xl tracking-tight">Feedback Ready!</p>
                    <p className="text-sm text-white/70 leading-relaxed">
                      Gemini AI has completed your evaluation. Your custom score and rich report are ready to view.
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-3 relative z-10">
                    <Link
                      href={`/feedback?id=${id}`}
                      className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                    >
                      View Feedback Report
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/dashboard"
                      className="text-xs text-muted-foreground hover:text-white transition-colors"
                    >
                      Back to Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {feedbackError && (
              <div className="text-center animate-fadeIn max-w-md w-full px-4">
                <div className="rounded-3xl border border-destructive-100/30 bg-destructive-100/5 p-8 space-y-6 shadow-[0_0_40px_rgba(239,68,68,0.15)] relative overflow-hidden backdrop-blur-sm">
                  <div className="h-16 w-16 mx-auto rounded-full bg-destructive-100/10 border border-destructive-100/30 flex items-center justify-center text-destructive-100">
                    <AlertCircle className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-destructive-100 font-bold text-xl tracking-tight">Evaluation Failed</p>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {feedbackError}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 relative z-10">
                    <button
                      onClick={() => generateFeedback(msgsRef.current)}
                      className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-full bg-destructive-100 hover:bg-destructive-100/90 text-white text-sm font-bold transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                    >
                      Retry Analysis
                    </button>
                    <Link
                      href="/dashboard"
                      className="text-xs text-muted-foreground hover:text-white transition-colors"
                    >
                      Go to Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ── Free Limit Hit ── */}
            {callEndReason === 'limit' && !generatingFeedback && !generatedFeedbackId && !feedbackError && (
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
                  <div className="flex flex-col gap-3">
                    <a href="/pricing" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-all shadow-[0_0_20px_rgba(217,119,6,0.3)]">
                      Upgrade to Continue →
                    </a>
                    {msgs.length > 0 && (
                      <button 
                        onClick={() => generateFeedback(msgsRef.current)}
                        className="text-xs text-amber-400/80 hover:text-amber-400 font-semibold transition-colors mt-1"
                      >
                        Generate Feedback for partial session anyway →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Normal End ── */}
            {callEndReason === 'normal' && !generatingFeedback && !generatedFeedbackId && !feedbackError && (
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
                  <div className="flex flex-col gap-3">
                    <a href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all">
                      Go to Dashboard →
                    </a>
                    {msgs.length > 0 && (
                      <button 
                        onClick={() => generateFeedback(msgsRef.current)}
                        className="text-xs text-emerald-400/80 hover:text-emerald-400 font-semibold transition-colors mt-1"
                      >
                        Analyze with Gemini manually →
                      </button>
                    )}
                  </div>
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
          {callStatus === 'INACTIVE' && (
            <p className="text-[10px] text-muted-foreground animate-pulse">
              🎧 Tip: Use earphones for the best voice experience
            </p>
          )}
        </div>

        {/* Sidebar — Dynamic Insights */}
        <aside className="hidden lg:flex flex-col gap-4">
          <div className="p-5 rounded-2xl glass border border-white/5">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-aurora" />
              Session Insights
            </h3>
            <div className="mt-4 space-y-5">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Interview Progress</span>
                  <span className="text-foreground">{Math.min(100, Math.round((questionCount / (interviewData?.questionCount || 5)) * 100))}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className="h-full bg-aurora rounded-full transition-all duration-500" 
                    style={{ width: `${(questionCount / (interviewData?.questionCount || 5)) * 100}%` }} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Time</p>
                  <p className="text-sm font-semibold text-white mt-1">{formatTime(seconds)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Questions</p>
                  <p className="text-sm font-semibold text-white mt-1">{questionCount} / {interviewData?.questionCount || 5}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5">
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2 tracking-widest">Speaking Pace</p>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${isSpeaking ? 'bg-success-100 animate-pulse' : 'bg-secondary'}`} />
                  <span className="text-xs text-white/80">{isSpeaking ? 'Analyzing flow...' : 'Awaiting response'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-5 rounded-2xl glass border border-white/5">
            <h3 className="font-semibold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
              <Bot className="h-4 w-4 text-aurora" />
              Smart Tips
            </h3>
            <ul className="mt-4 space-y-3 text-xs text-muted-foreground leading-relaxed">
              <li className="flex gap-2">
                <span className="text-aurora">01</span>
                <span>The system is calibrated for <strong className="text-white">{interviewData?.level || "Internship"}</strong> difficulty.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-aurora">02</span>
                <span>Focus on your <strong className="text-white">{(interviewData?.techstack?.[0] || "Core")}</strong> skills today.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-aurora">03</span>
                <span>Maintain a steady pace — the AI listens for structure and clarity.</span>
              </li>
            </ul>
          </div>
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

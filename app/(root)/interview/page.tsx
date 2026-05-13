"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mic, MicOff, Pause, Play, PhoneOff, Bot, User, Volume2, Phone } from "lucide-react";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getInterviewById } from "@/lib/actions/interview.action";
import { verifyAssistant } from "@/lib/actions/vapi.action";
import { vapi } from "@/lib/vapi.sdk";

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
    };
    const onCallEnd = () => {
      setCallStatus('FINISHED');
      setPaused(true);
    };

    const onMessage = (message: any) => {
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        const newMessage: Msg = { 
          role: message.role === 'assistant' ? 'ai' : 'user', 
          text: message.transcript,
          time: formatTime(secondsRef.current) 
        };
        // Replace previous message so only the active line is shown
        setMsgs([newMessage]);
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);

    const onError = (error: any) => {
      console.error('Vapi Error Event:', error);
      
      // Provide more detailed guidance based on error type
      let errorMsg = error.message || "An unknown error occurred while connecting to the AI.";
      if (error.type === 'ejected' || error.msg === 'Meeting has ended') {
        errorMsg = "The meeting was terminated (Ejected). Please check if your Vapi Assistant ID is correct and you have remaining minutes.";
      }

      setVapiError(errorMsg);
      setCallStatus('INACTIVE');
      setPaused(true);
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
    }
  }, []);

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
              <img 
                src={`https://cdn.simpleicons.org/${interviewData.companyName.toLowerCase().replace(/\s+/g, '')}`} 
                alt={interviewData.companyName}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = `<span class="text-white">${interviewData.companyName.substring(0, 2).toUpperCase()}</span>`;
                }}
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
          <span className="px-3 py-1.5 rounded-full bg-secondary/70 border border-white/5 text-xs text-muted-foreground">
            Technical
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
        <div className="rounded-3xl glass-strong p-6 md:p-10 relative overflow-hidden min-h-[560px] flex flex-col">
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
                    <Image src={user.photoURL} alt="Your Avatar" fill sizes="112px" unoptimized className="object-cover" />
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

          {/* Transcript / Error State */}
          <div className="mt-6 flex-1 min-h-[120px] flex items-center justify-center">
            {vapiError ? (
              <div className="text-center animate-fadeIn max-w-xl p-6 rounded-2xl bg-destructive-100/10 border border-destructive-100/20">
                <p className="text-destructive-100 font-medium">{vapiError}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Check your Vapi dashboard logs or ensure your local webhook is correctly routed.
                </p>
              </div>
            ) : (
              <div ref={scrollRef} className="w-full flex justify-center px-4">
                {msgs.length > 0 ? msgs.map((m, i) => (
                  <div key={i} className="text-center animate-fadeIn max-w-2xl">
                    <p className={`text-xl md:text-2xl font-medium leading-relaxed tracking-wide ${m.role === 'ai' ? 'text-white' : 'text-aurora'}`}>
                      "{m.text}"
                    </p>
                    <span className="text-xs text-muted-foreground mt-3 block uppercase tracking-widest">
                      {m.role === 'ai' ? 'MockMate is speaking' : 'You are speaking'}
                    </span>
                  </div>
                )) : (
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

        {/* Sidebar */}
        <aside className="space-y-4">
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

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";
import { db } from "@/firebase/client";
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
  MessageSquare,
  ChevronDown,
  ChevronUp
} from "lucide-react";

const formatDuration = (startIso?: string, endIso?: string) => {
  if (!startIso || !endIso) return "32m"; // fallback
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  const mins = Math.max(1, Math.floor(ms / 60000));
  return `${mins}m`;
};

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

const FeedbackContent = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [interview, setInterview] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const docSnap = await getDoc(doc(db, "interviews", id));
        if (docSnap.exists()) {
          setInterview(docSnap.data());
        }

        const q = query(
          collection(db, "feedbacks"), 
          where("interviewId", "==", id),
        );
        const fbSnap = await getDocs(q);
        const fbList = fbSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Client side sort since we might not have a composite index ready
        fbList.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setFeedbacks(fbList);
        if (fbList.length > 0) {
          setOpenAccordionId(fbList[0].id); // Open latest by default
        }
      } catch (e) {
        console.error("Failed to load feedback", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-aurora">Loading feedback...</div>;
  }

  if (!interview) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Interview not found.</div>;
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto pt-2">
        <p className="text-xs uppercase tracking-widest text-aurora">Session report</p>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mt-2">
          Feedback History —{" "}
          <span className="text-aurora capitalize">{interview.role || "Frontend"} Engineer</span>
        </h1>
        <p className="text-muted-foreground mt-4">
          You have taken this interview <strong className="text-white">{feedbacks.length}</strong> times.
        </p>
      </div>

      <div className="mt-12 space-y-4">
        {feedbacks.length === 0 ? (
          <div className="p-12 text-center rounded-3xl glass text-muted-foreground">
            No feedback found for this interview yet.
          </div>
        ) : (
          feedbacks.map((fb, index) => {
            const attemptNumber = feedbacks.length - index;
            const isOpen = openAccordionId === fb.id;
            const createdDate = fb.createdAt ? new Date(fb.createdAt).toLocaleString() : "Unknown date";
            const score = fb.score || 0;
            const summaryText = fb.summary || "No summary provided.";

            return (
              <div key={fb.id} className="rounded-3xl glass-strong border border-white/5 overflow-hidden transition-all duration-300">
                {/* Accordion Header */}
                <button 
                  onClick={() => setOpenAccordionId(isOpen ? null : fb.id)}
                  className="w-full p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-aurora/20 flex items-center justify-center text-aurora font-bold shrink-0">
                      #{attemptNumber}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Feedback {attemptNumber}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> {createdDate}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                      <Star className={`h-4 w-4 ${score >= 75 ? 'fill-emerald-400 text-emerald-400' : 'fill-aurora text-aurora'}`} />
                      <span className="font-semibold text-white">{score}</span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                    {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                  </div>
                </button>

                {/* Accordion Body */}
                {isOpen && (
                  <div className="p-6 md:p-8 border-t border-white/5 bg-background/50 animate-fadeIn">
                    <div className="grid lg:grid-cols-[240px_1fr] gap-8">
                      <div className="flex flex-col items-center">
                        <Ring value={score} />
                        <div className="mt-6 flex flex-col gap-2 w-full">
                          <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl glass hover:ring-glow transition text-sm text-white">
                            <Share2 className="h-4 w-4" /> Share
                          </button>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <div className="inline-flex items-center gap-2 text-xs text-aurora mb-2">
                            <Sparkles className="h-3.5 w-3.5" /> Assessment
                          </div>
                          <h2 className="text-xl font-semibold text-white">The bottom line</h2>
                          <p className="mt-3 text-muted-foreground leading-relaxed whitespace-pre-wrap">{summaryText}</p>
                        </div>

                        {fb.transcript && (
                          <div className="pt-6 border-t border-white/5">
                            <div className="flex items-center gap-2 mb-3">
                              <MessageSquare className="h-4 w-4 text-aurora" />
                              <h3 className="font-semibold text-white">Transcript</h3>
                            </div>
                            <div className="p-4 rounded-xl bg-secondary/30 border border-white/5 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                              {fb.transcript}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="flex justify-center mt-12">
        <Link
          href={`/interview/new?id=${id}`}
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-aurora text-primary-foreground font-semibold shadow-[var(--shadow-glow)] hover:scale-[1.02] transition-transform"
        >
          Take Interview Again <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};
export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-aurora">Loading...</div>}>
      <FeedbackContent />
    </Suspense>
  );
}

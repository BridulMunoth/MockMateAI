import { getCurrentUser, getInterviewsByUserId } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import InterviewCard from "@/components/InterviewCard";
import InterviewCarousel from "@/components/InterviewCarousel";
import DashboardRefreshTrigger from "@/components/DashboardRefreshTrigger";
import { availableInterviews } from "@/constants/interviews";

export default async function DashboardRoot() {
    const [user, userInterviews] = await Promise.all([
        getCurrentUser(),
        getCurrentUser().then((u) => u ? getInterviewsByUserId(u.uid) : []),
    ]);

    if (!user) redirect('/sign-in');

    return (
        <main className="container mx-auto py-10 px-4 md:px-8 space-y-12 animate-fade-in-up">
            <DashboardRefreshTrigger />



            {/* ── Hero CTA Card ── */}
            <section className="relative rounded-3xl overflow-hidden border border-white/8 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_32px_64px_rgba(0,0,0,0.5)]"
                style={{ background: "linear-gradient(135deg, hsl(250 30% 8%) 0%, hsl(260 25% 11%) 50%, hsl(240 30% 9%) 100%)" }}
            >
                {/* Ambient glow blobs */}
                <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-violet-600/25 blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-24 right-8 h-72 w-72 rounded-full bg-indigo-500/20 blur-[80px] pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="relative grid md:grid-cols-[1fr_auto] gap-6 p-8 md:p-12 items-center">
                    <div className="max-w-lg space-y-6">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-aurora/30 bg-aurora/10 text-xs font-medium text-aurora/90 backdrop-blur-sm">
                            <Sparkles className="h-3 w-3" />
                            AI-powered interview practice
                        </div>

                        {/* Headline */}
                        <div className="space-y-1">
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.08]">
                                Get interview-ready with
                            </h1>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.08] bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
                                AI practice &amp; feedback
                            </h1>
                        </div>

                        {/* Sub */}
                        <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
                            Practice real interview questions with a voice-first AI coach and get
                            instant, forensic feedback on every answer.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-wrap gap-3 pt-1">
                            <Link
                                href="/interview/new"
                                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full font-semibold text-sm text-white shadow-[0_0_20px_rgba(139,92,246,0.45),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] active:scale-[0.98]"
                                style={{ background: "linear-gradient(135deg, hsl(263 70% 55%), hsl(245 75% 60%))" }}
                            >
                                <Zap className="h-4 w-4" />
                                Start an Interview
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Robot image */}
                    <div className="hidden md:flex items-end justify-end self-end">
                        <Image
                            src="/robot.png"
                            alt="MockMate AI robot"
                            width={380}
                            height={380}
                            priority
                            className="w-[300px] xl:w-[340px] drop-shadow-[0_20px_50px_hsl(258_90%_55%/0.45)] animate-float"
                        />
                    </div>
                </div>
            </section>

            {/* ── Your Interviews ── */}
            <section className="space-y-4">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] text-aurora font-semibold">Continue</p>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-1 text-white">Your Interviews</h2>
                </div>

                {!userInterviews.length ? (
                    <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-12 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="w-20 h-20 rounded-full bg-secondary/50 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                            <span className="text-4xl">🚀</span>
                        </div>
                        <div className="space-y-2 max-w-sm">
                            <h3 className="text-xl font-semibold text-white">No interviews yet</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                You haven&apos;t taken any mock interviews. Ready to practice and level up your skills?
                            </p>
                        </div>
                        <Link
                            href="/interview/new"
                            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-aurora text-primary-foreground font-medium shadow-[var(--shadow-glow)] hover:scale-[1.02] transition-transform relative z-10"
                        >
                            Start Your First Interview
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                ) : (
                    // ✅ InterviewCarousel replaces the raw scrollable div + native scrollbar
                    // with a smooth carousel + dot indicators
                    <InterviewCarousel>
                        {(userInterviews as any[]).map((i) => (
                            <InterviewCard key={i.id} interview={i} />
                        ))}
                    </InterviewCarousel>
                )}
            </section>

            {/* ── Take Interviews ── */}
            <section className="space-y-5">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] text-aurora font-semibold">Available</p>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-1 text-white">Take Interviews</h2>
                </div>

                {availableInterviews.length ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {availableInterviews.map((i) => (
                            <InterviewCard key={i.id} interview={i} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-10 text-center text-muted-foreground">
                        There are no interviews available
                    </div>
                )}
            </section>
        </main>
    );
}

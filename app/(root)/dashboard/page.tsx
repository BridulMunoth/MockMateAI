import { getCurrentUser, getInterviewsByUserId } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { ArrowRight, Sparkles, Loader2 } from "lucide-react";
import InterviewCard from "@/components/InterviewCard";
import { availableInterviews } from "@/constants/interviews";
import { Suspense } from "react";

// Server component to fetch and render user interviews
async function UserInterviewsList({ userId }: { userId: string }) {
    const userInterviews = await getInterviewsByUserId(userId);

    if (!userInterviews.length) {
        return (
            <div className="rounded-3xl glass-strong border border-white/5 p-12 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-20 h-20 rounded-full bg-secondary/50 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.2)] animate-glow-float">
                    <span className="text-4xl">🚀</span>
                </div>
                <div className="space-y-2 max-w-sm">
                    <h3 className="text-xl font-semibold text-white">No interviews yet</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        You haven't taken any mock interviews. Ready to practice and level up your skills?
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
        );
    }

    return (
        <div className="space-y-4">
            {userInterviews.length > 3 && (
                <div className="flex justify-end px-2">
                    <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors">
                        View all <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            )}
            {/* Horizontally scrollable tray */}
            <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {userInterviews.map((i) => (
                    <div key={i.id} className="min-w-[320px] max-w-[380px] flex-shrink-0 snap-start">
                        <InterviewCard interview={i} />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default async function DashboardRoot() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/sign-in');
    }

    return (
        <main className="container mx-auto py-10 px-4 md:px-8 space-y-12 animate-fade-in-up">
            
            {/* Minimal User Profile Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary shadow-[0_0_15px_rgba(139,92,246,0.3)] bg-secondary">
                        {user.photoURL ? (
                            <Image src={user.photoURL} alt="Avatar" width={48} height={48} unoptimized className="object-cover" />
                        ) : (
                            <div className="w-full h-full bg-violet-900/50 flex items-center justify-center text-xl">🤖</div>
                        )}
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Welcome back,</p>
                        <h2 className="font-bold text-lg text-white">{user.name}</h2>
                    </div>
                </div>
                <LogoutButton />
            </div>

            {/* Friend's CTA card */}
            <section className="relative rounded-3xl glass-strong overflow-hidden">
                <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-primary/40 blur-3xl" />
                <div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
                <div className="relative grid md:grid-cols-[1fr_360px] gap-8 p-8 md:p-12 items-center">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-5">
                            <Sparkles className="h-3.5 w-3.5 text-accent" />
                            AI-powered interview practice
                        </div>
                        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
                            Get interview-ready with
                            <br />
                            <span className="text-aurora">AI practice & feedback</span>
                        </h1>
                        <p className="mt-5 text-muted-foreground text-lg">
                            Practice real interview questions with a voice-first AI coach and get
                            instant, forensic feedback on every answer.
                        </p>
                        <div className="mt-7 flex flex-col sm:flex-row gap-3">
                            <Link
                                href="/interview/new"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-aurora text-primary-foreground font-medium shadow-[var(--shadow-glow)] hover:scale-[1.02] transition-transform"
                            >
                                Start an Interview
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/feedback"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full glass-strong hover:ring-glow transition-all text-foreground"
                            >
                                See sample feedback
                            </Link>
                        </div>
                    </div>
                    <div className="hidden md:flex justify-end">
                        <Image
                            src="/robot.png"
                            alt="MockMate AI robot"
                            width={400}
                            height={400}
                            priority
                            loading="eager"
                            className="w-[340px] drop-shadow-[0_30px_60px_hsl(258_90%_50%/0.4)] animate-float"
                        />
                    </div>
                </div>
            </section>

            {/* Your Interviews */}
            <section className="space-y-2">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-aurora font-semibold">Continue</p>
                        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
                            Your Interviews
                        </h2>
                    </div>
                </div>

                <Suspense fallback={
                    <div className="h-48 w-full rounded-3xl glass-strong border border-white/5 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="h-8 w-8 text-aurora animate-spin" />
                        <p className="text-sm text-muted-foreground animate-pulse">Loading your history...</p>
                    </div>
                }>
                    <UserInterviewsList userId={user.uid} />
                </Suspense>
            </section>

            {/* Take Interviews */}
            <section className="space-y-5">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-aurora font-semibold">Available</p>
                        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
                            Take Interviews
                        </h2>
                    </div>
                </div>

                {availableInterviews.length ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {availableInterviews.map((i) => (
                            <InterviewCard key={i.id} interview={i} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-3xl glass p-10 text-center text-muted-foreground">
                        There are no interviews available
                    </div>
                )}
            </section>
        </main>
    );
}

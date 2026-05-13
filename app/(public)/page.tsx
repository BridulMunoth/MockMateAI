import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Mic, Zap, BarChart3 } from "lucide-react";
import { getRecentUsers, isAuthenticated } from "@/lib/actions/auth.action";
import HeroGraphic from "@/components/HeroGraphic";

export default async function LandingPage() {
  const recentUsers = await getRecentUsers(4);
  const isUserAuthenticated = await isAuthenticated();
  // Fallback to defaults only if we don't have enough real users yet
  const displayAvatars = recentUsers.length > 0 
    ? recentUsers 
    : ['/avatars/dog.png', '/avatars/panda.png', '/avatars/robot.png', '/avatars/batman.png'];
  return (
    <main className="flex flex-col min-h-screen overflow-hidden bg-[#030014]">
      {/* Premium Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 md:pt-32 md:pb-40 px-4">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
            
            {/* Hero Text */}
            <div className="flex-1 space-y-8 animate-fade-in-up z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 text-sm text-aurora font-medium">
                <Sparkles className="h-4 w-4" />
                <span>The Future of Interview Prep</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter leading-[1.05]">
                Master your next interview with <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-500 to-pink-500 animate-pulse-glow drop-shadow-sm">AI precision</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
                MockMateAI uses advanced conversational AI to simulate real interviews, providing instant, forensic feedback to help you land your dream job faster.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href={isUserAuthenticated ? "/dashboard" : "/sign-up"}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-aurora text-primary-foreground font-semibold text-lg shadow-[0_0_40px_rgba(139,92,246,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] hover:scale-[1.02] transition-all"
                >
                  {isUserAuthenticated ? "Go to Dashboard" : "Get Started for Free"}
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full glass-strong hover:bg-white/10 transition-colors text-white font-medium text-lg border border-white/10"
                >
                  See how it works
                </Link>
              </div>
              
              <div className="pt-8 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex -space-x-3">
                  {/* Decorative/Real avatars */}
                  {displayAvatars.map((url, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center overflow-hidden">
                      <Image src={url} alt={`User ${i + 1}`} width={40} height={40} className="object-cover w-full h-full" />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 text-yellow-400">
                    {[1, 2, 3, 4, 5].map((i) => <Sparkles key={i} className="h-3 w-3 fill-current" />)}
                  </div>
                  <span>Trusted by 10,000+ job seekers</span>
                </div>
              </div>
            </div>
            
            {/* Hero 3D Graphic */}
            <HeroGraphic />
            
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative bg-black/40 border-y border-white/5">
        <div className="container mx-auto max-w-6xl px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
              Everything you need to <span className="text-aurora">succeed</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Our platform provides a comprehensive suite of tools designed to simulate real-world interviews and provide actionable insights.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="glass-strong p-8 rounded-3xl border border-white/10 hover:border-violet-500/50 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-[50px] group-hover:bg-violet-500/20 transition-colors" />
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-6 border border-violet-500/20">
                <Mic className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Voice-First Experience</h3>
              <p className="text-muted-foreground leading-relaxed">
                Practice exactly how you would in a real interview. Speak your answers naturally and our AI will transcribe and analyze your responses in real-time.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="glass-strong p-8 rounded-3xl border border-white/10 hover:border-fuchsia-500/50 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-[50px] group-hover:bg-fuchsia-500/20 transition-colors" />
              <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 mb-6 border border-fuchsia-500/20">
                <BarChart3 className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Forensic Feedback</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get instant, detailed feedback on your answers. We analyze your tone, clarity, and the technical depth of your responses to help you improve.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="glass-strong p-8 rounded-3xl border border-white/10 hover:border-emerald-500/50 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px] group-hover:bg-emerald-500/20 transition-colors" />
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20">
                <Zap className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Industry Questions</h3>
              <p className="text-muted-foreground leading-relaxed">
                Tackle questions tailored to your specific role and industry. Our AI generates dynamic follow-up questions based on your unique answers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-[#030014] via-aurora/5 to-transparent" />
        <div className="container mx-auto max-w-4xl px-4 relative z-10 text-center space-y-8">
          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white drop-shadow-lg">
            Ready to ace your next interview?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of job seekers who have already leveled up their interview skills with MockMateAI.
          </p>
          <div className="pt-4 flex justify-center">
            <Link
              href={isUserAuthenticated ? "/dashboard" : "/sign-up"}
              className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-full bg-white text-black font-bold text-lg hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all"
            >
              {isUserAuthenticated ? "Go to Dashboard" : "Start Practicing Now"}
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 border-t border-white/5 text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} MockMateAI. All rights reserved.</p>
      </footer>
    </main>
  );
}

import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";
import Image from "next/image";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardRoot() {
    // ==========================================
    // 1. INVISIBLE SECURE ROUTE FETCHING
    // ==========================================
    // This entire query executes 100% natively on the Next.js Server. 
    // The browser never experiences any "Loading..." state while fetching the User Record!
    const user = await getCurrentUser();

    // 2. Absolute Edge Case Guard - If a zombie session sneaks past Middleware without a valid database record:
    if (!user) {
        redirect('/sign-in');
    }

    return (
        <main className="min-h-screen relative flex items-center justify-center p-4 sm:p-8 overflow-hidden overflow-y-auto">
            {/* Background Aesthetics */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[500px] bg-violet-600/20 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="z-10 w-full max-w-4xl glass-container p-8 sm:p-12 border-white/5 animate-fade-in-up">
                
                {/* --------------------- HEADER --------------------- */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 mb-12 border-b border-white/10 pb-8">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        
                        {/* Dynamic Server-Side Avatar Loading */}
                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.3)] bg-[#121319]">
                            {user.photoURL ? (
                                <Image src={user.photoURL} alt="Avatar" width={128} height={128} className="object-cover bg-white/5" />
                            ) : (
                                <div className="w-full h-full bg-violet-900/50 flex items-center justify-center text-4xl">🤖</div>
                            )}
                        </div>
                        
                        <div className="text-center sm:text-left space-y-2">
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                                Welcome back,<br />
                                <span className="text-gradient-shimmer">{user.name}</span>
                            </h1>
                            <p className="text-gray-400 font-medium tracking-wide">Logged in as {user.email}</p>
                        </div>
                    </div>
                    
                    {/* The Secure Logout Flow Client Component */}
                    <LogoutButton />
                </div>

                {/* --------------------- CONTENT --------------------- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors cursor-pointer group">
                        <div className="w-12 h-12 bg-violet-600/20 rounded-xl flex items-center justify-center text-violet-400 mb-6 group-hover:bg-violet-600 group-hover:text-white transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Practice Interview</h3>
                        <p className="text-gray-400 text-[15px] mb-6">Start a new highly-realistic Mock AI session and boost your hiring chances with instant feedback.</p>
                        <button className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)]">Start New Session</button>
                    </div>
                    
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors cursor-pointer group">
                        <div className="w-12 h-12 bg-pink-600/20 rounded-xl flex items-center justify-center text-pink-400 mb-6 group-hover:bg-pink-600 group-hover:text-white transition-all">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">My Resumes</h3>
                        <p className="text-gray-400 text-[15px] mb-6">Access, edit, or download the brilliant professional resumes you built with our AI generator.</p>
                        <button className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/20 font-bold tracking-wide transition-all text-gray-200">View Saved Resumes</button>
                    </div>
                </div>

            </div>
        </main>
    );
}

import React from "react";
import { Upload, MessageSquareText } from "lucide-react";
import Link from "next/link";

const SignUp = () => {
  return (
    <div className="w-full max-w-[480px] bg-[#161618] rounded-2xl p-8 border border-zinc-800/50 shadow-xl">
      {/* Brand area */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquareText className="w-6 h-6 text-[#c2b8fe]" />
          <span className="font-bold text-xl tracking-wide">PrepWise</span>
        </div>
        <h1 className="text-2xl font-semibold text-white">
          Practice job interviews with AI
        </h1>
      </div>

      <form className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-400">Full name</label>
          <input
            type="text"
            placeholder="Adrian Hajdin"
            className="w-full bg-[#27272a]/50 text-white placeholder:text-zinc-500 rounded-full px-4 py-3 border border-transparent focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-400">Email</label>
          <input
            type="email"
            placeholder="adrian@jsmastery.pro"
            className="w-full bg-[#27272a]/50 text-white placeholder:text-zinc-500 rounded-full px-4 py-3 border border-transparent focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-400">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            className="w-full bg-[#27272a]/50 text-white placeholder:text-zinc-500 rounded-full px-4 py-3 border border-transparent focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-400">Profile picture</label>
          <button
            type="button"
            className="w-full bg-[#27272a]/50 hover:bg-[#27272a] text-zinc-300 rounded-full px-4 py-3 flex items-center justify-center gap-2 border border-transparent transition"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm">Upload an image</span>
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-400">Resume</label>
          <button
            type="button"
            className="w-full bg-[#27272a]/50 hover:bg-[#27272a] text-zinc-300 rounded-full px-4 py-3 flex items-center justify-center gap-2 border border-transparent transition mb-4"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm">Upload a pdf</span>
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-[#c2b8fe] hover:bg-[#a89cf6] text-black font-semibold rounded-full px-4 py-3 transition mt-6"
        >
          Create an account
        </button>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-zinc-700/50"></div>
          <span className="flex-shrink-0 mx-4 text-zinc-500 text-sm">or</span>
          <div className="flex-grow border-t border-zinc-700/50"></div>
        </div>

        <button
          type="button"
          className="w-full bg-[#27272a]/50 hover:bg-[#27272a] text-white font-medium rounded-full px-4 py-3 flex items-center justify-center gap-3 border border-transparent transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-zinc-400 text-sm pt-2">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-[#c2b8fe] hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default SignUp;

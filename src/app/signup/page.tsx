"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, Lock, User as UserIcon, ArrowRight, Sparkles, AlertCircle, Inbox } from "lucide-react";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password, name);

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during Google Sign-In.");
    }
  };

  // If loading authentication state, show a clean, elegant loading indicator
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f1eb]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-slate-900/10" />
            <div className="absolute inset-0 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
          </div>
          <p className="text-slate-500 text-sm font-medium animate-pulse">
            Connecting to your space...
          </p>
        </div>
      </div>
    );
  }

  // Styled email verification pending screen
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f1eb] relative overflow-hidden px-4">
        {/* Background Ambient Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[10%] right-[10%] w-[60vw] h-[60vw] rounded-full bg-emerald-100/30 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[10%] left-[10%] w-[60vw] h-[60vw] rounded-full bg-blue-100/20 blur-[120px] animate-pulse" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-md w-full bg-white/40 border border-white/60 p-8 md:p-10 rounded-3xl shadow-[0_32px_64px_rgba(15,23,42,0.04)] backdrop-blur-xl text-center relative z-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-500 mb-6 animate-bounce-gentle">
            <Inbox className="h-7 w-7" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Check your inbox
          </h1>
          
          <p className="mt-4 text-sm text-slate-600 leading-relaxed font-medium">
            We've sent a verification link to <strong className="text-slate-900 font-semibold">{email}</strong>.
            Please open the link in your email to verify and active your account.
          </p>

          <div className="mt-8 pt-6 border-t border-slate-900/5">
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full py-3.5 px-6 bg-slate-950 hover:bg-slate-800 text-white font-semibold rounded-2xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Back to Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f6f1eb] text-slate-950 relative overflow-hidden select-none">
      
      {/* LEFT PANEL: Premium Visual Panel (Desktop Only) */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-slate-950 items-center justify-center p-12">
        {/* Background visual image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/signup-visual.png"
            alt="Mindfulness Abstract"
            className="w-full h-full object-cover opacity-80 scale-105 transition-transform duration-10000 ease-out hover:scale-100"
          />
          {/* Subtle dark gradient overlay to ensure text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />
          <div className="absolute inset-0 bg-radial-gradient(circle_at_center,transparent_20%,rgba(15,23,42,0.4)_100%)" />
        </div>

        {/* Floating Brand Elements */}
        <div className="absolute top-8 left-8 z-10">
          <Link href="/" className="flex items-center gap-2 text-white/90 hover:text-white transition">
            <img src="/Logo.png" alt="Logo" className="h-9 w-auto brightness-200 invert" />
            <span className="font-semibold tracking-wide text-sm mt-1">Mindful Space</span>
          </Link>
        </div>

        {/* Soothing Mindfulness Quote Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-lg bg-white/10 border border-white/20 backdrop-blur-md rounded-3xl p-8 md:p-10 shadow-2xl text-white mt-auto"
        >
          <Sparkles className="h-6 w-6 text-yellow-300 mb-6 animate-pulse" />
          <h2 className="text-3xl font-medium leading-tight mb-4 tracking-tight">
            "Every reflection is a step closer to understanding yourself."
          </h2>
          <p className="text-white/75 text-base leading-relaxed">
            Begin your journey toward self-awareness and emotional growth today. Your space, your thoughts, completely secure.
          </p>
        </motion.div>
      </div>

      {/* RIGHT PANEL: Authentication Form Panel */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 py-12 md:px-12 lg:px-20 relative z-10">
        
        {/* Background Ambient Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div
            className="absolute top-[-10%] right-[-10%] w-[70vw] md:w-[40vw] h-[70vw] md:h-[40vw] rounded-full bg-yellow-200/20 blur-[100px] animate-pulse"
            style={{ animationDuration: "12s" }}
          />
          <div
            className="absolute bottom-[-10%] left-[-10%] w-[80vw] md:w-[45vw] h-[80vw] md:h-[45vw] rounded-full bg-pink-200/15 blur-[120px] animate-pulse"
            style={{ animationDuration: "16s", animationDelay: "2s" }}
          />
          <div
            className="absolute top-[40%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-emerald-200/10 blur-[90px] animate-pulse"
            style={{ animationDuration: "10s", animationDelay: "4s" }}
          />
        </div>

        {/* Back navigation button */}
        <div className="absolute top-6 left-6 z-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-900/5 hover:border-slate-900/10 rounded-full bg-white/40 backdrop-blur-xs transition hover:scale-105"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
        </div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md bg-white/40 border border-white/60 shadow-[0_32px_64px_rgba(15,23,42,0.04)] backdrop-blur-xl rounded-3xl p-8 md:p-10 relative z-10"
        >
          {/* Logo & Subheading */}
          <div className="text-center mb-6">
            <div className="inline-flex justify-center items-center gap-2 mb-3">
              <img src="/Logo.png" alt="Logo" className="h-8 w-auto" />
              <span className="font-bold tracking-tight text-lg mt-1 text-slate-900">Mindful Space</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Create Account
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 font-medium">
              Start your emotional insights journey today
            </p>
          </div>

          {/* Toast Error State */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="bg-red-50/80 border border-red-200/50 text-red-700 p-4 rounded-2xl text-xs flex items-start gap-2.5 mb-5 backdrop-blur-xs overflow-hidden"
              >
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">Registration Issue</span>
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 pl-1">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <UserIcon className="h-4 w-4" />
                </span>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-slate-900/10 focus:border-slate-900 rounded-2xl text-sm transition outline-hidden focus:bg-white focus:ring-4 focus:ring-slate-900/5 text-slate-900 placeholder-slate-400"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 pl-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-slate-900/10 focus:border-slate-900 rounded-2xl text-sm transition outline-hidden focus:bg-white focus:ring-4 focus:ring-slate-900/5 text-slate-900 placeholder-slate-400"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 pl-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-slate-900/10 focus:border-slate-900 rounded-2xl text-sm transition outline-hidden focus:bg-white focus:ring-4 focus:ring-slate-900/5 text-slate-900 placeholder-slate-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 pl-1">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-slate-900/10 focus:border-slate-900 rounded-2xl text-sm transition outline-hidden focus:bg-white focus:ring-4 focus:ring-slate-900/5 text-slate-900 placeholder-slate-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-slate-950 hover:bg-slate-800 text-white font-semibold rounded-2xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-slate-950/10 mt-5 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Separator */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-900/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#fdfbf7] rounded-full text-slate-400 font-medium">
                or continue with
              </span>
            </div>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full py-3.5 px-4 border border-slate-900/10 bg-white/60 hover:bg-white text-slate-700 font-semibold rounded-2xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 hover:border-slate-900/20 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.467 0-6.277-2.81-6.277-6.277 0-3.467 2.81-6.277 6.277-6.277 1.583 0 3.023.59 4.134 1.558l3.056-3.056C18.665 1.944 15.65.986 12.24.986 6.162.986 1.254 5.894 1.254 11.972s4.908 10.986 10.986 10.986c5.8 0 10.743-4.2 10.743-10.986 0-.62-.066-1.21-.194-1.687H12.24z"
              />
            </svg>
            <span>Google Account</span>
          </button>

          {/* Navigation to Login */}
          <p className="text-center text-xs text-slate-500 font-semibold mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-slate-950 underline underline-offset-4 hover:text-slate-800 transition"
            >
              Sign in here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import StatsCards from "@/app/components/dashboard/Widgets/StatsCards";
import MoodChart from "@/app/components/dashboard/Widgets/MoodChart";
import RecentEntries from "@/app/components/dashboard/Widgets/WellnessGoals";
import QuoteCard from "@/app/components/dashboard/Widgets/QuoteCard";

import MoodCalendar from "@/app/components/dashboard/Widgets/MoodCalendar";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f1eb] dark:bg-[#0F0714]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 22) return "Good evening";
    return "Good night";
  };

  const greeting = getGreeting();
  const userName = user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "there";

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        {/* Soft glowing ambient circle behind banner */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white capitalize">
            {greeting}, <span className="bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">{userName}</span>!
          </h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm max-w-xl md:text-base leading-relaxed">
            Welcome to your pause. Take a deep breath and let's check in with your inner space.
          </p>
        </div>
      </div>

      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <MoodChart />
          <MoodCalendar />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
          <QuoteCard />
          <RecentEntries />
        </div>
      </div>
    </div>
  );
}

"use client";

import { Activity, TrendingUp, Zap, Book as BookIcon } from "lucide-react";
import { useMemo } from "react";
import { useEntries, useEntryStats } from "@/hooks/use-api";

export default function StatsCards() {
  const { data: entries, isLoading: entriesLoading } = useEntries();
  const { data: statsData, isLoading: statsLoading } = useEntryStats();

  // Calculate current streak from entries
  const streak = useMemo(() => {
    if (!entries || entries.length === 0) {
      return 0;
    }

    // Sort entries by date (most recent first)
    const sortedEntries = [...entries].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Get unique dates
    const uniqueDates = Array.from(
      new Set(
        sortedEntries.map((entry) => new Date(entry.createdAt).toDateString()),
      ),
    );

    if (uniqueDates.length === 0) return 0;

    // Check consecutive days
    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentDate = new Date(uniqueDates[0]);
    currentDate.setHours(0, 0, 0, 0);

    // If most recent entry is not today or yesterday, streak is 0
    const daysDiff = Math.floor(
      (today.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff > 1) {
      return 0; // Most recent entry is older than yesterday — streak broken
    }

    // Count consecutive days
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      prevDate.setHours(0, 0, 0, 0);
      currDate.setHours(0, 0, 0, 0);

      const diff = Math.floor(
        (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }, [entries]);

  const stats = [
    {
      label: "Current Streak",
      value: `${streak} ${streak === 1 ? "Day" : "Days"}`,
      change: streak > 0 ? "Keep it up!" : "Start journaling today",
      icon: Zap,
      color: "text-amber-600 dark:text-yellow-400",
      bg: "bg-amber-100/80 dark:bg-yellow-400/10",
      glow: "hover:shadow-[0_8px_30px_rgba(245,158,11,0.12)] dark:hover:shadow-[0_8px_30px_rgba(250,204,21,0.06)] hover:border-amber-500/30 dark:hover:border-yellow-400/30",
      badgeType: streak > 0 ? "success" : "warning",
      iconAnim: "group-hover:animate-pulse-glow group-hover:scale-110",
    },
    {
      label: "Average Mood",
      value:
        statsData?.averageSentiment !== null &&
        statsData?.averageSentiment !== undefined
          ? (statsData.averageSentiment * 10).toFixed(1)
          : "N/A",
      change:
        statsData?.averageSentiment !== null &&
        statsData?.averageSentiment !== undefined
          ? statsData.averageSentiment > 0
            ? "Positive sentiment"
            : statsData.averageSentiment < 0
              ? "Needs attention"
              : "Neutral"
          : "No data yet",
      icon: Activity,
      color: "text-emerald-600 dark:text-green-400",
      bg: "bg-emerald-100/80 dark:bg-green-400/10",
      glow: "hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)] dark:hover:shadow-[0_8px_30px_rgba(52,211,153,0.06)] hover:border-emerald-500/30 dark:hover:border-emerald-400/30",
      badgeType: (() => {
        if (!statsData || statsData.averageSentiment === null || statsData.averageSentiment === undefined) return "neutral";
        if (statsData.averageSentiment > 0.1) return "success";
        if (statsData.averageSentiment < -0.1) return "danger";
        return "neutral";
      })(),
      iconAnim: "group-hover:animate-heartbeat",
    },
    {
      label: "Total Entries",
      value: `${statsData?.totalEntries || 0}`,
      change:
        (statsData?.totalEntries || 0) > 0
          ? "Entries recorded"
          : "No entries yet",
      icon: BookIcon,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100/80 dark:bg-blue-400/10",
      glow: "hover:shadow-[0_8px_30px_rgba(59,130,246,0.12)] dark:hover:shadow-[0_8px_30px_rgba(96,165,250,0.06)] hover:border-blue-500/30 dark:hover:border-blue-400/30",
      badgeType: (statsData?.totalEntries || 0) > 0 ? "success" : "neutral",
      iconAnim: "group-hover:rotate-6 group-hover:scale-105",
    },
    {
      label: "Mood Trend",
      value: (() => {
        if (!entries || entries.length < 2) return "N/A";
        const sorted = [...entries]
          .filter((e: any) => e.sentiment !== null)
          .sort(
            (a: any, b: any) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
        if (sorted.length < 2) return "N/A";
        const mid = Math.floor(sorted.length / 2);
        const olderAvg =
          sorted
            .slice(0, mid)
            .reduce((s: number, e: any) => s + e.sentiment, 0) / mid;
        const newerAvg =
          sorted.slice(mid).reduce((s: number, e: any) => s + e.sentiment, 0) /
          (sorted.length - mid);
        const diff = newerAvg - olderAvg;
        if (diff > 0.05) return "↑ Improving";
        if (diff < -0.05) return "↓ Declining";
        return "→ Stable";
      })(),
      change: (() => {
        if (
          !entries ||
          entries.filter((e: any) => e.sentiment !== null).length < 2
        )
          return "Need more entries";
        const sorted = [...entries]
          .filter((e: any) => e.sentiment !== null)
          .sort(
            (a: any, b: any) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
        const mid = Math.floor(sorted.length / 2);
        const olderAvg =
          sorted
            .slice(0, mid)
            .reduce((s: number, e: any) => s + e.sentiment, 0) / mid;
        const newerAvg =
          sorted.slice(mid).reduce((s: number, e: any) => s + e.sentiment, 0) /
          (sorted.length - mid);
        const diff = newerAvg - olderAvg;
        if (diff > 0.05) return "Getting better!";
        if (diff < -0.05) return "Take care of yourself";
        return "Consistent mood";
      })(),
      icon: TrendingUp,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100/80 dark:bg-purple-400/10",
      glow: "hover:shadow-[0_8px_30px_rgba(168,85,247,0.12)] dark:hover:shadow-[0_8px_30px_rgba(192,132,252,0.06)] hover:border-purple-500/30 dark:hover:border-purple-400/30",
      badgeType: (() => {
        if (!entries || entries.filter((e: any) => e.sentiment !== null).length < 2) return "neutral";
        const sorted = [...entries]
          .filter((e: any) => e.sentiment !== null)
          .sort(
            (a: any, b: any) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
        const mid = Math.floor(sorted.length / 2);
        const olderAvg =
          sorted
            .slice(0, mid)
            .reduce((s: number, e: any) => s + e.sentiment, 0) / mid;
        const newerAvg =
          sorted.slice(mid).reduce((s: number, e: any) => s + e.sentiment, 0) /
          (sorted.length - mid);
        const diff = newerAvg - olderAvg;
        if (diff > 0.05) return "success";
        if (diff < -0.05) return "danger";
        return "neutral";
      })(),
      iconAnim: "group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
    },
  ];

  const getBadgeStyles = (type: string) => {
    switch (type) {
      case "success":
        return "text-emerald-600 dark:text-green-400 bg-emerald-500/10 border border-emerald-500/20";
      case "warning":
        return "text-amber-600 dark:text-yellow-400 bg-amber-500/10 border border-amber-500/20";
      case "danger":
        return "text-rose-600 dark:text-red-400 bg-rose-500/10 border border-rose-500/20";
      default:
        return "text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20";
    }
  };

  if (entriesLoading || statsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 animate-pulse"
          >
            <div className="h-12 bg-slate-200/60 dark:bg-white/10 rounded-xl mb-4"></div>
            <div className="h-8 bg-slate-200/60 dark:bg-white/10 rounded mb-2"></div>
            <div className="h-4 bg-slate-200/60 dark:bg-white/10 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className={`group bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 hover:bg-white/70 dark:hover:bg-white/10 transition-all duration-300 ${stat.glow}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl transition-all duration-300 ${stat.bg}`}>
                <Icon className={`w-6 h-6 transition-all duration-300 ${stat.color} ${stat.iconAnim}`} />
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${getBadgeStyles(stat.badgeType)}`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-1">{stat.value}</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}

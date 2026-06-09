"use client";

import Link from "next/link";
import { useEntries } from "@/hooks/use-api";
import { BookOpen, PenLine, Plus } from "lucide-react";
import { format } from "date-fns";

const moodEmojis: Record<string, string> = {
  Happy: "😊",
  Neutral: "😐",
  Sad: "😢",
  Anxious: "😰",
  Energetic: "⚡",
  Calm: "😌",
  Grateful: "🙏",
  Angry: "😠",
  Reflective: "💭",
  Frustrated: "😤",
  Loving: "💖",
};

const moodGlowColors: Record<string, string> = {
  Happy: "group-hover:shadow-[0_0_12px_rgba(234,179,8,0.3)] bg-yellow-500/10",
  Neutral: "group-hover:shadow-[0_0_12px_rgba(168,85,247,0.3)] bg-purple-500/10",
  Sad: "group-hover:shadow-[0_0_12px_rgba(59,130,246,0.3)] bg-blue-500/10",
  Anxious: "group-hover:shadow-[0_0_12px_rgba(192,132,252,0.3)] bg-purple-400/10",
  Energetic: "group-hover:shadow-[0_0_12px_rgba(249,115,22,0.3)] bg-orange-500/10",
  Calm: "group-hover:shadow-[0_0_12px_rgba(16,185,129,0.3)] bg-emerald-500/10",
  Grateful: "group-hover:shadow-[0_0_12px_rgba(244,114,182,0.3)] bg-pink-500/10",
  Angry: "group-hover:shadow-[0_0_12px_rgba(239,68,68,0.3)] bg-red-500/10",
  Reflective: "group-hover:shadow-[0_0_12px_rgba(99,102,241,0.3)] bg-indigo-500/10",
  Frustrated: "group-hover:shadow-[0_0_12px_rgba(249,115,22,0.3)] bg-orange-500/10",
  Loving: "group-hover:shadow-[0_0_12px_rgba(244,114,182,0.3)] bg-pink-500/10",
};

export default function WellnessGoals() {
  const { data: entries, isLoading } = useEntries();

  // Check if user journaled today
  const today = new Date().toDateString();
  const journaledToday = entries?.some(
    (e: any) => new Date(e.createdAt).toDateString() === today,
  );

  const recentEntries = (entries || []).slice(0, 3);

  // Helper to extract primary mood
  const getPrimaryMoodLabel = (entry: any): string => {
    if (entry.moodLabels && entry.moodLabels.length > 0) {
      return entry.moodLabels[0];
    }
    if (entry.customMoodLabel) {
      return entry.customMoodLabel;
    }
    if (entry.mood === "POSITIVE") return "Happy";
    if (entry.mood === "NEGATIVE") return "Sad";
    return "Neutral";
  };

  if (isLoading) {
    return (
      <div className="bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-xs">
        <div className="h-5 bg-slate-200/60 dark:bg-white/10 rounded w-40 animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 bg-slate-200/60 dark:bg-white/10 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-xs flex flex-col justify-between flex-1">
      <div className="flex flex-col flex-1">
        {/* Journal Today Prompt */}
        {!journaledToday && (
          <Link
            href="/dashboard/journal"
            className="flex items-center gap-3 p-4 mb-5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/15 dark:to-pink-500/15 border border-purple-200/40 dark:border-purple-500/15 rounded-xl hover:from-purple-500/20 hover:to-pink-500/20 dark:hover:from-purple-500/25 dark:hover:to-pink-500/25 transition-all duration-300 group shadow-xs hover:shadow-sm"
          >
            <div className="p-2.5 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl group-hover:bg-purple-500/20 dark:group-hover:bg-purple-500/30 group-hover:scale-105 transition-all duration-300">
              <PenLine className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:animate-pulse-glow" />
            </div>
            <div>
              <p className="text-slate-800 dark:text-white font-semibold text-sm">
                Haven&apos;t journaled today
              </p>
              <p className="text-slate-500 dark:text-gray-400 text-xs">Tap to write about your day</p>
            </div>
          </Link>
        )}

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Recent Entries
          </h3>
          <Link
            href="/dashboard/entries"
            className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors"
          >
            View All
          </Link>
        </div>

        {recentEntries.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8 min-h-[160px] text-slate-400 dark:text-gray-500 bg-slate-500/5 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/5 rounded-xl">
            <p className="text-sm font-medium">No entries yet</p>
            <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
              Start journaling to see your entries here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentEntries.map((entry: any) => {
              const primaryMood = getPrimaryMoodLabel(entry);
              const emoji = moodEmojis[primaryMood] || "😐";
              const glowClass = moodGlowColors[primaryMood] || "bg-purple-500/10";
              return (
                <Link
                  key={entry.id}
                  href="/dashboard/entries"
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-500/5 dark:bg-white/5 hover:bg-slate-500/10 dark:hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-slate-200/50 dark:hover:border-white/5 hover:-translate-y-0.5 group"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all duration-300 ${glowClass}`}>
                    {emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
                      {entry.title || "Untitled"}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">
                      {format(new Date(entry.createdAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Link
        href="/dashboard/journal"
        className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-dashed border-slate-300 dark:border-white/20 text-slate-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-300 hover:border-purple-500/50 dark:hover:border-purple-500/50 hover:bg-purple-500/5 transition-all duration-300 text-xs font-semibold uppercase tracking-wider"
      >
        <Plus className="w-4 h-4" />
        <span>Write New Entry</span>
      </Link>
    </div>
  );
}

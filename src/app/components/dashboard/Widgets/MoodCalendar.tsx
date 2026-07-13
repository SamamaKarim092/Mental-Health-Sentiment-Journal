"use client";

import { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { useEntries } from "@/hooks/use-api";
import { useTheme } from "next-themes";

// Mood to color mapping
const MOOD_COLORS: Record<string, string> = {
  Happy:     "#facc15", // yellow
  Neutral:   "#a78bfa", // purple
  Sad:       "#60a5fa", // blue
  Anxious:   "#c084fc", // light purple
  Energetic: "#fb923c", // orange
  Calm:      "#34d399", // emerald
  Grateful:  "#f472b6", // pink
  Angry:     "#ef4444", // red
};

const moodEmojis: Record<string, string> = {
  Happy:     "😊",
  Neutral:   "😐",
  Sad:       "😢",
  Anxious:   "😰",
  Energetic: "⚡",
  Calm:      "😌",
  Grateful:  "🙏",
  Angry:     "😠",
};

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function getPrimaryMoodLabel(entry: any): string {
  if (entry.moodLabels && entry.moodLabels.length > 0) {
    return entry.moodLabels.find((l: string) => MOOD_COLORS[l]) || entry.moodLabels[0];
  }
  if (entry.mood === "POSITIVE") return "Happy";
  if (entry.mood === "NEGATIVE") return "Sad";
  return "Neutral";
}

export default function MoodCalendar() {
  const { data: entries, isLoading } = useEntries({ take: 100 });
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || resolvedTheme === "dark";

  const [hoveredDay, setHoveredDay] = useState<{
    dateKey: string;
    mood: string | null;
    x: number;
    y: number;
  } | null>(null);

  const noEntryColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.06)";

  // Build a map of date -> primary mood
  const moodMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (!entries) return map;
    for (const entry of entries) {
      // Use local date string (YYYY-MM-DD) instead of UTC ISO string
      const dateKey = format(new Date(entry.createdAt), 'yyyy-MM-dd');
      if (!map[dateKey]) {
        map[dateKey] = getPrimaryMoodLabel(entry);
      }
    }
    return map;
  }, [entries]);

  // Generate grid of last 12 weeks (84 days)
  const weeks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalDays = 84; // 12 weeks
    const result: Array<Array<{ date: Date; dateKey: string; mood: string | null }>> = [];

    // Start from 84 days ago, aligned to Monday
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDays + 1);
    // Align to Monday (0 = Sun, 1 = Mon)
    const dayOfWeek = startDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysToMonday);

    let currentWeek: typeof result[0] = [];
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 1);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = format(d, 'yyyy-MM-dd');
      currentWeek.push({
        date: new Date(d),
        dateKey,
        mood: moodMap[dateKey] || null,
      });
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [moodMap]);

  // Month labels
  const monthLabels = useMemo(() => {
    const labels: Array<{ label: string; col: number }> = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const firstDay = week[0];
      if (firstDay) {
        const month = firstDay.date.getMonth();
        if (month !== lastMonth) {
          labels.push({
            label: firstDay.date.toLocaleString("default", { month: "short" }),
            col: i,
          });
          lastMonth = month;
        }
      }
    });
    return labels;
  }, [weeks]);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, day: any) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const container = target.closest(".relative");
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    // Position tooltip centrally above the hovered box
    const x = rect.left - containerRect.left + rect.width / 2;
    const y = rect.top - containerRect.top - 8;

    setHoveredDay({
      dateKey: day.dateKey,
      mood: day.mood,
      x,
      y,
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-xs">
        <div className="h-5 bg-slate-200/60 dark:bg-white/10 rounded w-48 animate-pulse mb-4" />
        <div className="h-[120px] bg-slate-250/30 dark:bg-white/5 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-xs relative">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Mood Calendar</h3>

      <div className="overflow-x-auto relative z-10">
        <div className="inline-flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-2 pt-5">
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="h-[14px] text-[10px] text-slate-400 dark:text-gray-500 leading-[14px]">
                {label}
              </div>
            ))}
          </div>

          {/* Weeks grid */}
          <div>
            {/* Month labels row */}
            <div className="flex gap-0.5 mb-1 h-4">
              {weeks.map((_, i) => {
                const label = monthLabels.find((m) => m.col === i);
                return (
                  <div key={i} className="w-[14px] text-[10px] text-slate-400 dark:text-gray-500">
                    {label?.label || ""}
                  </div>
                );
              })}
            </div>

            {/* Calendar grid */}
            <div className="flex gap-0.5">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                  {week.map((day, di) => {
                    const isFuture = day.date > new Date();
                    const color = day.mood ? MOOD_COLORS[day.mood] || "#6b7280" : noEntryColor;
                    return (
                      <div
                        key={di}
                        onMouseEnter={(e) => handleMouseEnter(e, day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className="w-[14px] h-[14px] rounded-[3px] transition-all duration-200 hover:scale-130 cursor-pointer"
                        style={{
                          backgroundColor: isFuture ? "transparent" : color,
                          border: isFuture ? (isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(15,23,42,0.08)") : "none",
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 text-xs relative z-10">
        {Object.entries(MOOD_COLORS).map(([mood, color]) => (
          <div key={mood} className="flex items-center gap-1">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: color }}
            />
            <span className="text-slate-500 dark:text-gray-400">{mood}</span>
          </div>
        ))}
      </div>

      {/* Custom Tooltip */}
      {hoveredDay && (
        <div
          className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full backdrop-blur-md bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/50 dark:border-white/10 text-white p-2.5 rounded-xl shadow-xl text-center flex flex-col items-center gap-0.5 min-w-[130px] transition-opacity duration-200"
          style={{
            left: `${hoveredDay.x}px`,
            top: `${hoveredDay.y}px`,
          }}
        >
          <span className="text-[10px] font-semibold text-slate-400 dark:text-gray-400">
            {format(new Date(hoveredDay.dateKey + "T00:00:00"), "MMM dd, yyyy")}
          </span>
          {hoveredDay.mood ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm">{moodEmojis[hoveredDay.mood] || "😐"}</span>
              <span className="text-xs font-bold text-white">{hoveredDay.mood}</span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-500 dark:text-gray-500 italic mt-0.5">No entry</span>
          )}
          {/* Tooltip arrow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[4px] w-2 h-2 bg-slate-900 dark:bg-slate-950 rotate-45 border-r border-b border-slate-700/50 dark:border-white/10" />
        </div>
      )}
    </div>
  );
}

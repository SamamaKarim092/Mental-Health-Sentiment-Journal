"use client";

import { useState } from "react";
import { useMoodTrends } from "@/hooks/use-api";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { format, parseISO } from "date-fns";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.mood === null) return null;
    return (
      <div className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 p-3.5 rounded-xl shadow-xl space-y-1">
        <p className="text-[10px] font-semibold text-slate-400 dark:text-gray-400 uppercase tracking-wider">
          {data.fullDate}
        </p>
        <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400 animate-pulse" />
          Mood Score: {data.mood.toFixed(1)}/10
        </p>
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-gray-400 pt-1.5 border-t border-slate-200/50 dark:border-white/5 mt-1.5">
          <span>😊 {data.positiveCount}</span>
          <span>😐 {data.neutralCount}</span>
          <span>😔 {data.negativeCount}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function MoodChart() {
  const [days, setDays] = useState(7);

  const { data, isLoading: loading, error } = useMoodTrends(days);

  // Transform data for the chart
  const chartData = (data || []).map((trend: any) => {
    // Parse the date and format it
    const date = parseISO(trend.date);
    const dayLabel = format(date, "EEE"); // Mon, Tue, Wed, etc.

    // Convert sentiment from -1 to 1 scale to 0 to 10 scale for better visualization
    // sentiment = null means no sentiment analysis yet
    const moodScore =
      trend.averageSentiment !== null
        ? ((trend.averageSentiment + 1) / 2) * 10
        : null;

    return {
      day: dayLabel,
      fullDate: format(date, "MMM dd, yyyy"),
      mood: moodScore,
      rawSentiment: trend.averageSentiment,
      positiveCount: trend.positiveCount,
      neutralCount: trend.neutralCount,
      negativeCount: trend.negativeCount,
    };
  });

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDays(Number(e.target.value));
  };

  if (loading) {
    return (
      <div className="bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-slate-200/60 dark:bg-white/10 rounded w-48 animate-pulse"></div>
          <div className="h-8 bg-slate-200/60 dark:bg-white/10 rounded w-32 animate-pulse"></div>
        </div>
        <div className="h-[300px] w-full bg-slate-200/20 dark:bg-white/5 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
            Mood Overview
          </h3>
        </div>
        <div className="h-[300px] flex items-center justify-center text-slate-500 dark:text-gray-400">
          Error loading mood trends
        </div>
      </div>
    );
  }

  const hasData =
    chartData.length > 0 && chartData.some((d: any) => d.mood !== null);

  return (
    <div className="bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-xs relative overflow-hidden">
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Mood Overview</h3>
        <select
          className="bg-slate-500/5 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1 text-sm text-slate-600 dark:text-gray-400 focus:outline-none focus:border-purple-500/30"
          value={days}
          onChange={handlePeriodChange}
        >
          <option value={7} className="bg-white dark:bg-[#0F0714] text-slate-800 dark:text-white">Last 7 Days</option>
          <option value={14} className="bg-white dark:bg-[#0F0714] text-slate-800 dark:text-white">Last 14 Days</option>
          <option value={30} className="bg-white dark:bg-[#0F0714] text-slate-800 dark:text-white">Last 30 Days</option>
        </select>
      </div>

      {!hasData ? (
        <div className="h-[300px] flex items-center justify-center relative z-10">
          <div className="text-center text-slate-500 dark:text-gray-400 p-6">
            <p className="mb-2 font-medium">No sentiment data available yet</p>
            <p className="text-xs text-slate-400 dark:text-gray-500 max-w-xs mx-auto">
              Sentiment scores will appear here once your journal entries are created and analyzed.
            </p>
          </div>
        </div>
      ) : (
        <div className="h-[300px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMoodGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-line)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-line)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--chart-grid)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                stroke="#9CA3AF"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis
                stroke="#9CA3AF"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 10]}
                ticks={[0, 2, 4, 6, 8, 10]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(168, 85, 247, 0.15)", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="mood"
                stroke="var(--chart-line)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorMoodGlow)"
                dot={{ fill: "var(--chart-line)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "#fff", stroke: "var(--chart-line)", strokeWidth: 3 }}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Activity,
  Loader2,
  Smile,
  Frown,
  Meh,
  CloudRain,
  Zap,
  Coffee,
  Heart,
  Flame,
  BarChart3,
  PieChart as PieChartIcon,
  CheckSquare,
} from "lucide-react";
import { useMoodTrends } from "@/hooks/use-api";
import { format } from "date-fns";

const MOOD_COLORS: Record<string, string> = {
  Happy: "#FACC15",
  Neutral: "#C084FC",
  Sad: "#60A5FA",
  Anxious: "#D8B4FE",
  Energetic: "#FB923C",
  Calm: "#34D399",
  Grateful: "#F472B6",
  Angry: "#EF4444",
};

const MOOD_ICONS: Record<string, any> = {
  Happy: Smile,
  Neutral: Meh,
  Sad: Frown,
  Anxious: CloudRain,
  Energetic: Zap,
  Calm: Coffee,
  Grateful: Heart,
  Angry: Flame,
};

const MOODS = ["Happy", "Neutral", "Sad", "Anxious", "Energetic", "Calm", "Grateful", "Angry"];

export default function TrendsPage() {
  const [days, setDays] = useState(30);
  const { data: trends, isLoading, error } = useMoodTrends(days);

  // Compute aggregated stats from trends data  
  const totalEntries = trends?.reduce((acc: number, d: any) => acc + (d.entryCount || 0), 0) || 0;

  // Mood distribution for pie chart
  const moodDistribution = MOODS.map((mood) => ({
    name: mood,
    value: trends?.reduce((acc: number, d: any) => acc + (d[mood] || 0), 0) || 0,
    color: MOOD_COLORS[mood],
  })).filter((m) => m.value > 0);

  // Format chart data — show date as readable
  const chartData = (trends || []).map((d: any) => ({
    ...d,
    date: format(new Date(d.date), "MMM dd"),
    sentiment: d.averageSentiment !== null ? Math.round(d.averageSentiment * 100) : null,
  }));

  // Top mood
  const topMood = moodDistribution.length > 0
    ? moodDistribution.reduce((a, b) => (a.value > b.value ? a : b))
    : null;

  // Average sentiment
  const sentimentValues = (trends || [])
    .filter((d: any) => d.averageSentiment !== null)
    .map((d: any) => d.averageSentiment);
  const avgSentiment = sentimentValues.length > 0
    ? Math.round((sentimentValues.reduce((a: number, b: number) => a + b, 0) / sentimentValues.length) * 100)
    : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Mood Trends</h2>
          <p className="text-gray-400">
            Visualize your emotional journey over time
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500/50"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 3 Months</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          Failed to load trends. Please refresh the page.
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && totalEntries === 0 && (
        <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
          <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No data yet</h3>
          <p className="text-gray-500">Start writing journal entries to see your mood trends here!</p>
        </div>
      )}

      {!isLoading && !error && totalEntries > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-sm text-gray-400">Total Entries</span>
              </div>
              <p className="text-3xl font-bold text-white">{totalEntries}</p>
              <p className="text-xs text-gray-500 mt-1">in the last {days} days</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  {topMood ? (
                    (() => {
                      const Icon = MOOD_ICONS[topMood.name];
                      return <Icon className="w-5 h-5" style={{ color: topMood.color }} />;
                    })()
                  ) : (
                    <Smile className="w-5 h-5 text-yellow-400" />
                  )}
                </div>
                <span className="text-sm text-gray-400">Most Common Mood</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {topMood ? topMood.name : "—"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {topMood ? `${topMood.value} time${topMood.value > 1 ? "s" : ""}` : "no entries"}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Activity className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-sm text-gray-400">Avg Sentiment</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {avgSentiment !== null ? `${avgSentiment}%` : "—"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {avgSentiment !== null
                  ? avgSentiment >= 70 ? "Mostly positive ✨" : avgSentiment >= 40 ? "Mixed feelings" : "Tough stretch 💙"
                  : "not enough data"}
              </p>
            </div>
          </div>

          {/* Main Mood Chart — Stacked Area */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Mood Overview</h3>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4">
              {MOODS.map((mood) => (
                <div key={mood} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: MOOD_COLORS[mood] }}
                  />
                  <span className="text-xs text-gray-400">{mood}</span>
                </div>
              ))}
            </div>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    {MOODS.map((mood) => (
                      <linearGradient key={mood} id={`color${mood}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={MOOD_COLORS[mood]} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={MOOD_COLORS[mood]} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F1229",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  {MOODS.map((mood) => (
                    <Area
                      key={mood}
                      type="monotone"
                      dataKey={mood}
                      stackId="1"
                      stroke={MOOD_COLORS[mood]}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill={`url(#color${mood})`}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sentiment Over Time */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Activity className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Sentiment Score</h3>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.filter((d: any) => d.sentiment !== null)}>
                    <defs>
                      <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34D399" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      axisLine={false}
                      tickLine={false}
                      fontSize={12}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F1229",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                      }}
                      formatter={(value: number) => [`${value}%`, "Sentiment"]}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sentiment"
                      stroke="#34D399"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorSentiment)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mood Distribution Pie */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-pink-500/20 rounded-lg">
                  <PieChartIcon className="w-5 h-5 text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Mood Distribution</h3>
              </div>
              <div className="h-[250px] w-full">
                {moodDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={moodDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${((percent || 0) * 100).toFixed(0)}%`
                        }
                      >
                        {moodDistribution.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F1229",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                        }}
                        formatter={(value: number, name: string) => [value, name]}
                        itemStyle={{ color: "#fff" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No mood data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mood Breakdown Bar Chart */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <BarChart3 className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Daily Mood Breakdown</h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F1229",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  {MOODS.map((mood) => (
                    <Bar
                      key={mood}
                      dataKey={mood}
                      stackId="a"
                      fill={MOOD_COLORS[mood]}
                      radius={[0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Task Completion Trend Chart */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <CheckSquare className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Daily Task Completion & Productivity</h3>
                  <p className="text-xs text-gray-400">Track tasks completed each day alongside your journaling activity</p>
                </div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F1229",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Bar
                    dataKey="completedTasks"
                    name="Completed Tasks"
                    fill="#60A5FA"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="totalTasks"
                    name="Total Tasks"
                    fill="rgba(255,255,255,0.1)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BrainCircuit,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Smile,
  Frown,
  Meh,
  CloudRain,
  Zap,
  Coffee,
  Heart,
  Flame,
  Award,
  BookOpen,
  Sparkles,
  MessageCircle,
  CheckSquare,
  Target,
  Layers,
  Brain,
} from "lucide-react";
import { useAnalysis } from "@/hooks/use-api";
import { apiFetch } from "@/lib/api/fetcher";

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

const INSIGHT_ICONS: Record<string, any> = {
  positive: CheckCircle2,
  warning: AlertCircle,
  suggestion: Lightbulb,
};

const INSIGHT_STYLES: Record<string, { color: string; bg: string; border: string; glow: string }> = {
  positive: { 
    color: "text-green-400", 
    bg: "bg-green-500/10", 
    border: "border-green-500/20",
    glow: "hover:shadow-green-500/5 hover:border-green-500/40"
  },
  warning: { 
    color: "text-orange-400", 
    bg: "bg-orange-500/10", 
    border: "border-orange-500/20",
    glow: "hover:shadow-orange-500/5 hover:border-orange-500/40"
  },
  suggestion: { 
    color: "text-purple-400", 
    bg: "bg-purple-500/10", 
    border: "border-purple-500/20",
    glow: "hover:shadow-purple-500/5 hover:border-purple-500/40"
  },
};

export default function AnalysisPage() {
  const router = useRouter();
  const [days, setDays] = useState(30);
  const { data: analysis, isLoading, error } = useAnalysis(days);

  // AI insights state
  const [aiData, setAiData] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch AI insights when analysis data is ready
  useEffect(() => {
    const hasData =
      (analysis?.totalEntries || 0) > 0 ||
      (analysis?.taskStats?.totalTasks || 0) > 0 ||
      (analysis?.goalStats?.totalGoals || 0) > 0;

    if (!analysis || !hasData) {
      setAiData(null);
      return;
    }

    const fetchAI = async () => {
      setAiLoading(true);
      try {
        const result = await apiFetch("/api/entries/analysis/ai", {
          method: "POST",
          body: JSON.stringify({
            entrySummaries: analysis.entrySummaries,
            chatSummaries: analysis.chatSummaries,
            moodBreakdown: analysis.moodBreakdown,
            avgSentiment: analysis.avgSentiment,
            sentimentTrend: analysis.sentimentTrend,
            writingStreak: analysis.writingStreak,
            totalEntries: analysis.totalEntries,
            taskStats: analysis.taskStats,
            goalStats: analysis.goalStats,
            ragClusters: analysis.ragClusters,
            period: analysis.period,
          }),
        });
        console.log("AI analysis result:", result);
        setAiData(result);
      } catch (err) {
        console.error("AI analysis fetch error:", err);
        setAiData(null);
      } finally {
        setAiLoading(false);
      }
    };

    fetchAI();
  }, [analysis]);

  // Mood breakdown sorted by count
  const moodEntries = analysis?.moodBreakdown
    ? Object.entries(analysis.moodBreakdown)
        .sort((a: any, b: any) => b[1] - a[1])
    : [];

  const totalMoodTags = moodEntries.reduce((acc: number, [, count]: any) => acc + count, 0);

  const sentimentIcon =
    analysis?.sentimentTrend === "up" ? TrendingUp :
    analysis?.sentimentTrend === "down" ? TrendingDown : Minus;

  const sentimentLabel =
    analysis?.sentimentTrend === "up" ? "Improving" :
    analysis?.sentimentTrend === "down" ? "Declining" : "Stable";

  const sentimentColor =
    analysis?.sentimentTrend === "up" ? "text-green-400" :
    analysis?.sentimentTrend === "down" ? "text-red-400" : "text-gray-400";

  const hasAnyUserActivity =
    analysis &&
    (analysis.totalEntries > 0 ||
      (analysis.taskStats?.totalTasks || 0) > 0 ||
      (analysis.goalStats?.totalGoals || 0) > 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-1">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            AI Insights & Holistic Analysis
          </h2>
          <p className="text-gray-400 text-[15px]">
            Deep cognitive analysis across your journal entries, AI conversations, daily tasks, and long-term goals.
          </p>
        </div>
        <div>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all cursor-pointer"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 3 Months</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
          <p className="text-gray-400 text-sm animate-pulse">Analyzing your mental wellness journey and productivity...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-5 text-red-400 text-[15px] flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>Failed to load your analysis. Please refresh or try again later.</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && !hasAnyUserActivity && (
        <div className="text-center py-20 bg-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-md">
          <BookOpen className="w-14 h-14 text-gray-600 mx-auto mb-5" />
          <h3 className="text-xl font-bold text-white mb-2">No activity recorded yet</h3>
          <p className="text-gray-400 max-w-md mx-auto text-sm leading-relaxed mb-6">
            Start writing journal entries or adding daily tasks to unlock full AI-powered insights, emotional trends, and productivity analysis!
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => router.push("/dashboard/journal")}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white rounded-xl text-sm font-semibold transition-all shadow-lg cursor-pointer"
            >
              Write First Entry
            </button>
            <button
              onClick={() => router.push("/dashboard/tasks")}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              Add Tasks
            </button>
          </div>
        </div>
      )}

      {!isLoading && !error && hasAnyUserActivity && (
        <>
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {[
              {
                label: "Journal Entries",
                value: analysis.totalEntries,
                desc: "Total entries written",
                icon: BookOpen,
                color: "text-purple-400 bg-purple-500/10 border-purple-500/10",
              },
              {
                label: "Writing Streak",
                value: `${analysis.writingStreak} d`,
                desc: "Consecutive active days",
                icon: Award,
                color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/10",
              },
              {
                label: "Avg Sentiment",
                value: analysis.avgSentiment !== null ? `${Math.round(analysis.avgSentiment * 100)}%` : "N/A",
                desc: "Positivity score",
                icon: Sparkles,
                color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/10",
              },
              {
                label: "Sentiment Trend",
                value: sentimentLabel,
                desc: "Emotional direction",
                icon: sentimentIcon,
                color: `${sentimentColor} bg-white/5 border-white/5`,
              },
              {
                label: "Task Completion",
                value: `${analysis.taskStats?.completionRate || 0}%`,
                desc: `${analysis.taskStats?.completedTasks || 0}/${analysis.taskStats?.totalTasks || 0} completed`,
                icon: CheckSquare,
                color: "text-blue-400 bg-blue-500/10 border-blue-500/10",
              },
              {
                label: "Long-term Goals",
                value: `${analysis.goalStats?.totalGoals || 0}`,
                desc: `${analysis.goalStats?.completedGoals || 0} achieved`,
                icon: Target,
                color: "text-pink-400 bg-pink-500/10 border-pink-500/10",
              },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white/[0.03] border border-white/10 hover:border-white/15 rounded-2xl p-4 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      {stat.label}
                    </span>
                    <div className={`p-1.5 rounded-lg border ${stat.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-extrabold text-white tracking-tight mb-0.5">
                      {stat.value}
                    </h4>
                    <p className="text-[11px] text-gray-500 font-medium truncate">{stat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Summary Banner */}
          <div className="bg-gradient-to-br from-purple-900/40 via-indigo-950/20 to-transparent border border-purple-500/20 rounded-3xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden shadow-xl shadow-purple-500/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row items-start gap-5 relative z-10">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shrink-0 shadow-lg shadow-purple-500/30">
                <BrainCircuit className="w-8 h-8 text-white animate-pulse" />
              </div>
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
                  <h3 className="text-xl font-bold text-white tracking-wide">
                    AI Wellness Summary
                  </h3>
                  {aiData?.summary && (
                    <button
                      onClick={() => {
                        const message = encodeURIComponent(
                          `Let's discuss my AI wellness analysis summary: "${aiData.summary}". My average sentiment is ${Math.round(analysis.avgSentiment * 100)}% and my trend is ${sentimentLabel.toLowerCase()}.`
                        );
                        router.push(`/dashboard/chat?initialMessage=${message}`);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 text-purple-200 hover:text-white rounded-xl text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Discuss with Coach
                    </button>
                  )}
                </div>

                {aiLoading ? (
                  <div className="space-y-2.5 py-2">
                    <div className="h-4 bg-white/10 rounded animate-pulse w-full" />
                    <div className="h-4 bg-white/10 rounded animate-pulse w-[95%]" />
                    <div className="h-4 bg-white/10 rounded animate-pulse w-[70%]" />
                  </div>
                ) : aiData?.summary ? (
                  <p className="text-gray-200 text-[15px] sm:text-base leading-relaxed">
                    {aiData.summary}
                  </p>
                ) : (
                  <p className="text-gray-400 italic text-[15px] leading-relaxed">
                    {analysis.totalEntries < 3
                      ? "Write at least 3 entries to unlock detailed AI summaries and wellness insights."
                      : "Connecting to wellness assistant..."}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* AI Insight Cards */}
          {aiData?.insights && aiData.insights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {aiData.insights.map((insight: any, index: number) => {
                const type = insight.type || "suggestion";
                const style = INSIGHT_STYLES[type] || INSIGHT_STYLES.suggestion;
                const Icon = INSIGHT_ICONS[type] || Lightbulb;
                return (
                  <div
                    key={index}
                    className={`bg-white/[0.02] border ${style.border} ${style.glow} rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-md`}
                  >
                    <div>
                      <div className={`p-2.5 rounded-xl w-fit mb-4 ${style.bg}`}>
                        <Icon className={`w-5.5 h-5.5 ${style.color}`} />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">
                        {insight.title}
                      </h3>
                      <p className="text-[15px] text-gray-300 leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const message = encodeURIComponent(
                          `I'd like to talk to you about this specific insight from my journal: "${insight.title}" — "${insight.description}".`
                        );
                        router.push(`/dashboard/chat?initialMessage=${message}`);
                      }}
                      className="mt-5 text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer self-start group/btn"
                    >
                      Discuss this insight
                      <span className="group-hover/btn:translate-x-0.5 transition-transform">→</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* AI Loading Shimmer for Insights */}
          {aiLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                  <div className="w-11 h-11 bg-white/10 rounded-xl mb-4 animate-pulse" />
                  <div className="h-5 bg-white/10 rounded w-2/3 mb-3 animate-pulse" />
                  <div className="h-3.5 bg-white/10 rounded w-full mb-2 animate-pulse" />
                  <div className="h-3.5 bg-white/10 rounded w-[80%] animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {/* RAG Semantic Memory Clusters */}
          {analysis.ragClusters && analysis.ragClusters.length > 0 && (
            <div className="bg-[#13091B]/60 border border-purple-500/20 rounded-3xl p-6 sm:p-7 shadow-lg backdrop-blur-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/15 rounded-xl border border-emerald-500/20">
                    <Brain className="w-5.5 h-5.5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      RAG Semantic Memory Themes
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                        🧠 Vector RAG
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400">
                      Behavioral and psychological themes extracted from your long-term vector embeddings
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysis.ragClusters.map((cluster: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white/[0.02] border border-white/10 hover:border-purple-500/30 rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xl">{cluster.icon}</span>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          {cluster.relevance}% Match
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mb-1">{cluster.theme}</h4>
                      <p className="text-xs text-gray-400 mb-3 line-clamp-2">{cluster.description}</p>
                    </div>

                    <div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${cluster.relevance}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-gray-500 font-medium">
                        {cluster.matchingEntriesCount} matching {cluster.matchingEntriesCount === 1 ? 'entry' : 'entries'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mood Breakdown + Keywords Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mood Breakdown */}
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-sm">
              <h3 className="text-lg font-bold text-white mb-6">Mood Distribution</h3>
              {moodEntries.length > 0 ? (
                <div className="space-y-4">
                  {moodEntries.map(([mood, count]: any) => {
                    const percent = totalMoodTags > 0 ? Math.round((count / totalMoodTags) * 100) : 0;
                    const MIcon = MOOD_ICONS[mood] || Meh;
                    return (
                      <div key={mood} className="flex items-center gap-3">
                        <MIcon
                          className="w-5 h-5 shrink-0"
                          style={{ color: MOOD_COLORS[mood] || "#9CA3AF" }}
                        />
                        <span className="text-sm font-semibold text-gray-300 w-20 shrink-0">{mood}</span>
                        <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: MOOD_COLORS[mood] || "#9CA3AF",
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 w-12 text-right">
                          {count} ({percent}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No mood distribution statistics available.</p>
              )}
            </div>

            {/* Sentiment Keywords */}
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-sm">
              <h3 className="text-lg font-bold text-white mb-6">
                Your Frequently Used Words
              </h3>
              {analysis.topKeywords && analysis.topKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {analysis.topKeywords.map((kw: any, i: number) => {
                    const maxCount = analysis.topKeywords[0].count;
                    const ratio = kw.count / maxCount;
                    const size = ratio > 0.7 ? "text-base px-4 py-2" : ratio > 0.4 ? "text-sm px-3.5 py-1.5" : "text-xs px-3 py-1.5";
                    const opacity = ratio > 0.7 ? "text-purple-300 border-purple-500/30 bg-purple-500/5" : ratio > 0.4 ? "text-gray-300 border-white/15" : "text-gray-400 border-white/10";
                    return (
                      <span
                        key={i}
                        className={`rounded-xl border ${opacity} ${size} hover:border-purple-500/50 hover:text-purple-300 hover:scale-[1.03] transition-all cursor-default font-medium`}
                        title={`Used ${kw.count} times`}
                      >
                        {kw.word}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">Write more entries to compile your vocabulary trends.</p>
              )}
            </div>
          </div>

          {/* AI Wellness Suggestions */}
          {aiData?.suggestions && aiData.suggestions.length > 0 && (
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-500/15 rounded-xl border border-yellow-500/10">
                  <Lightbulb className="w-5.5 h-5.5 text-yellow-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Wellness Recommendations</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiData.suggestions.map((suggestion: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 bg-white/[0.01] hover:bg-white/[0.03] rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all duration-300"
                  >
                    <span className="text-yellow-400 text-base mt-0.5 shrink-0">💡</span>
                    <p className="text-sm text-gray-300 leading-relaxed">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { useEntries, useGoals } from "@/hooks/use-api";
import { apiFetch } from "@/lib/api/fetcher";
import { mutate } from "swr";
import { CheckCircle2, Circle, Plus, Trash2, Target, Loader2 } from "lucide-react";

export default function WellnessGoals() {
  const { user } = useAuth();
  const { data: entries } = useEntries();
  const { data: goals, isLoading } = useGoals();
  const [newGoalText, setNewGoalText] = useState("");
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Check if user journaled today
  const todayStr = new Date().toDateString();
  const journaledToday = entries?.some(
    (e: any) => new Date(e.createdAt).toDateString() === todayStr
  );

  const goalsList = goals || [];

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim() || creating) return;

    setCreating(true);
    try {
      await apiFetch("/api/goals", {
        method: "POST",
        body: JSON.stringify({ text: newGoalText.trim(), category: "Wellness" }),
      });
      mutate("/api/goals");
      setNewGoalText("");
    } catch (err) {
      console.error("Failed to create goal:", err);
    } finally {
      setCreating(false);
    }
  };

  const toggleGoal = async (id: string, currentCompleted: boolean) => {
    setTogglingId(id);
    try {
      await apiFetch(`/api/goals/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !currentCompleted }),
      });
      mutate("/api/goals");
    } catch (err) {
      console.error("Failed to toggle goal:", err);
    } finally {
      setTogglingId(null);
    }
  };

  const deleteGoal = async (id: string) => {
    setDeletingId(id);
    try {
      await apiFetch(`/api/goals/${id}`, { method: "DELETE" });
      mutate("/api/goals");
    } catch (err) {
      console.error("Failed to delete goal:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const completedCount = goalsList.filter((g: any) => g.completed).length;
  const totalCount = goalsList.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (isLoading) {
    return (
      <div className="bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-xs flex items-center justify-center min-h-[220px]">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-xs flex flex-col justify-between flex-1">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Wellness Goals
          </h3>
          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
            {completedCount}/{totalCount} completed
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 space-y-2">
          <div className="w-full bg-slate-200 dark:bg-white/5 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-pink-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">
            <span>Goal Progress</span>
            <span>{percentage}%</span>
          </div>
        </div>

        {/* Journal Today Status */}
        {journaledToday !== undefined && (
          <div className={`flex items-center gap-2 p-3 rounded-xl mb-3 border transition-all duration-300 ${
            journaledToday 
              ? "bg-emerald-500/5 border-emerald-500/10 dark:bg-emerald-500/10 dark:border-emerald-500/15" 
              : "bg-purple-500/5 border-purple-500/10 dark:bg-purple-500/10 dark:border-purple-500/15"
          }`}>
            {journaledToday ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-purple-400 shrink-0" />
            )}
            <span className={`text-xs font-medium ${
              journaledToday 
                ? "text-emerald-600 dark:text-emerald-400" 
                : "text-purple-600 dark:text-purple-400"
            }`}>
              {journaledToday ? "Journaled today ✨" : "Haven't journaled today"}
            </span>
          </div>
        )}

        {/* Goals List */}
        <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
          {goalsList.map((goal: any) => (
            <div
              key={goal.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-500/5 dark:bg-white/5 hover:bg-slate-500/10 dark:hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-slate-200/50 dark:hover:border-white/5 group"
            >
              <button
                onClick={() => toggleGoal(goal.id, goal.completed)}
                disabled={togglingId === goal.id}
                className="flex items-center gap-3 text-left flex-1 min-w-0"
              >
                {togglingId === goal.id ? (
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin shrink-0" />
                ) : goal.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-400 dark:text-gray-500 hover:text-purple-500 transition-colors shrink-0" />
                )}
                <div className="min-w-0">
                  <span
                    className={`text-sm font-medium truncate block ${
                      goal.completed
                        ? "text-slate-400 dark:text-gray-500 line-through"
                        : "text-slate-700 dark:text-white"
                    }`}
                  >
                    {goal.text}
                  </span>
                  {goal.category && (
                    <span className="text-[10px] text-slate-400 dark:text-gray-600 uppercase tracking-wider">
                      {goal.category}
                    </span>
                  )}
                </div>
              </button>

              <button
                onClick={() => deleteGoal(goal.id)}
                disabled={deletingId === goal.id}
                className="text-slate-400 dark:text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                title="Delete Goal"
              >
                {deletingId === goal.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}

          {goalsList.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-400 dark:text-gray-500">
              No wellness goals yet. Add one below!
            </div>
          )}
        </div>
      </div>

      {/* Add Custom Goal Form */}
      <form onSubmit={addGoal} className="mt-5 flex gap-2">
        <input
          type="text"
          value={newGoalText}
          onChange={(e) => setNewGoalText(e.target.value)}
          placeholder="Add a wellness goal..."
          className="flex-1 bg-slate-500/5 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
        />
        <button
          type="submit"
          disabled={!newGoalText.trim() || creating}
          className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl disabled:opacity-50 transition-all shrink-0 flex items-center justify-center"
        >
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}

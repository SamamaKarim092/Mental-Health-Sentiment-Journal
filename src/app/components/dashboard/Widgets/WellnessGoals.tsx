"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import { useEntries } from "@/hooks/use-api";
import { CheckCircle2, Circle, Plus, Trash2, Target } from "lucide-react";

interface Goal {
  id: string;
  text: string;
  completed: boolean;
  isCustom?: boolean;
}

const DEFAULT_GOALS = [
  { id: "goal-water", text: "Drink 8 glasses of water", completed: false },
  { id: "goal-meditate", text: "Meditate for 10 minutes", completed: false },
  { id: "goal-walk", text: "Take a 15-minute walk", completed: false },
  { id: "goal-journal", text: "Write a journal entry", completed: false },
];

export default function WellnessGoals() {
  const { user } = useAuth();
  const { data: entries } = useEntries();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalText, setNewGoalText] = useState("");

  const userId = user?.id || "anonymous";
  const localStorageKey = `mindful_goals_${userId}`;

  // Check if user journaled today
  const todayStr = new Date().toDateString();
  const journaledToday = entries?.some(
    (e: any) => new Date(e.createdAt).toDateString() === todayStr
  );

  // Initialize goals from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(localStorageKey);
      if (stored) {
        let parsedGoals = JSON.parse(stored) as Goal[];
        
        // Auto-check journal goal if they journaled today
        parsedGoals = parsedGoals.map((g) => {
          if (g.id === "goal-journal") {
            return { ...g, completed: !!journaledToday };
          }
          return g;
        });

        setGoals(parsedGoals);
      } else {
        // First-time setup: load defaults
        const initialGoals = DEFAULT_GOALS.map((g) => {
          if (g.id === "goal-journal") {
            return { ...g, completed: !!journaledToday };
          }
          return g;
        });
        setGoals(initialGoals);
        localStorage.setItem(localStorageKey, JSON.stringify(initialGoals));
      }
    } catch (err) {
      console.error("Failed to load goals from localStorage:", err);
    }
  }, [localStorageKey, journaledToday]);

  // Sync journaledToday status if it changes
  useEffect(() => {
    if (goals.length === 0) return;
    const hasJournalGoal = goals.some((g) => g.id === "goal-journal");
    if (!hasJournalGoal) return;

    const updated = goals.map((g) => {
      if (g.id === "goal-journal" && g.completed !== journaledToday) {
        return { ...g, completed: !!journaledToday };
      }
      return g;
    });

    // Check if anything actually changed to avoid loop
    const changed = updated.some((g, i) => g.completed !== goals[i].completed);
    if (changed) {
      setGoals(updated);
      localStorage.setItem(localStorageKey, JSON.stringify(updated));
    }
  }, [journaledToday, goals, localStorageKey]);

  const saveGoals = (newGoals: Goal[]) => {
    setGoals(newGoals);
    localStorage.setItem(localStorageKey, JSON.stringify(newGoals));
  };

  const toggleGoal = (id: string) => {
    // If it is the journal entry goal, prevent checking it manually if they didn't write an entry,
    // or let it auto-toggle, but it's best to allow manual toggle if they prefer,
    // though auto-checking is nicer. Let's make it toggleable but warn or just let them check it.
    const updated = goals.map((g) =>
      g.id === id ? { ...g, completed: !g.completed } : g
    );
    saveGoals(updated);
  };

  const addGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;

    const newGoal: Goal = {
      id: `custom-${Date.now()}`,
      text: newGoalText.trim(),
      completed: false,
      isCustom: true,
    };

    const updated = [...goals, newGoal];
    saveGoals(updated);
    setNewGoalText("");
  };

  const deleteGoal = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    saveGoals(updated);
  };

  const completedCount = goals.filter((g) => g.completed).length;
  const totalCount = goals.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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
            <span>Daily Progress</span>
            <span>{percentage}%</span>
          </div>
        </div>

        {/* Goals List */}
        <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-500/5 dark:bg-white/5 hover:bg-slate-500/10 dark:hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-slate-200/50 dark:hover:border-white/5 group"
            >
              <button
                onClick={() => toggleGoal(goal.id)}
                className="flex items-center gap-3 text-left flex-1 min-w-0"
              >
                {goal.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-400 dark:text-gray-500 hover:text-purple-500 transition-colors shrink-0" />
                )}
                <span
                  className={`text-sm font-medium truncate ${
                    goal.completed
                      ? "text-slate-400 dark:text-gray-500 line-through"
                      : "text-slate-700 dark:text-white"
                  }`}
                >
                  {goal.text}
                </span>
              </button>

              <button
                onClick={() => deleteGoal(goal.id)}
                className="text-slate-400 dark:text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                title="Delete Goal"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {goals.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-400 dark:text-gray-500">
              No wellness goals set for today.
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
          placeholder="Add custom wellness goal..."
          className="flex-1 bg-slate-500/5 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
        />
        <button
          type="submit"
          disabled={!newGoalText.trim()}
          className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl disabled:opacity-50 transition-all shrink-0 flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

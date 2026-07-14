"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  ArrowRight,
  Calendar,
  Target,
  Flame,
  Loader2,
} from "lucide-react";
import { useTasks, useGoals } from "@/hooks/use-api";
import { apiFetch } from "@/lib/api/fetcher";
import { motion, AnimatePresence } from "framer-motion";

// ── Helpers ──────────────────────────────────────────────
function formatDateKey(d: Date): string {
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isToday(d: Date): boolean {
  return formatDateKey(d) === formatDateKey(new Date());
}

function isYesterday(d: Date): boolean {
  return formatDateKey(d) === formatDateKey(addDays(new Date(), -1));
}

function friendlyDate(d: Date): string {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

const PRIORITY_CONFIG = {
  HIGH: {
    label: "High",
    dot: "bg-rose-500",
    ring: "ring-rose-500/30",
    text: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  MEDIUM: {
    label: "Medium",
    dot: "bg-amber-400",
    ring: "ring-amber-400/30",
    text: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  LOW: {
    label: "Low",
    dot: "bg-emerald-400",
    ring: "ring-emerald-400/30",
    text: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
};

const GOAL_CATEGORIES = [
  "Health",
  "Career",
  "Personal",
  "Finance",
  "Education",
  "Relationships",
];

// ── Page Component ───────────────────────────────────────
export default function TasksPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateKey = formatDateKey(currentDate);
  const yesterdayKey = formatDateKey(addDays(currentDate, -1));

  // Data hooks
  const { data: tasks, isLoading: tasksLoading, mutate: mutateTasks } = useTasks(dateKey);
  const { data: yesterdayTasks } = useTasks(yesterdayKey);
  const { data: goals, isLoading: goalsLoading, mutate: mutateGoals } = useGoals();

  // Local state
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [newGoalText, setNewGoalText] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState("");
  const [carryingOver, setCarryingOver] = useState(false);
  const [priorityDropdown, setPriorityDropdown] = useState(false);

  // Derived
  const completedTasks = tasks?.filter((t: any) => t.completed).length || 0;
  const totalTasks = tasks?.length || 0;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const incompleteYesterday = useMemo(() => {
    if (!yesterdayTasks) return [];
    return yesterdayTasks.filter((t: any) => !t.completed);
  }, [yesterdayTasks]);

  const completedGoals = goals?.filter((g: any) => g.completed).length || 0;
  const totalGoals = goals?.length || 0;
  const goalProgress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  // ── Handlers ──────────────────────────────────────────
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    try {
      await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ text: newTaskText.trim(), date: dateKey, priority: newTaskPriority }),
      });
      setNewTaskText("");
      setNewTaskPriority("MEDIUM");
      mutateTasks();
    } catch (err) {
      console.error("Failed to add task:", err);
    }
  };

  const handleToggleTask = async (id: string, completed: boolean) => {
    try {
      await apiFetch(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !completed }),
      });
      mutateTasks();
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await apiFetch(`/api/tasks/${id}`, { method: "DELETE" });
      mutateTasks();
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const handleCarryOver = async () => {
    setCarryingOver(true);
    try {
      await apiFetch("/api/tasks/carry-over", {
        method: "POST",
        body: JSON.stringify({ fromDate: yesterdayKey, toDate: dateKey }),
      });
      mutateTasks();
    } catch (err) {
      console.error("Failed to carry over tasks:", err);
    } finally {
      setCarryingOver(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    try {
      await apiFetch("/api/goals", {
        method: "POST",
        body: JSON.stringify({ text: newGoalText.trim(), category: newGoalCategory || null }),
      });
      setNewGoalText("");
      setNewGoalCategory("");
      mutateGoals();
    } catch (err) {
      console.error("Failed to add goal:", err);
    }
  };

  const handleToggleGoal = async (id: string, completed: boolean) => {
    try {
      await apiFetch(`/api/goals/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !completed }),
      });
      mutateGoals();
    } catch (err) {
      console.error("Failed to toggle goal:", err);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await apiFetch(`/api/goals/${id}`, { method: "DELETE" });
      mutateGoals();
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  // ── Render ────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Page Header ─────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
          Daily Tasks
        </h2>
        <p className="text-slate-500 dark:text-gray-400">
          Plan your day, track progress, and achieve your goals.
        </p>
      </div>

      {/* ── Date Navigator ───────────────────── */}
      <div className="flex items-center justify-between bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl px-5 py-4 shadow-xs backdrop-blur-xl">
        <button
          onClick={() => setCurrentDate(addDays(currentDate, -1))}
          className="p-2 hover:bg-slate-500/10 dark:hover:bg-white/10 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-gray-300" />
        </button>

        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 justify-center">
            <Calendar className="w-5 h-5 text-purple-500" />
            {friendlyDate(currentDate)}
          </h3>
          <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">
            {currentDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <button
          onClick={() => setCurrentDate(addDays(currentDate, 1))}
          disabled={isToday(currentDate)}
          className="p-2 hover:bg-slate-500/10 dark:hover:bg-white/10 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5 text-slate-600 dark:text-gray-300" />
        </button>
      </div>

      {/* ── Carry Over Banner ────────────────── */}
      {isToday(currentDate) && incompleteYesterday.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 border border-amber-300/40 dark:border-amber-500/20 rounded-2xl px-5 py-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl">
              <Flame className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                {incompleteYesterday.length} unfinished task
                {incompleteYesterday.length > 1 ? "s" : ""} from yesterday
              </p>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/60">
                Push them to today to keep your momentum going
              </p>
            </div>
          </div>
          <button
            onClick={handleCarryOver}
            disabled={carryingOver}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 rounded-xl text-sm font-medium transition-all border border-amber-400/30 disabled:opacity-50 cursor-pointer"
          >
            {carryingOver ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            Push to Today
          </button>
        </motion.div>
      )}

      {/* ── Main Grid ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Daily Tasks (2 cols) ─────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Add Task Form */}
          <div className="relative overflow-visible z-20 bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-xs backdrop-blur-xl">
            <form onSubmit={handleAddTask} className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="What do you need to do?"
                  className="w-full bg-slate-500/5 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                />
              </div>

              {/* Priority Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPriorityDropdown(!priorityDropdown)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl border transition-all text-sm font-medium cursor-pointer ${
                    PRIORITY_CONFIG[newTaskPriority].bg
                  } border-slate-200 dark:border-white/10 ${
                    PRIORITY_CONFIG[newTaskPriority].text
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${PRIORITY_CONFIG[newTaskPriority].dot}`}
                  />
                  {PRIORITY_CONFIG[newTaskPriority].label}
                </button>

                {priorityDropdown && (
                  <div className="absolute top-full mt-1 right-0 bg-white dark:bg-[#1a1025] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-20 overflow-hidden min-w-[120px]">
                    {(["HIGH", "MEDIUM", "LOW"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setNewTaskPriority(p);
                          setPriorityDropdown(false);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-slate-500/10 dark:hover:bg-white/10 transition-colors text-left cursor-pointer"
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${PRIORITY_CONFIG[p].dot}`}
                        />
                        <span className="text-slate-700 dark:text-gray-200">
                          {PRIORITY_CONFIG[p].label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!newTaskText.trim()}
                className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl disabled:opacity-40 transition-all shrink-0 flex items-center justify-center cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* Progress Bar */}
          {totalTasks > 0 && (
            <div className="bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-xs backdrop-blur-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                  Daily Progress
                </span>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {completedTasks}/{totalTasks} completed
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-white/5 h-2.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${taskProgress}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 h-full rounded-full"
                />
              </div>
              {taskProgress === 100 && totalTasks > 0 && (
                <p className="text-xs text-emerald-500 font-semibold mt-2 text-center">
                  🎉 All tasks completed! Great job!
                </p>
              )}
            </div>
          )}

          {/* Task List */}
          <div className="bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-xs backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-purple-500/15 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                Tasks for {friendlyDate(currentDate)}
              </h3>
            </div>

            {tasksLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              </div>
            ) : !tasks || tasks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 dark:text-gray-500 text-sm">
                  No tasks for this day yet.
                </p>
                <p className="text-slate-400 dark:text-gray-600 text-xs mt-1">
                  Add your first task above to get started!
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-2">
                  {tasks.map((task: any) => {
                    const prioConfig =
                      PRIORITY_CONFIG[
                        task.priority as keyof typeof PRIORITY_CONFIG
                      ] || PRIORITY_CONFIG.MEDIUM;
                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 border group ${
                          task.completed
                            ? "bg-slate-500/3 dark:bg-white/2 border-transparent"
                            : "bg-slate-500/5 dark:bg-white/5 border-transparent hover:border-slate-200/50 dark:hover:border-white/10"
                        }`}
                      >
                        <button
                          onClick={() => handleToggleTask(task.id, task.completed)}
                          className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle
                              className={`w-5 h-5 shrink-0 text-slate-400 dark:text-gray-500 hover:${prioConfig.text} transition-colors`}
                            />
                          )}
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`text-sm font-medium truncate ${
                                task.completed
                                  ? "text-slate-400 dark:text-gray-500 line-through"
                                  : "text-slate-700 dark:text-white"
                              }`}
                            >
                              {task.text}
                            </span>
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${prioConfig.dot}`}
                            />
                            {task.pushedFrom && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md font-medium shrink-0">
                                Carried
                              </span>
                            )}
                          </div>
                        </button>

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-slate-400 dark:text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* ── Long-Term Goals (1 col) ────────── */}
        <div className="space-y-4">
          {/* Goal Progress Ring */}
          <div className="bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-xs backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-emerald-500/15 rounded-lg">
                <Target className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                Long-Term Goals
              </h3>
            </div>

            {/* Mini Progress */}
            {totalGoals > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 dark:text-gray-500">
                    Overall Progress
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {completedGoals}/{totalGoals}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${goalProgress}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Add Goal */}
            <form onSubmit={handleAddGoal} className="space-y-2 mb-4">
              <input
                type="text"
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                placeholder="Add a long-term goal..."
                className="w-full bg-slate-500/5 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
              <div className="flex gap-2">
                <select
                  value={newGoalCategory}
                  onChange={(e) => setNewGoalCategory(e.target.value)}
                  className="flex-1 bg-slate-500/5 dark:bg-[#1a1025] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-600 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                >
                  <option value="" className="bg-white dark:bg-[#1a1025] text-slate-700 dark:text-white">
                    Category (Optional)
                  </option>
                  {GOAL_CATEGORIES.map((c) => (
                    <option
                      key={c}
                      value={c}
                      className="bg-white dark:bg-[#1a1025] text-slate-700 dark:text-white"
                    >
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!newGoalText.trim()}
                  className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-40 transition-all shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Goal List */}
            {goalsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
              </div>
            ) : !goals || goals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 dark:text-gray-500 text-xs">
                  No long-term goals yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {goals.map((goal: any) => (
                  <div
                    key={goal.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-500/5 dark:bg-white/5 hover:bg-slate-500/10 dark:hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-slate-200/50 dark:hover:border-white/5 group"
                  >
                    <button
                      onClick={() => handleToggleGoal(goal.id, goal.completed)}
                      className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                    >
                      {goal.completed ? (
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="w-4.5 h-4.5 text-slate-400 dark:text-gray-500 hover:text-emerald-500 transition-colors shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span
                          className={`text-xs font-medium truncate block ${
                            goal.completed
                              ? "text-slate-400 dark:text-gray-500 line-through"
                              : "text-slate-700 dark:text-white"
                          }`}
                        >
                          {goal.text}
                        </span>
                        {goal.category && (
                          <span className="text-[10px] text-purple-500 dark:text-purple-400 font-medium">
                            {goal.category}
                          </span>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-slate-400 dark:text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

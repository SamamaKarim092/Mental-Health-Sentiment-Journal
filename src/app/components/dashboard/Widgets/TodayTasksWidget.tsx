"use client";

import { useState } from "react";
import Link from "next/link";
import { useTasks } from "@/hooks/use-api";
import { apiFetch } from "@/lib/api/fetcher";
import { useSWRConfig } from "swr";
import {
  ListTodo,
  CheckCircle2,
  Circle,
  Plus,
  ArrowUpRight,
  Loader2,
  Trash2,
} from "lucide-react";

function formatDateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

const PRIORITY_DOTS: Record<string, string> = {
  HIGH: "bg-rose-500",
  MEDIUM: "bg-amber-400",
  LOW: "bg-emerald-400",
};

export default function TodayTasksWidget() {
  const todayKey = formatDateKey(new Date());
  const { data: tasks, isLoading, mutate: mutateTasks } = useTasks(todayKey);
  const { mutate: globalMutate } = useSWRConfig();

  const [newTaskText, setNewTaskText] = useState("");
  const [adding, setAdding] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const taskList = tasks || [];
  const completedCount = taskList.filter((t: any) => t.completed).length;
  const totalCount = taskList.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || adding) return;

    setAdding(true);
    try {
      await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          text: newTaskText.trim(),
          date: todayKey,
          priority: "MEDIUM",
        }),
      });
      setNewTaskText("");
      mutateTasks();
      globalMutate((key) => typeof key === "string" && key.startsWith("/api/entries"));
    } catch (err) {
      console.error("Failed to add task from widget:", err);
    } finally {
      setAdding(false);
    }
  };

  const handleToggleTask = async (id: string, completed: boolean) => {
    setTogglingId(id);
    try {
      await apiFetch(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !completed }),
      });
      mutateTasks();
      globalMutate((key) => typeof key === "string" && key.startsWith("/api/entries"));
    } catch (err) {
      console.error("Failed to toggle task:", err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await apiFetch(`/api/tasks/${id}`, { method: "DELETE" });
      mutateTasks();
      globalMutate((key) => typeof key === "string" && key.startsWith("/api/entries"));
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

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
            <ListTodo className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Today&apos;s To-Do
          </h3>
          <Link
            href="/dashboard/tasks"
            className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Progress Bar */}
        {totalCount > 0 && (
          <div className="mb-5 space-y-2">
            <div className="w-full bg-slate-200 dark:bg-white/5 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-600 to-pink-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">
              <span>Progress</span>
              <span>
                {completedCount}/{totalCount} ({percentage}%)
              </span>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
          {taskList.map((task: any) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-500/5 dark:bg-white/5 hover:bg-slate-500/10 dark:hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-slate-200/50 dark:hover:border-white/5 group"
            >
              <button
                onClick={() => handleToggleTask(task.id, task.completed)}
                disabled={togglingId === task.id}
                className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
              >
                {togglingId === task.id ? (
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin shrink-0" />
                ) : task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-400 dark:text-gray-500 hover:text-purple-500 transition-colors shrink-0" />
                )}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className={`text-sm font-medium truncate ${
                      task.completed
                        ? "text-slate-400 dark:text-gray-500 line-through"
                        : "text-slate-700 dark:text-white"
                    }`}
                  >
                    {task.text}
                  </span>
                  {task.priority && (
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        PRIORITY_DOTS[task.priority] || "bg-amber-400"
                      }`}
                      title={`${task.priority} priority`}
                    />
                  )}
                </div>
              </button>

              <button
                onClick={() => handleDeleteTask(task.id)}
                className="text-slate-400 dark:text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {taskList.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-400 dark:text-gray-500 bg-slate-500/5 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/5 rounded-xl">
              No to-do items for today yet.
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleAddTask} className="mt-4 flex gap-2">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Add to-do item..."
          className="flex-1 bg-slate-500/5 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
        />
        <button
          type="submit"
          disabled={!newTaskText.trim() || adding}
          className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl disabled:opacity-50 transition-all shrink-0 flex items-center justify-center cursor-pointer"
        >
          {adding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}

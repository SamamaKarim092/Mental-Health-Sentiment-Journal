"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Book,
  FileText,
  TrendingUp,
  BrainCircuit,
  Settings,
  LogOut,
  MessageCircle,
  ListTodo,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/context";
import { useMood } from "@/app/context/MoodContext";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Book, label: "Journal", href: "/dashboard/journal" },
  { icon: MessageCircle, label: "AI Coach", href: "/dashboard/chat" },
  { icon: FileText, label: "Entries", href: "/dashboard/entries" },
  { icon: ListTodo, label: "Tasks", href: "/dashboard/tasks" },
  { icon: TrendingUp, label: "Trends", href: "/dashboard/trends" },
  { icon: BrainCircuit, label: "Analysis", href: "/dashboard/analysis" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const { currentMood } = useMood();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "w-64 bg-white/45 dark:bg-black/40 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-white flex flex-col h-screen",
          // Desktop: always visible
          "hidden md:flex md:sticky md:top-0",
          // Mobile: slide-in drawer
          mobileOpen &&
            "!flex fixed top-0 left-0 z-50 shadow-2xl shadow-black/50",
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <img
              src="/Logo.png"
              alt="Mindful Space Logo"
              className="h-8 object-contain transition-transform group-hover:scale-105"
            />
            <img
              src="/Logo text.png"
              alt="Mindful Space"
              className="h-5 object-contain dark:invert mt-1 transition-opacity opacity-90 group-hover:opacity-100"
            />
          </Link>
          {/* Mobile close button */}
          {mobileOpen && (
            <button
              onClick={onClose}
              className="md:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-500/10 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                  isActive
                    ? "bg-slate-500/10 dark:bg-white/10 text-slate-800 dark:text-white"
                    : "text-slate-500 dark:text-gray-400 hover:bg-slate-500/5 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors duration-500",
                    isActive ? currentMood.accent : "text-slate-400 dark:text-gray-400",
                  )}
                  style={
                    !isActive
                      ? ({
                          "--hover-color": "var(--accent-color)",
                        } as React.CSSProperties)
                      : undefined
                  }
                />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200/80 dark:border-white/10">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-500 dark:text-gray-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

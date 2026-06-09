"use client";

import { useAuth } from "@/lib/auth/context";
import { useMood } from "@/app/context/MoodContext";
import { Bell, Search, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { user } = useAuth();
  const { currentMood } = useMood();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/entries?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="h-16 border-b border-slate-200/80 dark:border-white/10 bg-white/50 dark:bg-[#0F0714]/50 backdrop-blur-xl sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-500/10 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-500 ${currentMood.accent}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries..."
            className="w-full bg-slate-500/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 transition-all duration-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10"
          />
        </form>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-500/10 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full border-2 border-[#f6f1eb] dark:border-[#0F0714]" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200/80 dark:border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-800 dark:text-white">
              {user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
            </p>
            <p className="text-xs text-slate-500 dark:text-gray-400">Free Plan</p>
          </div>
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-white/10 shadow-lg shadow-purple-500/20"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20">
              {(user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email)?.[0]?.toUpperCase() || "U"}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

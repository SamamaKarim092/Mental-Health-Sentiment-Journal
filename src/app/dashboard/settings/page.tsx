"use client";

import { useState, useEffect } from "react";
import { User, Download, LogOut, Shield, Info, Lock, Sun, Moon, Bell, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { apiFetch } from "@/lib/api/fetcher";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Reminder settings state
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("20:00");
  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderSaved, setReminderSaved] = useState(false);

  // Load display name & reminder settings
  useEffect(() => {
    if (user) {
      setDisplayName(
        user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "",
      );
      apiFetch("/api/user/reminders")
        .then((res) => {
          if (res) {
            setReminderEnabled(res.reminderEnabled ?? true);
            setReminderTime(res.reminderTime || "20:00");
          }
        })
        .catch((err) => console.error("Failed to load reminders:", err));
    }
  }, [user]);

  const handleUpdateReminders = async (enabled: boolean, time: string) => {
    setReminderSaving(true);
    setReminderSaved(false);
    try {
      await apiFetch("/api/user/reminders", {
        method: "POST",
        body: JSON.stringify({ reminderEnabled: enabled, reminderTime: time }),
      });
      setReminderSaved(true);
      setTimeout(() => setReminderSaved(false), 2500);
    } catch (err) {
      console.error("Failed to update reminders:", err);
    } finally {
      setReminderSaving(false);
    }
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error(
          "Supabase environment variables are missing. Profile updates are unavailable.",
        );
      }

      await supabase.auth.updateUser({
        data: { display_name: displayName },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) return;
    setPasswordSaving(true);
    setPasswordSaved(false);
    setPasswordError("");
    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error(
          "Supabase environment variables are missing. Password updates are unavailable.",
        );
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (!error) {
        setPasswordSaved(true);
        setNewPassword("");
        setTimeout(() => setPasswordSaved(false), 3000);
      } else {
        setPasswordError(error.message || "Failed to update password.");
        console.error("Failed to change password:", error.message);
      }
    } catch (err: any) {
      setPasswordError(err?.message || "An unexpected error occurred.");
      console.error("Failed to change password:", err);
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const entries = await apiFetch("/api/entries");
      const data = {
        exportedAt: new Date().toISOString(),
        email: user?.email,
        totalEntries: entries.length,
        entries: entries.map((e: any) => ({
          title: e.title,
          content: e.content,
          moods: e.moods?.map((m: any) => m.label) || [],
          sentiment: e.sentiment,
          createdAt: e.createdAt,
        })),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mindful-journal-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export data:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Settings</h2>
        <p className="text-slate-500 dark:text-gray-400">Manage your account preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <section className="bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-xs">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Profile Information
          </h3>
          <div className="flex items-start gap-6">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border border-slate-200 dark:border-white/10 shadow-lg shadow-purple-500/20 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-purple-500/20 shrink-0">
                {((user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email)?.[0] || "U").toUpperCase()}
              </div>
            )}
            <div className="space-y-4 flex-1 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-gray-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full bg-slate-500/5 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-gray-400 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-slate-500/5 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <button
                onClick={handleUpdateProfile}
                disabled={saving}
                className="px-4 py-2 bg-purple-550/10 dark:bg-purple-500/20 hover:bg-purple-500/20 dark:hover:bg-purple-500/30 text-purple-700 dark:text-purple-300 rounded-xl text-sm font-medium transition-colors border border-purple-200/50 dark:border-purple-500/20 disabled:opacity-50"
              >
                {saving ? "Saving..." : saved ? "✓ Saved!" : "Update Profile"}
              </button>
            </div>
          </div>
        </section>

        {/* Appearance Mode Section */}
        <section className="bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-xs">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500 dark:text-yellow-400" />
            Appearance
          </h3>
          <div className="space-y-4">
            <div className="max-w-md">
              <p className="text-sm text-slate-500 dark:text-gray-400 mb-3">
                Customize how Mindful Space looks on your device.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                    resolvedTheme === "light"
                      ? "bg-white border-purple-500 text-purple-600 shadow-sm font-semibold"
                      : "bg-slate-550/5 border-slate-200 text-slate-500 hover:bg-slate-500/10"
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  Light Mode
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                    resolvedTheme === "dark"
                      ? "bg-black/40 border-purple-500 text-purple-400 shadow-sm font-semibold"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  <Moon className="w-4 h-4 text-purple-400" />
                  Dark Mode
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Daily Reminders Section */}
        <section className="bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-xs">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Daily Journaling Reminders
          </h3>
          <div className="space-y-4 max-w-md">
            <div className="flex items-center justify-between p-4 bg-slate-500/5 dark:bg-black/20 rounded-xl border border-slate-200/50 dark:border-white/5">
              <div>
                <p className="text-slate-800 dark:text-white font-medium">Daily Email Reminder</p>
                <p className="text-sm text-slate-500 dark:text-gray-400">
                  Receive a daily email prompt to write your journal
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setReminderEnabled(enabled);
                    handleUpdateReminders(enabled, reminderTime);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {reminderEnabled && (
              <div className="flex items-center justify-between p-4 bg-slate-500/5 dark:bg-black/20 rounded-xl border border-slate-200/50 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-slate-800 dark:text-white">Reminder Time</span>
                </div>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => {
                    const time = e.target.value;
                    setReminderTime(time);
                    handleUpdateReminders(reminderEnabled, time);
                  }}
                  className="bg-slate-500/10 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                />
              </div>
            )}

            {reminderSaved && (
              <p className="text-xs font-semibold text-emerald-500">✓ Reminder preferences saved!</p>
            )}
          </div>
        </section>

        {/* Security Section (Change Password) */}
        <section className="bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-xs">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Security
          </h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-gray-400 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                className="w-full bg-slate-500/5 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-800 dark:text-white focus:outline-none focus:border-purple-500/50"
              />
              {passwordError && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{passwordError}</p>
              )}
            </div>
            <button
              onClick={handleChangePassword}
              disabled={passwordSaving || newPassword.length < 6}
              className="px-4 py-2 bg-indigo-500/10 dark:bg-indigo-500/20 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 rounded-xl text-sm font-medium transition-colors border border-indigo-200/50 dark:border-indigo-500/20 disabled:opacity-50"
            >
              {passwordSaving
                ? "Updating..."
                : passwordSaved
                  ? "✓ Updated!"
                  : "Change Password"}
            </button>
          </div>
        </section>

        {/* Data & Privacy */}
        <section className="bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-xs">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-green-400" />
            Data & Privacy
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-500/5 dark:bg-black/20 rounded-xl border border-slate-200/50 dark:border-white/5">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-slate-500 dark:text-gray-400" />
                <div>
                  <p className="text-slate-800 dark:text-white font-medium">Export Your Data</p>
                  <p className="text-sm text-slate-500 dark:text-gray-500">
                    Download all your journal entries as JSON
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportData}
                disabled={exporting}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-white bg-slate-500/10 dark:bg-white/5 hover:bg-slate-550/20 dark:hover:bg-white/10 rounded-xl transition-colors border border-slate-200 dark:border-white/10 disabled:opacity-50"
              >
                {exporting ? "Exporting..." : "Export"}
              </button>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-500/5 rounded-xl border border-blue-200/50 dark:border-blue-500/10">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Your data is stored securely and is only accessible to you.
                  All journal entries are private and encrypted in transit.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Account Actions */}
        <section className="bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-xs">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-red-600 dark:text-red-400" />
            Account
          </h3>
          <div className="space-y-4">
            <button
              onClick={() => signOut()}
              className="w-full flex items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-200/50 dark:border-red-500/10 hover:bg-red-500/10 transition-colors group"
            >
              <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Sign Out
              </span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

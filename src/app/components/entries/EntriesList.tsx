"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Calendar,
  MoreHorizontal,
  Smile,
  Frown,
  Meh,
  CloudRain,
  Zap,
  Edit,
  Trash2,
  Loader2,
  Coffee,
  Heart,
  Flame,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { useEntries } from "@/hooks/use-api";
import {
  deleteEntry as apiDeleteEntry,
  updateEntry as apiUpdateEntry,
} from "@/lib/api/mutations";

// Mood label config — matches your 8 project moods
const MOOD_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  Happy: { icon: Smile, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  Neutral: { icon: Meh, color: "text-purple-400", bg: "bg-purple-400/10" },
  Sad: { icon: Frown, color: "text-blue-400", bg: "bg-blue-400/10" },
  Anxious: {
    icon: CloudRain,
    color: "text-purple-300",
    bg: "bg-purple-300/10",
  },
  Energetic: { icon: Zap, color: "text-orange-400", bg: "bg-orange-400/10" },
  Calm: { icon: Coffee, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  Grateful: { icon: Heart, color: "text-pink-400", bg: "bg-pink-400/10" },
  Angry: { icon: Flame, color: "text-red-500", bg: "bg-red-500/10" },
};

const DEFAULT_MOOD = {
  icon: Sparkles,
  color: "text-gray-400",
  bg: "bg-gray-400/10",
};

// Helper to get the primary mood label for an entry
function getPrimaryMoodLabel(entry: any): string {
  if (entry.moodLabels && entry.moodLabels.length > 0) {
    // First look for a predefined mood in the labels
    const predefined = entry.moodLabels.find((l: string) => MOOD_CONFIG[l]);
    if (predefined) return predefined;
    // Otherwise return first label
    return entry.moodLabels[0];
  }
  // Fallback to old mood enum
  if (entry.mood === "POSITIVE") return "Happy";
  if (entry.mood === "NEGATIVE") return "Sad";
  return "Neutral";
}

export default function EntriesList({
  initialSearch = "",
}: {
  initialSearch?: string;
}) {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedMood, setSelectedMood] = useState("All");
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const { data, isLoading: loading, error } = useEntries();

  const allEntries = data || [];

  const filteredEntries = allEntries.filter((entry: any) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(entry.tags) ? entry.tags : []).some((tag: string) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    // Filter by moodLabels array (case-insensitive match)
    const matchesMood =
      selectedMood === "All" ||
      (entry.moodLabels &&
        entry.moodLabels.some(
          (label: string) => label.toLowerCase() === selectedMood.toLowerCase(),
        )) ||
      // Fallback: check old mood enum for entries without moodLabels
      (!entry.moodLabels?.length &&
        ((selectedMood === "Happy" && entry.mood === "POSITIVE") ||
          (selectedMood === "Sad" && entry.mood === "NEGATIVE") ||
          (selectedMood === "Neutral" && entry.mood === "NEUTRAL")));
    return matchesSearch && matchesMood;
  });

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      try {
        await apiDeleteEntry(id);
        setShowMenu(null);
      } catch (err) {
        console.error("Failed to delete entry:", err);
        alert("Failed to delete entry. Please try again.");
      }
    }
  };

  const handleUpdate = async () => {
    if (!editingEntry) return;

    try {
      await apiUpdateEntry(editingEntry.id, {
        title: editingEntry.title,
        content: editingEntry.content,
        mood: editingEntry.mood,
        tags: editingEntry.tags,
      });
      setEditingEntry(null);
    } catch (err) {
      console.error("Failed to update entry:", err);
      alert("Failed to update entry. Please try again.");
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showMenu) {
        setShowMenu(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showMenu]);

  const moods = [
    "All",
    "Happy",
    "Neutral",
    "Sad",
    "Anxious",
    "Energetic",
    "Calm",
    "Grateful",
    "Angry",
  ];

  return (
    <div className="space-y-6">
      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0F0714] border border-white/20 rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-4">
              Edit Entry
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400">
                  Title
                </label>
                <input
                  type="text"
                  value={editingEntry.title}
                  onChange={(e) =>
                    setEditingEntry({ ...editingEntry, title: e.target.value })
                  }
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">
                  Content
                </label>
                <textarea
                  value={editingEntry.content}
                  onChange={(e) =>
                    setEditingEntry({
                      ...editingEntry,
                      content: e.target.value,
                    })
                  }
                  className="w-full h-48 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white mt-2 resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={editingEntry.tags.join(", ")}
                  onChange={(e) =>
                    setEditingEntry({
                      ...editingEntry,
                      tags: e.target.value.split(",").map((t) => t.trim()),
                    })
                  }
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white mt-2"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => setEditingEntry(null)}
                  className="px-6 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-6 py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 transition-opacity"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search entries by title, content, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 transition-all"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {moods.map((mood) => (
            <button
              key={mood}
              onClick={() => setSelectedMood(mood)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedMood === mood
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          Failed to load entries. Please refresh the page.
        </div>
      )}

      {/* Entries Grid */}
      <div className="grid grid-cols-1 gap-4">
        {!loading && !error && filteredEntries.length > 0 ? (
          filteredEntries.map((entry: any) => {
            const primaryLabel = getPrimaryMoodLabel(entry);
            const config = MOOD_CONFIG[primaryLabel] || DEFAULT_MOOD;
            const MoodIcon = config.icon;
            const moodColor = config.color;
            const moodBg = config.bg;
            const formattedDate = format(
              new Date(entry.createdAt),
              "MMM dd, yyyy • h:mm a",
            );

            return (
              <div
                key={entry.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all group relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${moodBg} ${moodColor}`}>
                      <MoodIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                        {entry.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span suppressHydrationWarning>{formattedDate}</span>
                        <span className="w-1 h-1 bg-gray-600 rounded-full" />
                        <span className={moodColor}>{primaryLabel}</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(showMenu === entry.id ? null : entry.id);
                      }}
                      className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {showMenu === entry.id && (
                      <div className="absolute right-0 top-12 bg-[#0F0714] border border-white/20 rounded-xl shadow-2xl overflow-hidden z-10 min-w-[150px]">
                        <button
                          onClick={() => {
                            setEditingEntry(entry);
                            setShowMenu(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-gray-300 leading-relaxed mb-4">
                  {entry.content}
                </p>

                {/* Attached Images / Files */}
                {entry.attachments && entry.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-4 pt-2 border-t border-white/5">
                    {entry.attachments.map((att: any, attIdx: number) => {
                      const isImg = att.fileType?.startsWith('image') || att.fileUrl?.startsWith('data:image') || /\.(png|jpg|jpeg|webp|gif)$/i.test(att.fileUrl);
                      return isImg ? (
                        <a
                          key={att.id || attIdx}
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all group/img"
                        >
                          <img
                            src={att.fileUrl}
                            alt={att.fileName || 'Attachment'}
                            className="max-h-48 max-w-xs object-cover group-hover/img:scale-105 transition-transform duration-300"
                          />
                        </a>
                      ) : (
                        <a
                          key={att.id || attIdx}
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-purple-300 transition-all"
                        >
                          <span>📎</span>
                          <span className="truncate max-w-[200px]">{att.fileName || att.fileUrl}</span>
                        </a>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Mood label chips */}
                  {entry.moodLabels &&
                    entry.moodLabels.length > 0 &&
                    entry.moodLabels.map((label: string) => {
                      const mc = MOOD_CONFIG[label];
                      return (
                        <span
                          key={label}
                          className={`text-xs px-3 py-1.5 rounded-full border border-white/10 ${mc ? `${mc.bg} ${mc.color}` : "bg-white/5 text-gray-400"}`}
                        >
                          {label}
                        </span>
                      );
                    })}
                  {/* Tags */}
                  {entry.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-gray-400 border border-white/10 hover:border-purple-500/30 transition-colors cursor-default"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })
        ) : !loading && !error && filteredEntries.length === 0 ? (
          <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              No entries found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

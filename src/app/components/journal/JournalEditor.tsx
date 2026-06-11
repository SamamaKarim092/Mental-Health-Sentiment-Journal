"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMood } from "@/app/context/MoodContext";
import {
  Smile,
  Frown,
  Meh,
  CloudRain,
  Zap,
  Save,
  Tag,
  Heart,
  Coffee,
  Sparkles,
  Flame,
} from "lucide-react";
import { detectMoodFromText } from "@/lib/mood-detection";
import CoachBubble from "./CoachBubble";
import {
  createEntry as apiCreateEntry,
  suggestMood as apiSuggestMood,
} from "@/lib/api/mutations";

const moods = [
  {
    icon: Smile,
    label: "Happy",
    value: "POSITIVE",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/20",
    animation: "animate-bounce-gentle",
  },
  {
    icon: Meh,
    label: "Neutral",
    value: "NEUTRAL",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20",
    animation: "",
  },
  {
    icon: Frown,
    label: "Sad",
    value: "NEGATIVE",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
    animation: "animate-drop-tear",
  },
  {
    icon: CloudRain,
    label: "Anxious",
    value: "NEGATIVE",
    color: "text-purple-300",
    bg: "bg-purple-300/10",
    border: "border-purple-300/20",
    animation: "animate-shake-subtle",
  },
  {
    icon: Zap,
    label: "Energetic",
    value: "POSITIVE",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/20",
    animation: "animate-pulse-glow",
  },
  {
    icon: Coffee,
    label: "Calm",
    value: "NEUTRAL",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    animation: "animate-breathe",
  },
  {
    icon: Heart,
    label: "Grateful",
    value: "POSITIVE",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
    border: "border-pink-400/20",
    animation: "animate-heartbeat",
  },
  {
    icon: Flame,
    label: "Angry",
    value: "NEGATIVE",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    animation: "animate-shake-subtle",
  },
];

const REFLECTION_PROMPTS = [
  "What made you smile today?",
  "What is a challenge you faced today, and how did you handle it?",
  "Describe a moment where you felt at peace.",
  "What is something you learned about yourself recently?",
  "Who are you grateful for today and why?",
  "What is one thing you want to let go of?",
  "How did you take care of yourself today?",
  "What are you looking forward to tomorrow?",
];

export default function JournalEditor() {
  const router = useRouter();
  const { currentMood, setMood, setMoods, setMoodByColorCategory } = useMood();
  const [selectedMoods, setSelectedMoods] = useState<
    Array<(typeof moods)[0] & { color_category?: string; animation?: string }>
  >([]); // Track color categories for AI moods
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [suggestedMood, setSuggestedMood] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<
    Array<{ label: string; color_category: string }>
  >([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(REFLECTION_PROMPTS[0]);

  // Coach Bubble state
  const [showCoachBubble, setShowCoachBubble] = useState(false);
  const [coachSuggestion, setCoachSuggestion] = useState("");
  const [detectedEmotion, setDetectedEmotion] = useState("");

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  // Sync with global mood and dispatch events
  useEffect(() => {
    // Map color categories to companion mood names
    const colorCategoryToCompanionMood: Record<string, string> = {
      YELLOW: "HAPPY",
      BLUE: "SAD",
      ORANGE: "ENERGETIC",
      PURPLE: "ANXIOUS",
      GREEN: "HAPPY",
      PINK: "GRATEFUL",
      RED: "ANGRY",
    };

    if (selectedMoods.length > 0) {
      // For each selected mood, check if it has a color_category (AI mood)
      // If it does, use setMoodByColorCategory, otherwise use label
      const primaryMood = selectedMoods[0];

      if (primaryMood.color_category) {
        // AI mood with color category - use it for background
        setMoodByColorCategory(primaryMood.label, primaryMood.color_category);

        // Dispatch event with the MAPPED mood name for companion
        const companionMood =
          colorCategoryToCompanionMood[primaryMood.color_category] || "NEUTRAL";
        window.dispatchEvent(
          new CustomEvent("moodUpdate", { detail: { mood: companionMood } }),
        );
      } else {
        // Regular hardcoded mood
        const moodLabels = selectedMoods
          .filter((m) => !m.color_category)
          .map((m) => m.label);
        if (moodLabels.length > 0) {
          setMoods(moodLabels);
        }

        // Dispatch event with primary mood label
        window.dispatchEvent(
          new CustomEvent("moodUpdate", {
            detail: { mood: primaryMood.label },
          }),
        );
      }
    } else if (suggestedMood) {
      // If no moods selected but there's a suggestion, use it
      setMood(suggestedMood);
      window.dispatchEvent(
        new CustomEvent("moodUpdate", { detail: { mood: suggestedMood } }),
      );
    } else {
      // Default to NEUTRAL
      setMood("NEUTRAL");
      window.dispatchEvent(
        new CustomEvent("moodUpdate", { detail: { mood: "NEUTRAL" } }),
      );
    }
  }, [suggestedMood, selectedMoods, setMood, setMoods, setMoodByColorCategory]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("wordCountUpdate", {
        detail: { count: wordCount, charCount: content.length },
      }),
    );
  }, [wordCount, content]);

  const getEncouragement = () => {
    if (wordCount === 0) return "Ready to listen...";
    if (wordCount < 10) return "Great start...";
    if (wordCount < 30) return "Keep flowing...";
    if (wordCount < 50) return "You're doing great!";
    return "Excellent depth!";
  };

  const getActiveMoodStyle = () => {
    // Prioritize suggested mood, then first selected mood
    const moodLabel =
      suggestedMood ||
      (selectedMoods.length > 0 ? selectedMoods[0].label : null);
    if (!moodLabel) return null;
    return moods.find((m) => m.label.toLowerCase() === moodLabel.toLowerCase());
  };

  const activeMoodStyle = getActiveMoodStyle();

  const shufflePrompt = () => {
    const currentIndex = REFLECTION_PROMPTS.indexOf(currentPrompt);
    const nextIndex = (currentIndex + 1) % REFLECTION_PROMPTS.length;
    setCurrentPrompt(REFLECTION_PROMPTS[nextIndex]);
  };

  // Live Mood Detection Effect - Triggers 1 second after user stops typing
  // Analyzes both title and content for mood keywords
  // Live Mood Detection Effect - Triggers 1 second after user stops typing
  // Analyzes both title and content for mood keywords
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      // Check individual fields
      const hasContent = content.trim().length > 0;
      const hasTitle = title.trim().length > 0;

      if (!hasContent && !hasTitle) {
        // Need at least some text to suggest a mood
        setSuggestedMood(null);
        setAiSuggestions([]);
        return;
      }

      // Combine for local keyword detection (still useful)
      const combinedText = `${title} ${content}`.trim();

      if (combinedText.length < 5) {
        return;
      }

      // First try keyword detection (instant feedback)
      const keywordMood = detectMoodFromText(combinedText);
      setSuggestedMood(keywordMood); // Show keyword suggestion if available

      // Always call AI for additional suggestions
      console.log("🤖 Calling AI for mood suggestions...");
      setIsLoadingAI(true);
      try {
        const result = await apiSuggestMood(content.trim(), title.trim());

        const suggestions = result?.suggestions || [];
        console.log("🎯 AI returned suggestions:", suggestions);
        setAiSuggestions(suggestions);
      } catch (error) {
        console.error("❌ AI mood suggestion error:", error);
        setAiSuggestions([]);
      } finally {
        setIsLoadingAI(false);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("Please fill in both title and content");
      return;
    }

    setIsSaving(true);
    try {
      const tagsArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Map color categories to predefined mood names
      const colorCategoryToMoodName: Record<string, string> = {
        YELLOW: "Happy",
        BLUE: "Sad",
        ORANGE: "Energetic",
        PURPLE: "Neutral",
        GREEN: "Calm",
        PINK: "Grateful",
        RED: "Angry",
      };

      // Predefined mood names
      const predefinedMoodNames = [
        "Happy",
        "Neutral",
        "Sad",
        "Anxious",
        "Energetic",
        "Calm",
        "Grateful",
        "Angry",
      ];

      // For custom AI moods, also add the mapped predefined mood
      const mappedMoods = new Set<string>();
      for (const m of selectedMoods) {
        // If it's a predefined mood, just add it
        if (predefinedMoodNames.includes(m.label)) {
          mappedMoods.add(m.label);
        } else if (m.color_category) {
          // Custom AI mood — add the mapped predefined mood first, then the custom label
          const mapped = colorCategoryToMoodName[m.color_category];
          if (mapped) mappedMoods.add(mapped);
          mappedMoods.add(m.label);
        } else {
          mappedMoods.add(m.label);
        }
      }
      const moodLabels = Array.from(mappedMoods);

      // Determine which mood to save as primary and capture any custom AI mood labels
      const customMoodLabel = selectedMoods.find(
        (m) =>
          m.value === "NEUTRAL" &&
          !moods.some((hardcoded) => hardcoded.label === m.label),
      )?.label;

      // Only save hardcoded mood if a hardcoded mood was actually selected
      const hardcodedMood = selectedMoods.find((m) =>
        moods.some((hardcoded) => hardcoded.label === m.label),
      );

      setLoading(true);
      setError(null);
      await apiCreateEntry({
        title: title.trim(),
        content: content.trim(),
        mood: hardcodedMood ? hardcodedMood.value : undefined,
        customMoodLabel: customMoodLabel || null,
        moodLabels: moodLabels,
        tags: tagsArray,
      });

      // Reset form on success
      setTitle("");
      setContent("");
      setTags("");
      setSelectedMoods([]);
      setAiSuggestions([]);
      router.push("/dashboard/journal");
    } catch (err) {
      console.error("Submit error:", err);
      setError(err instanceof Error ? err : new Error("Failed to save entry"));
    } finally {
      setLoading(false);
      setIsSaving(false);
    }
  };

  // Handle "Wanna talk about it?" - save and redirect to chat
  const handleTalkAboutIt = async () => {
    if (!title.trim() && !content.trim()) {
      // Nothing to talk about yet
      return;
    }

    setIsSaving(true);
    try {
      // Prepare entry data
      const tagsArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Map custom AI moods to predefined moods (same logic as handleSubmit)
      const colorCategoryToMoodName: Record<string, string> = {
        YELLOW: "Happy",
        BLUE: "Sad",
        ORANGE: "Energetic",
        PURPLE: "Neutral",
        GREEN: "Calm",
        PINK: "Grateful",
        RED: "Angry",
      };
      const predefinedMoodNames = [
        "Happy",
        "Neutral",
        "Sad",
        "Anxious",
        "Energetic",
        "Calm",
        "Grateful",
        "Angry",
      ];
      const mappedMoods = new Set<string>();
      for (const m of selectedMoods) {
        if (predefinedMoodNames.includes(m.label)) {
          mappedMoods.add(m.label);
        } else if (m.color_category) {
          const mapped = colorCategoryToMoodName[m.color_category];
          if (mapped) mappedMoods.add(mapped);
          mappedMoods.add(m.label);
        } else {
          mappedMoods.add(m.label);
        }
      }
      const moodLabels = Array.from(mappedMoods);
      const customMoodLabel = selectedMoods.find(
        (m) =>
          m.value === "NEUTRAL" &&
          !moods.some((hardcoded) => hardcoded.label === m.label),
      )?.label;
      const hardcodedMood = selectedMoods.find((m) =>
        moods.some((hardcoded) => hardcoded.label === m.label),
      );

      // Save the entry first
      const data = await apiCreateEntry({
        title: title.trim() || "Untitled Entry",
        content: content.trim() || "No content yet...",
        mood: hardcodedMood ? hardcodedMood.value : undefined,
        customMoodLabel: customMoodLabel || null,
        moodLabels: moodLabels,
        tags: tagsArray,
      });

      // Redirect to chat with entry context
      if (data?.id) {
        router.push(`/dashboard/chat?contextEntryId=${data.id}`);
      }
    } catch (err) {
      console.error("Error saving entry for chat:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Show coach bubble when emotional content is detected
  useEffect(() => {
    if (aiSuggestions.length > 0 && content.length > 50) {
      // Check if any detected mood suggests the user might want to talk
      const emotionalMoods = [
        "SAD",
        "ANXIOUS",
        "STRESSED",
        "OVERWHELMED",
        "WORRIED",
        "SCARED",
      ];
      const hasEmotionalMood = aiSuggestions.some((s) =>
        emotionalMoods.some((em) => s.label.toUpperCase().includes(em)),
      );

      // Also show for any mood after enough content
      if (
        hasEmotionalMood ||
        (content.length > 100 && selectedMoods.length > 0)
      ) {
        const primaryMood =
          selectedMoods[0]?.label || aiSuggestions[0]?.label || "something";
        const suggestions: Record<string, string> = {
          SAD: "It sounds like you're going through a tough time. Sometimes talking it out can help.",
          ANXIOUS:
            "I can sense some worry in your words. Would you like to explore these feelings together?",
          STRESSED:
            "That sounds really stressful. Sometimes it helps to talk through what's weighing on you.",
          default: `It seems like you have a lot on your mind about feeling ${primaryMood.toLowerCase()}. I'm here if you want to chat.`,
        };

        const matchedEmotion = Object.keys(suggestions).find(
          (key) => key !== "default" && primaryMood.toUpperCase().includes(key),
        );

        setCoachSuggestion(suggestions[matchedEmotion || "default"]);
        setDetectedEmotion(primaryMood);
        setShowCoachBubble(true);
      }
    }
  }, [aiSuggestions, content.length, selectedMoods]);

  return (
    <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">New Journal Entry</h2>
        <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
          <div className={`w-2 h-2 rounded-full animate-pulse bg-green-500`} />
          <span
            className={`text-xs font-medium uppercase tracking-wider ${wordCount === 0 ? "text-green-400" : "text-gray-400"}`}
          >
            {getEncouragement()}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mood Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              className={`text-sm font-medium transition-colors duration-500 ${currentMood.accent}`}
            >
              How are you feeling?
            </label>
            {isLoadingAI && (
              <span className="text-xs text-purple-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-pulse" />
                AI analyzing...
              </span>
            )}
            {suggestedMood && !isLoadingAI && (
              <span className="text-xs text-purple-400 animate-pulse">
                It sounds like you might be feeling {suggestedMood}...
              </span>
            )}
          </div>

          {/* AI Mood Suggestions Chips */}
          {aiSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 p-4 bg-linear-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl shadow-lg">
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-sm text-purple-300 font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  AI Mood Suggestions
                </span>
                <span className="text-xs text-gray-400">Click to select</span>
              </div>
              <div className="w-full flex flex-wrap gap-2">
                {aiSuggestions.map((suggestion, index) => {
                  const { label, color_category } = suggestion;

                  // Try to match with existing mood, otherwise create custom
                  const matchingMood = moods.find(
                    (m) => m.label.toLowerCase() === label.toLowerCase(),
                  );
                  const Icon = matchingMood?.icon || Sparkles;
                  const isSelected =
                    selectedMoods.find((m) => m.label === label) !== undefined;

                  return (
                    <button
                      key={`${label}-${index}`}
                      type="button"
                      onClick={() => {
                        // Map hardcoded mood labels to their proper color categories
                        const moodToColorCategory: Record<string, string> = {
                          Happy: "YELLOW",
                          Neutral: "PURPLE",
                          Sad: "BLUE",
                          Anxious: "PURPLE",
                          Energetic: "ORANGE",
                          Calm: "GREEN",
                          Grateful: "PINK",
                          Angry: "RED",
                        };

                        if (matchingMood) {
                          // Toggle hardcoded mood
                          if (selectedMoods.find((m) => m.label === label)) {
                            setSelectedMoods(
                              selectedMoods.filter((m) => m.label !== label),
                            );
                          } else {
                            // Use the CORRECT color category for the matching hardcoded mood
                            const correctColorCategory =
                              moodToColorCategory[matchingMood.label] ||
                              color_category;
                            const moodWithColor = {
                              ...matchingMood,
                              color_category: correctColorCategory,
                            };
                            setSelectedMoods([
                              moodWithColor,
                              ...selectedMoods.filter((m) => m.label !== label),
                            ]);
                          }
                        } else {
                          // Create a custom mood object for AI-suggested moods WITH color_category
                          const customMood = {
                            icon: Sparkles,
                            label: label,
                            value: "NEUTRAL",
                            color: "text-purple-400",
                            bg: "bg-purple-400/10",
                            border: "border-purple-400/20",
                            color_category: color_category, // Store the color category!
                            animation: "", // No animation for AI-suggested moods
                            glow: "shadow-[0_0_15px_rgba(192,132,252,0.25)] border-purple-400/40",
                          };
                          // Toggle custom mood - make it PRIMARY (first) when selected
                          if (selectedMoods.find((m) => m.label === label)) {
                            setSelectedMoods(
                              selectedMoods.filter((m) => m.label !== label),
                            );
                          } else {
                            setSelectedMoods([
                              customMood,
                              ...selectedMoods.filter((m) => m.label !== label),
                            ]);
                          }
                        }
                      }}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedMoods.find((m) => m.label === label)
                          ? matchingMood
                            ? `${matchingMood.bg} ${matchingMood.color} border ${matchingMood.border} ring-2 ring-offset-2 ring-offset-[#0F0714]`
                            : "bg-purple-500/20 text-purple-300 border border-purple-400/50 ring-2 ring-purple-500/50 ring-offset-2 ring-offset-[#0F0714]"
                          : "bg-white/5 text-gray-300 hover:bg-purple-500/10 hover:text-purple-300 border border-white/10 hover:border-purple-500/30"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {moods.map((mood) => {
              const Icon = mood.icon;
              const isSelected = selectedMoods.some(
                (m) => m.value === mood.value && m.label === mood.label,
              );
              const isSuggested = suggestedMood === mood.label;

              return (
                <button
                  key={mood.label}
                  type="button"
                  onClick={() => {
                    // Toggle mood in selected moods
                    if (isSelected) {
                      setSelectedMoods(
                        selectedMoods.filter(
                          (m) =>
                            !(m.value === mood.value && m.label === mood.label),
                        ),
                      );
                    } else {
                      // Make this the PRIMARY mood (first) so its color is used for background
                      setSelectedMoods([
                        mood,
                        ...selectedMoods.filter(
                          (m) =>
                            !(m.value === mood.value && m.label === mood.label),
                        ),
                      ]);
                      // Directly update the background color
                      setMood(mood.label);
                    }
                  }}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 ${
                    isSelected
                      ? `${mood.bg} ${mood.border} ${mood.color}`
                      : isSuggested
                        ? "bg-white/10 border-purple-500/50 text-white shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                        : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {isSuggested && !isSelected && (
                    <span className="absolute -top-2 -right-2 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                    </span>
                  )}
                  <Icon
                    className={`w-4 h-4 ${isSelected ? mood.animation : ""}`}
                  />
                  <span className="text-sm font-medium">{mood.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title Input */}
        <div className="space-y-2">
          <label
            className={`text-sm font-medium transition-colors duration-500 ${currentMood.accent}`}
          >
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your day a headline..."
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-black/40 transition-all"
          />
        </div>

        {/* Content Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              className={`text-sm font-medium transition-colors duration-500 ${currentMood.accent}`}
            >
              Reflection
            </label>
            <button
              type="button"
              onClick={shufflePrompt}
              className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Inspire me
            </button>
          </div>
          <div className="relative group">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={currentPrompt}
              className={`w-full h-64 bg-black/20 border rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none transition-all resize-none ${
                activeMoodStyle
                  ? `${activeMoodStyle.border} shadow-[0_0_20px_rgba(0,0,0,0)] focus:shadow-[0_0_20px_rgba(168,85,247,0.1)]`
                  : "border-white/10 focus:border-purple-500/50 focus:bg-black/40"
              }`}
            />
            {/* Word count and encouragement indicator */}
            <div className="absolute bottom-4 right-4 text-xs font-medium transition-all duration-300 opacity-50 group-hover:opacity-100 flex items-center gap-2">
              <span
                className={wordCount > 0 ? "text-purple-400" : "text-gray-600"}
              >
                {getEncouragement()}
              </span>
              <span className="text-gray-600 bg-black/40 px-2 py-1 rounded-md">
                {wordCount} words
              </span>
            </div>
          </div>
        </div>

        {/* Tags Input */}
        <div className="space-y-2">
          <label
            className={`text-sm font-medium transition-colors duration-500 ${currentMood.accent}`}
          >
            Tags
          </label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Add tags separated by commas (e.g., work, family, sleep)"
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-black/40 transition-all"
            />
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 text-green-400 text-sm">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
            Failed to save entry. Please try again.
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-all font-medium text-sm hover:shadow-sm active:scale-[0.98] duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Draft
          </button>
          <button
            type="submit"
            disabled={isSaving || loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-medium text-sm transition-all duration-150 border border-purple-700 dark:border-purple-600 shadow-sm hover:shadow-md active:scale-[0.98] focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSaving || loading ? "Saving..." : "Save Entry"}
          </button>
        </div>
      </form>

      {/* Coach Bubble - appears when emotional content is detected */}
      <CoachBubble
        suggestion={coachSuggestion}
        emotion={detectedEmotion}
        onTalkClick={handleTalkAboutIt}
        onDismiss={() => setShowCoachBubble(false)}
        isVisible={showCoachBubble}
        isLoading={isSaving}
      />
    </div>
  );
}

"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";

export type MoodTheme = {
  name: string;
  baseBg: string;
  gradient1: string;
  gradient2: string;
  accent: string;
};

export const MOOD_THEMES: Record<string, MoodTheme> = {
  // ... (keeping existing themes)
  NEUTRAL: {
    name: "Neutral",
    baseBg: "bg-[#130919]",
    gradient1: "from-purple-900/40",
    gradient2: "to-blue-900/40",
    accent: "text-purple-600 dark:text-purple-400",
  },
  HAPPY: {
    name: "Happy",
    baseBg: "bg-[#251b07]",
    gradient1: "from-yellow-500/50",
    gradient2: "to-orange-500/40",
    accent: "text-amber-600 dark:text-yellow-400",
  },
  GRATEFUL: {
    name: "Grateful",
    baseBg: "bg-[#250719]",
    gradient1: "from-pink-500/50",
    gradient2: "to-rose-400/40",
    accent: "text-pink-600 dark:text-pink-400",
  },
  SAD: {
    name: "Sad",
    baseBg: "bg-[#070e25]",
    gradient1: "from-blue-900/60",
    gradient2: "to-teal-900/40",
    accent: "text-blue-600 dark:text-blue-400",
  },
  REFLECTIVE: {
    name: "Reflective",
    baseBg: "bg-[#0e0725]",
    gradient1: "from-indigo-900/60",
    gradient2: "to-purple-900/40",
    accent: "text-indigo-600 dark:text-indigo-400",
  },
  ANXIOUS: {
    name: "Anxious",
    baseBg: "bg-[#150725]",
    gradient1: "from-violet-500/40",
    gradient2: "to-indigo-900/60",
    accent: "text-violet-600 dark:text-purple-300",
  },
  ENERGETIC: {
    name: "Energetic",
    baseBg: "bg-[#250707]",
    gradient1: "from-orange-600/50",
    gradient2: "to-pink-600/40",
    accent: "text-orange-600 dark:text-orange-400",
  },
  CALM: {
    name: "Calm",
    baseBg: "bg-[#07250e]",
    gradient1: "from-emerald-900/60",
    gradient2: "to-teal-900/40",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  FRUSTRATED: {
    name: "Frustrated",
    baseBg: "bg-[#250707]",
    gradient1: "from-red-600/50",
    gradient2: "to-orange-600/40",
    accent: "text-red-600 dark:text-red-400",
  },
  ANGRY: {
    name: "Angry",
    baseBg: "bg-[#2a0404]",
    gradient1: "from-red-700/60",
    gradient2: "to-rose-600/40",
    accent: "text-red-600 dark:text-red-500",
  },
  LOVING: {
    name: "Loving",
    baseBg: "bg-[#250719]",
    gradient1: "from-pink-500/50",
    gradient2: "to-rose-400/40",
    accent: "text-pink-600 dark:text-pink-400",
  },
};

// Map n8n color categories to mood theme names
export const COLOR_CATEGORY_TO_MOOD: Record<string, string> = {
  YELLOW: "HAPPY", // happiness, contentment, peace, joy (yellow/orange bg)
  BLUE: "SAD", // sadness, melancholy, reflective calmness
  ORANGE: "ENERGETIC", // excitement, energy, enthusiasm (orange bg)
  PURPLE: "REFLECTIVE", // contemplation, introspection, wonder
  RED: "ANGRY", // anger, frustration, intensity
  PINK: "LOVING", // love, affection, caring, warmth
  // Keep GREEN as fallback for backward compatibility
  GREEN: "HAPPY",
};

interface MoodContextType {
  currentMood: MoodTheme;
  selectedMoods: MoodTheme[];
  setMood: (moodName: string) => void;
  setMoods: (moodNames: string[]) => void;
  setMoodByColorCategory: (label: string, colorCategory: string) => void;
}

const MoodContext = createContext<MoodContextType | undefined>(undefined);

export function MoodProvider({ children }: { children: ReactNode }) {
  const [currentMood, setCurrentMoodState] = useState<MoodTheme>(
    MOOD_THEMES.NEUTRAL,
  );
  const [selectedMoods, setSelectedMoods] = useState<MoodTheme[]>([
    MOOD_THEMES.NEUTRAL,
  ]);

  const setMood = useCallback((moodName: string) => {
    const normalizedMood = moodName.toUpperCase();
    if (MOOD_THEMES[normalizedMood]) {
      setCurrentMoodState(MOOD_THEMES[normalizedMood]);
      setSelectedMoods([MOOD_THEMES[normalizedMood]]);
    } else {
      // Fallback for unknown moods from AI
      setCurrentMoodState(MOOD_THEMES.NEUTRAL);
      setSelectedMoods([MOOD_THEMES.NEUTRAL]);
    }
  }, []);

  const setMoods = useCallback((moodNames: string[]) => {
    if (moodNames.length === 0) {
      setCurrentMoodState(MOOD_THEMES.NEUTRAL);
      setSelectedMoods([MOOD_THEMES.NEUTRAL]);
      return;
    }

    const moodThemes = moodNames
      .map((name) => {
        const normalizedMood = name.toUpperCase();
        return MOOD_THEMES[normalizedMood] || null;
      })
      .filter((mood): mood is MoodTheme => mood !== null);

    if (moodThemes.length > 0) {
      setCurrentMoodState(moodThemes[0]);
      setSelectedMoods(moodThemes);
    } else {
      setCurrentMoodState(MOOD_THEMES.NEUTRAL);
      setSelectedMoods([MOOD_THEMES.NEUTRAL]);
    }
  }, []);

  const setMoodByColorCategory = useCallback(
    (label: string, colorCategory: string) => {
      // First try to find an exact match by label name
      const normalizedLabel = label.toUpperCase();
      if (MOOD_THEMES[normalizedLabel]) {
        setCurrentMoodState(MOOD_THEMES[normalizedLabel]);
        setSelectedMoods([MOOD_THEMES[normalizedLabel]]);
        return;
      }

      // If no exact match, use the color category to pick a theme
      const moodName = COLOR_CATEGORY_TO_MOOD[colorCategory] || "NEUTRAL";
      const theme = MOOD_THEMES[moodName];
      setCurrentMoodState(theme);
      setSelectedMoods([theme]);
    },
    [],
  );

  const value = useMemo(
    () => ({
      currentMood,
      selectedMoods,
      setMood,
      setMoods,
      setMoodByColorCategory,
    }),
    [currentMood, selectedMoods, setMood, setMoods, setMoodByColorCategory],
  );

  return <MoodContext.Provider value={value}>{children}</MoodContext.Provider>;
}

export function useMood() {
  const context = useContext(MoodContext);
  if (context === undefined) {
    throw new Error("useMood must be used within a MoodProvider");
  }
  return context;
}

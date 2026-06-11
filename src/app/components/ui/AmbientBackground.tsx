"use client";

import React from "react";
import { useMood } from "@/app/context/MoodContext";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

export default function AmbientBackground() {
  const { currentMood, selectedMoods } = useMood();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || resolvedTheme === "dark";
  const isMixedMood = selectedMoods.length > 1;

  // Create a unique key for the mood combination
  const moodKey = selectedMoods
    .map((m) => m.name)
    .sort()
    .join("-");

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      {/* Base Background with smooth transition */}
      <motion.div
        initial={false}
        animate={{ backgroundColor: getHexForBg(currentMood.baseBg, isDark) }}
        transition={{ duration: 2, ease: "easeInOut" }}
        className="absolute inset-0"
      />

      <AnimatePresence mode="popLayout">
        <motion.div
          key={moodKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
        >
          {isMixedMood ? (
            // Mixed mood: render multiple gradient blobs for each selected mood
            <>
              {selectedMoods.map((mood, index) => {
                const positions = [
                  { top: "-10%", left: "-10%" },
                  { bottom: "-10%", right: "-10%" },
                  { top: "20%", right: "-5%" },
                  { bottom: "20%", left: "-5%" },
                  { top: "50%", left: "50%" },
                ];
                const position = positions[index % positions.length];
                const size =
                  index === 0 ? "60vw" : index === 1 ? "70vw" : "50vw";
                const blur =
                  index === 0 ? "120px" : index === 1 ? "150px" : "100px";
                
                // Softer opacity in light mode
                const opacity = index === 0 
                  ? (isDark ? 0.5 : 0.2) 
                  : index === 1 
                    ? (isDark ? 0.4 : 0.15) 
                    : (isDark ? 0.3 : 0.1);

                return (
                  <div
                    key={`${mood.name}-${index}`}
                    className={`absolute rounded-full bg-linear-to-br ${mood.gradient1} ${mood.gradient2} animate-pulse`}
                    style={{
                      width: size,
                      height: size,
                      ...position,
                      filter: `blur(${blur})`,
                      opacity: opacity,
                      animationDuration: `${8 + index * 2}s`,
                      animationDelay: `${index * 0.5}s`,
                    }}
                  />
                );
              })}
              {/* Center Mixed Glow */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[40vh] rounded-full"
                style={{
                  opacity: isDark ? 0.2 : 0.08,
                  background: `linear-gradient(to right, ${selectedMoods
                    .map(
                      (m) =>
                        `var(--tw-gradient-stops) ${m.gradient1.replace("from-", "")}`,
                    )
                    .join(", ")})`,
                  filter: "blur(180px)",
                }}
              />
            </>
          ) : (
            // Single mood: original blob layout
            <>
              <div
                className={`absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-linear-to-br ${currentMood.gradient1} blur-[120px] animate-pulse`}
                style={{ animationDuration: "8s", opacity: isDark ? 0.8 : 0.25 }}
              />
              <div
                className={`absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-linear-to-tl ${currentMood.gradient2} blur-[150px] animate-pulse`}
                style={{ animationDuration: "12s", animationDelay: "2s", opacity: isDark ? 0.7 : 0.2 }}
              />
              <div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[40vh] rounded-full bg-linear-to-r ${currentMood.gradient1} to-transparent blur-[180px]`}
                style={{ opacity: isDark ? 0.5 : 0.15 }}
              />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Noise Texture Overlay */}
      <div 
        className="absolute inset-0 mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"
        style={{ opacity: isDark ? 0.02 : 0.04 }}
      />
    </div>
  );
}

// Helper to map Tailwind classes to Hex for Framer Motion animation
// Returns dark base colors in dark mode, and warm pastel colors in light mode
function getHexForBg(bgClass: string, isDark: boolean): string {
  if (isDark) {
    const mapping: Record<string, string> = {
      "bg-[#130919]": "#130919",
      "bg-[#251b07]": "#251b07",
      "bg-[#070e25]": "#070e25",
      "bg-[#0e0725]": "#0e0725",
      "bg-[#150725]": "#150725",
      "bg-[#250707]": "#250707",
      "bg-[#07250e]": "#07250e",
      "bg-[#250719]": "#250719", // LOVING mood pink background
      "bg-[#2a0404]": "#2a0404", // ANGRY mood
    };
    return mapping[bgClass] || "#130919";
  } else {
    // Light mode bases (soft warm/pastel versions matching the mood base Bg)
    const mapping: Record<string, string> = {
      "bg-[#130919]": "#f6f1eb", // NEUTRAL -> warm beige (landing background)
      "bg-[#251b07]": "#faf6e8", // HAPPY -> soft warm yellow
      "bg-[#070e25]": "#f0f3fa", // SAD -> soft warm blue
      "bg-[#0e0725]": "#f2effa", // REFLECTIVE -> soft warm purple
      "bg-[#150725]": "#f5f0fa", // ANXIOUS -> soft warm violet
      "bg-[#250707]": "#faf0e8", // ENERGETIC -> soft warm orange/beige
      "bg-[#07250e]": "#edf5f0", // CALM -> soft warm green
      "bg-[#250719]": "#faf0f5", // LOVING / GRATEFUL -> soft warm pink
      "bg-[#2a0404]": "#faf0f0", // ANGRY -> soft warm red
    };
    return mapping[bgClass] || "#f6f1eb";
  }
}

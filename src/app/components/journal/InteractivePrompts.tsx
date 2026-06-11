"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useMood } from "@/app/context/MoodContext";

const ALL_PROMPTS = [
  "What's on your mind right now?",
  "How was your day, in one sentence?",
  "What's something you're looking forward to?",
  "What's the best thing that happened today?",
  "Who made you smile recently?",
  "What are you most proud of right now?",
  "It's okay to feel this way. What's weighing on you?",
  "What's one small thing that could make today 1% better?",
  "If your sadness was a weather pattern, what would it be?",
  "Let's ground ourselves. What are 3 things you can see right now?",
  "What's one thing you can control in this moment?",
  "Take a deep breath. What's the root of this feeling?",
  "What does peace feel like in your body right now?",
  "What's a quiet moment you enjoyed today?",
  "How can you carry this stillness into tomorrow?",
];

export default function InteractivePrompts() {
  const { currentMood } = useMood();
  const [currentPrompt, setCurrentPrompt] = useState(ALL_PROMPTS[0]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentPrompt((prevPrompt) => {
        let nextPrompt = prevPrompt;
        // Avoid selecting the exact same prompt consecutively
        while (nextPrompt === prevPrompt) {
          const randomIndex = Math.floor(Math.random() * ALL_PROMPTS.length);
          nextPrompt = ALL_PROMPTS[randomIndex];
        }
        return nextPrompt;
      });
    }, 3000); // Cycles every 3 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
        <Sparkles
          className={`w-5 h-5 transition-colors duration-500 ${currentMood?.accent || "text-purple-400"}`}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span
          className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${currentMood?.accent || "text-purple-400"}`}
        >
          Guided Reflection
        </span>

        <AnimatePresence mode="wait">
          <motion.p
            key={currentPrompt}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-lg text-white/90 font-medium leading-relaxed"
          >
            {currentPrompt}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

"use client";

import JournalEditor from "@/app/components/journal/JournalEditor";
import JournalCompanion from "@/app/components/journal/JournalCompanion";
import GrowingPlant from "@/app/components/journal/GrowingPlant";
import InteractivePrompts from "@/app/components/journal/InteractivePrompts";

export default function JournalPage() {
  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-8">
      {/* Left Side: The Editor (Main Focus) */}
      <div className="flex-1 z-10">
        <div className="mb-6">
          <InteractivePrompts />
        </div>
        <JournalEditor />
      </div>

      {/* Right Side: The "Alive" Elements */}
      <div className="w-full lg:w-80 flex flex-col gap-8 items-center justify-start pt-4">
        <div className="sticky top-24 flex flex-col items-center gap-6">
          <JournalCompanion />
          <div className="relative bg-white/40 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl rounded-3xl p-4 shadow-xl">
            <GrowingPlant />
          </div>
        </div>
      </div>
    </div>
  );
}

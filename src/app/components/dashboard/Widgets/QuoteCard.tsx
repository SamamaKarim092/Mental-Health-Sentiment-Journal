"use client";

import { useEffect } from "react";
import { Quote, Loader2, RotateCw } from "lucide-react";
import { useQuote } from "@/hooks/use-api";
import { motion } from "framer-motion";

export default function QuoteCard() {
  const { data: quote, isLoading, error, mutate } = useQuote();

  // Auto-seed quotes if database is empty
  useEffect(() => {
    if (!isLoading && !error && quote === null) {
      const seedQuotes = async () => {
        try {
          const res = await fetch("/api/quotes/seed", { method: "POST" });
          if (res.ok) {
            mutate();
          }
        } catch (err) {
          console.error("Auto-seeding quotes failed:", err);
        }
      };
      seedQuotes();
    }
  }, [quote, isLoading, error, mutate]);

  const handleRefresh = (e: React.MouseEvent) => {
    e.preventDefault();
    mutate();
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-purple-600/10 to-pink-600/10 dark:from-purple-600/20 dark:to-pink-600/20 border border-purple-200/50 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-center min-h-[220px] shadow-xs group hover:shadow-[0_8px_30px_rgba(168,85,247,0.08)] transition-all duration-500">
      
      {/* Slow breathing backdrop glow */}
      <div className="absolute inset-0 bg-radial from-purple-500/10 via-transparent to-transparent opacity-60 group-hover:scale-110 transition-transform duration-1000 pointer-events-none" />

      {/* Quote watermark icon */}
      <div className="absolute top-0 right-0 p-4 opacity-[0.04] dark:opacity-[0.06] group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 pointer-events-none">
        <Quote className="w-28 h-28 text-purple-900 dark:text-white" />
      </div>

      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400" />
            <h3 className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
              Daily Inspiration
            </h3>
          </div>
          <button
            onClick={handleRefresh}
            className="p-1 hover:bg-white/10 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all cursor-pointer"
            title="Get another quote"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex items-center gap-2 text-purple-500/50 dark:text-purple-300/50 py-4">
            <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
            <span className="text-xs font-medium uppercase tracking-wider">Gathering light...</span>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-3"
          >
            {error || !quote ? (
              <blockquote className="text-lg md:text-xl font-serif text-slate-700 dark:text-slate-100 italic leading-relaxed font-medium">
                &ldquo;Be gentle with yourself. You are doing the best you can.&rdquo;
              </blockquote>
            ) : (
              <>
                <blockquote className="text-lg md:text-xl font-serif text-slate-700 dark:text-slate-100 italic leading-relaxed font-medium">
                  &ldquo;{quote.text || quote.content}&rdquo;
                </blockquote>
                {quote.author && (
                  <cite className="text-xs text-slate-500 dark:text-gray-400 not-italic font-bold block text-right tracking-wide">
                    — {quote.author}
                  </cite>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

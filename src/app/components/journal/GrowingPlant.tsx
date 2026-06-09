"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
export default function GrowingPlant() {
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ count: number; charCount?: number }>;
      setWordCount(customEvent.detail?.count || 0);
      setCharCount(customEvent.detail?.charCount || 0);
    };
    window.addEventListener("wordCountUpdate", handleUpdate);
    return () => window.removeEventListener("wordCountUpdate", handleUpdate);
  }, []);
  // Continuous growth progress (0 to 1) - completes at 150 characters (approx 30 words)
  const progress = useMemo(() => Math.min(charCount / 150, 1), [charCount]);
  const isGrowing = charCount > 0;
  // Growth thresholds scaled to 150 characters (30 words)
  // 1. Stem: complete by 60 characters (approx 12 words)
  const stemProgress = Math.min(charCount / 60, 1);
  // 2. Stem Leaves: start growing at 30 characters, complete at 100 characters (6 to 20 words)
  const leafProgress = charCount > 30 ? Math.min((charCount - 30) / 70, 1) : 0;
  // 3. Branches: start growing at 50 characters, complete at 110 characters (10 to 22 words)
  const branchProgress = charCount > 50 ? Math.min((charCount - 50) / 60, 1) : 0;
  // 4. Small Top Leaves: start growing at 90 and 100 characters respectively, complete by 125 characters
  const topLeftLeafProgress = charCount > 90 ? Math.min((charCount - 90) / 30, 1) : 0;
  const topRightLeafProgress = charCount > 100 ? Math.min((charCount - 100) / 25, 1) : 0;
  // 5. Flower Head: starts growing at 110 characters, fully bloomed at 150 characters (22 to 30 words)
  const flowerProgress = charCount > 110 ? Math.min((charCount - 110) / 40, 1) : 0;
  return (
    <div className="relative w-72 h-[520px] flex flex-col items-center justify-end">
      <div className="relative w-full max-w-md">
        <svg
          viewBox="0 0 200 380"
          className={`w-full h-auto transition-all duration-1000 ${isGrowing ? "drop-shadow-[0_0_40px_rgba(16,185,129,0.3)]" : ""}`}
        >
          <defs>
            {/* Petal Gradients */}
            <linearGradient
              id="petalGradient1"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#ff6b9d" />
              <stop offset="50%" stopColor="#fda4af" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>
            <linearGradient
              id="petalGradient2"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#db2777" />
            </linearGradient>
            <radialGradient id="centerGradient">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </radialGradient>
            <linearGradient id="stemGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="potGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#78716c" />
              <stop offset="30%" stopColor="#57534e" />
              <stop offset="70%" stopColor="#44403c" />
              <stop offset="100%" stopColor="#292524" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
            </filter>
            <filter id="potShadow">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.5" />
            </filter>
          </defs>
          {/* Pot */}
          <g transform="translate(100, 335)">
            {/* Pot Glow/Shadow Base */}
            <motion.ellipse
              cx="0"
              cy="25"
              rx="48"
              ry="8"
              fill="#000"
              opacity="0.2"
              animate={{ scale: isGrowing ? [1, 1.05, 1] : 1 }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            />
            {/* Pot Body */}
            <path
              d="M -35 0 L -40 30 Q -40 38 0 38 Q 40 38 40 30 L 35 0 Z"
              fill="url(#potGrad)"
              filter="url(#potShadow)"
              stroke="#1c1917"
              strokeWidth="1"
            />
            {/* Pot Rim */}
            <ellipse
              cx="0"
              cy="0"
              rx="38"
              ry="6"
              fill="#78716c"
              stroke="#a8a29e"
              strokeWidth="0.5"
            />
            <ellipse
              cx="0"
              cy="0"
              rx="38"
              ry="6"
              fill="url(#potGrad)"
              opacity="0.6"
            />
            {/* Pot Decoration */}
            <ellipse
              cx="0"
              cy="15"
              rx="37"
              ry="2"
              fill="#a8a29e"
              opacity="0.3"
            />
            <ellipse
              cx="0"
              cy="25"
              rx="38"
              ry="2"
              fill="#a8a29e"
              opacity="0.3"
            />
            {/* Pot Highlights */}
            <path
              d="M -25 5 Q -20 20 -18 30"
              fill="none"
              stroke="#d6d3d1"
              strokeWidth="2"
              opacity="0.2"
            />
            {/* Soil */}
            <ellipse cx="0" cy="2" rx="32" ry="5" fill="#3e2723" />
            <ellipse cx="0" cy="2" rx="32" ry="4" fill="#2d1e14" />
            {/* Pot Glow Effect - Only visible when growing */}
            <motion.ellipse
              cx="0"
              cy="20"
              rx="42"
              ry="25"
              fill="#10b981"
              animate={{ opacity: isGrowing ? [0.05, 0.2, 0.05] : 0 }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            />
          </g>
          {/* Main Stem - Grows with typing */}
          <motion.path
            d="M100 337 Q98 295 100 255 Q102 205 100 155 Q100 115 100 85"
            fill="none"
            stroke="url(#stemGrad)"
            strokeWidth="7"
            strokeLinecap="round"
            filter="url(#shadow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: stemProgress, opacity: isGrowing ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 30, damping: 15 }}
          />
          {/* Stem highlight */}
          <motion.path
            d="M97 337 Q96 295 97 255 Q98 205 97 155 Q97 115 97 85"
            fill="none"
            stroke="#34d399"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: stemProgress, opacity: isGrowing ? stemProgress * 0.4 : 0 }}
          />
          {/* Left Branch - Always mounted, grows smoothly */}
          <motion.path
            d="M100 275 Q85 265 65 250"
            fill="none"
            stroke="url(#stemGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: branchProgress, opacity: branchProgress > 0.01 ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 30, damping: 15 }}
          />
          {/* Right Branch - Always mounted, grows smoothly */}
          <motion.path
            d="M100 265 Q115 255 135 240"
            fill="none"
            stroke="url(#stemGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: branchProgress, opacity: branchProgress > 0.01 ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 30, damping: 15 }}
          />
          {/* Left Branch Leaves - Always mounted, grows smoothly */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: branchProgress,
              opacity: branchProgress > 0.01 ? 1 : 0,
              rotate: isGrowing ? [-2, 2, -2] : 0,
            }}
            transition={{ rotate: { repeat: Infinity, duration: 4 } }}
            style={{ transformOrigin: "65px 250px" }}
          >
            <ellipse
              cx="65"
              cy="250"
              rx="20"
              ry="32"
              fill="url(#leafGrad)"
              transform="rotate(-25 65 250)"
              filter="url(#shadow)"
            />
            <path
              d="M65 267 Q65 250 65 233"
              stroke="#047857"
              strokeWidth="2"
              fill="none"
              opacity="0.5"
              transform="rotate(-25 65 250)"
            />
          </motion.g>
          {/* Right Branch Leaves - Always mounted, grows smoothly */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: branchProgress,
              opacity: branchProgress > 0.01 ? 1 : 0,
              rotate: isGrowing ? [2, -2, 2] : 0,
            }}
            transition={{ rotate: { repeat: Infinity, duration: 4 } }}
            style={{ transformOrigin: "135px 240px" }}
          >
            <ellipse
              cx="135"
              cy="240"
              rx="20"
              ry="32"
              fill="url(#leafGrad)"
              transform="rotate(25 135 240)"
              filter="url(#shadow)"
            />
            <path
              d="M135 257 Q135 240 135 223"
              stroke="#047857"
              strokeWidth="2"
              fill="none"
              opacity="0.5"
              transform="rotate(25 135 240)"
            />
          </motion.g>
          {/* Stem Leaves (Left) - Always mounted, grows smoothly */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: leafProgress,
              opacity: leafProgress > 0.01 ? 1 : 0,
              rotate: isGrowing ? [-3, 3, -3] : 0,
            }}
            transition={{ rotate: { repeat: Infinity, duration: 3 } }}
            style={{ transformOrigin: "85px 295px" }}
          >
            <ellipse
              cx="85"
              cy="295"
              rx="14"
              ry="24"
              fill="url(#leafGrad)"
              transform="rotate(-35 85 295)"
              filter="url(#shadow)"
            />
            <path
              d="M85 307 Q85 295 85 283"
              stroke="#047857"
              strokeWidth="1.5"
              fill="none"
              opacity="0.5"
              transform="rotate(-35 85 295)"
            />
          </motion.g>
          {/* Stem Leaves (Right) - Always mounted, grows smoothly */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: leafProgress,
              opacity: leafProgress > 0.01 ? 1 : 0,
              rotate: isGrowing ? [3, -3, 3] : 0,
            }}
            transition={{ rotate: { repeat: Infinity, duration: 3 } }}
            style={{ transformOrigin: "115px 305px" }}
          >
            <ellipse
              cx="115"
              cy="305"
              rx="14"
              ry="24"
              fill="url(#leafGrad)"
              transform="rotate(35 115 305)"
              filter="url(#shadow)"
            />
            <path
              d="M115 317 Q115 305 115 293"
              stroke="#047857"
              strokeWidth="1.5"
              fill="none"
              opacity="0.5"
              transform="rotate(35 115 305)"
            />
          </motion.g>
          {/* Small leaves near top - Left */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: topLeftLeafProgress, opacity: topLeftLeafProgress > 0.01 ? 1 : 0 }}
            style={{ transformOrigin: "88px 155px" }}
          >
            <ellipse
              cx="88"
              cy="155"
              rx="10"
              ry="18"
              fill="url(#leafGrad)"
              transform="rotate(-40 88 155)"
              filter="url(#shadow)"
            />
          </motion.g>
 
          {/* Small leaves near top - Right */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: topRightLeafProgress, opacity: topRightLeafProgress > 0.01 ? 1 : 0 }}
            style={{ transformOrigin: "112px 165px" }}
          >
            <ellipse
              cx="112"
              cy="165"
              rx="10"
              ry="18"
              fill="url(#leafGrad)"
              transform="rotate(40 112 165)"
              filter="url(#shadow)"
            />
          </motion.g>
          {/* Complete Flower Head - Connected to stem at y=85 */}
          <g transform="translate(100, 85)">
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: flowerProgress,
                opacity: flowerProgress > 0.01 ? 1 : 0,
                rotate: flowerProgress > 0 ? 0 : -30,
              }}
              transition={{ type: "spring", stiffness: 50, damping: 10 }}
            >
              {/* Outer Layer - 8 Large Petals */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <motion.g
                  key={`outer-${angle}`}
                  animate={{
                    scale: flowerProgress > 0.5 ? [1, 1.05, 1] : 1,
                    rotate: [0, 2, 0],
                  }}
                  transition={{ repeat: Infinity, duration: 3, delay: i * 0.15 }}
                  style={{ transformOrigin: "0 0" }}
                >
                  <ellipse
                    cx="0"
                    cy="-22"
                    rx="11"
                    ry="20"
                    fill="url(#petalGradient1)"
                    transform={`rotate(${angle})`}
                    filter="url(#glow)"
                    opacity="0.95"
                  />
                  <path
                    d="M0 -14 L0 -32"
                    stroke="#fb7185"
                    strokeWidth="0.5"
                    opacity="0.3"
                    transform={`rotate(${angle})`}
                  />
                </motion.g>
              ))}
              {/* Middle Layer - 8 Medium Petals */}
              {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map(
                (angle, i) => (
                  <motion.g
                    key={`middle-${angle}`}
                    animate={{ scale: flowerProgress > 0.7 ? [1, 1.08, 1] : 1 }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      delay: i * 0.15 + 0.5,
                    }}
                    style={{ transformOrigin: "0 0" }}
                  >
                    <ellipse
                      cx="0"
                      cy="-16"
                      rx="9"
                      ry="16"
                      fill="url(#petalGradient2)"
                      transform={`rotate(${angle})`}
                      filter="url(#glow)"
                      opacity="0.9"
                    />
                  </motion.g>
                )
              )}
              {/* Inner Layer - Small Petals */}
              {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                <motion.ellipse
                  key={`inner-${angle}`}
                  cx="0"
                  cy="-9"
                  rx="6"
                  ry="11"
                  fill="#fda4af"
                  transform={`rotate(${angle})`}
                  animate={{ scale: flowerProgress === 1 ? [1, 1.1, 1] : 1 }}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
                  style={{ transformOrigin: "0 0" }}
                />
              ))}
              {/* Flower Center */}
              <motion.circle
                cx="0"
                cy="0"
                r="12"
                fill="url(#centerGradient)"
                filter="url(#shadow)"
                animate={{ scale: flowerProgress === 1 ? [1, 1.1, 1] : 1 }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              {/* Center Seeds */}
              {[...Array(16)].map((_, i) => {
                const angle = (i * 360) / 16;
                const rad = (angle * Math.PI) / 180;
                const x = Math.cos(rad) * 7;
                const y = Math.sin(rad) * 7;
                return (
                  <motion.circle
                    key={`seed-${i}`}
                    cx={x}
                    cy={y}
                    r="1.5"
                    fill="#d97706"
                    animate={{ scale: flowerProgress === 1 ? [1, 1.3, 1] : 1 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      delay: i * 0.05,
                    }}
                  />
                );
              })}
              {/* Center Highlight */}
              <circle cx="-3" cy="-3" r="4" fill="#fef3c7" opacity="0.6" />
              <circle cx="0" cy="0" r="3" fill="#78350f" opacity="0.2" />
            </motion.g>
          </g>
          {/* Sparkles around flower - only when complete */}
          <AnimatePresence>
            {progress >= 1 && (
              <>
                {[...Array(10)].map((_, i) => {
                  const angle = (i * 360) / 10;
                  const rad = (angle * Math.PI) / 180;
                  const x = 100 + Math.cos(rad) * 50;
                  const y = 85 + Math.sin(rad) * 50;
                  return (
                    <motion.circle
                      key={`sparkle-${i}`}
                      cx={x}
                      cy={y}
                      r="2.5"
                      fill="#fbbf24"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        delay: i * 0.2,
                      }}
                    />
                  );
                })}
              </>
            )}
          </AnimatePresence>
        </svg>
      </div>
    </div>
  );
}

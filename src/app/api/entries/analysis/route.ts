// GET /api/entries/analysis — Aggregate stats from user's entries (local computation, no AI)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth/api';

const PREDEFINED_MOODS = ["Happy", "Neutral", "Sad", "Anxious", "Energetic", "Calm", "Grateful", "Angry"];

// Simple word extraction — get frequent meaningful words from content
function extractKeywords(entries: any[]): { word: string; count: number }[] {
  const stopWords = new Set([
    "i", "me", "my", "myself", "we", "our", "you", "your", "he", "she", "it",
    "they", "them", "this", "that", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "a", "an", "the", "and", "but",
    "or", "if", "so", "as", "at", "by", "for", "in", "of", "on", "to", "up",
    "with", "from", "into", "about", "out", "than", "then", "when", "where",
    "what", "which", "who", "how", "not", "no", "just", "very", "really",
    "also", "too", "more", "much", "many", "some", "all", "each", "every",
    "any", "few", "most", "other", "new", "old", "even", "still", "already",
    "well", "back", "there", "here", "now", "today", "got", "get", "like",
    "think", "know", "want", "need", "feel", "make", "go", "see", "come",
    "take", "give", "thing", "things", "lot", "way", "time", "day", "dont",
    "im", "ive", "its", "thats", "wont", "cant", "didnt", "doesnt", "wasnt",
    "been", "going", "doing", "having", "getting", "looking", "trying",
  ]);

  const wordCounts = new Map<string, number>();

  for (const entry of entries) {
    const text = `${entry.title || ""} ${entry.content || ""}`.toLowerCase();
    const words = text.match(/[a-z]{3,}/g) || [];
    for (const word of words) {
      if (!stopWords.has(word) && word.length > 3) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }
  }

  return Array.from(wordCounts.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));
}

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Compute writing streak (consecutive days with entries, ending today or yesterday)
function computeStreak(entries: any[]): number {
  if (entries.length === 0) return 0;

  const dates = new Set(
    entries.map((e) => {
      const d = new Date(e.createdAt);
      return toLocalDateStr(d);
    })
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  let checkDate = new Date(today);

  // Check if today or yesterday has an entry
  const todayStr = toLocalDateStr(checkDate);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateStr(yesterday);

  if (!dates.has(todayStr) && !dates.has(yesterdayStr)) {
    return 0; // Streak broken
  }

  // Start from today and count backward
  checkDate = new Date(today);
  while (true) {
    const dateStr = toLocalDateStr(checkDate);
    if (dates.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await prisma.entry.findMany({
      where: { userId: user.id, createdAt: { gte: startDate } },
      orderBy: { createdAt: 'desc' },
    });

    // Mood breakdown
    const moodBreakdown: Record<string, number> = {};
    for (const entry of entries) {
      if (entry.moodLabels && entry.moodLabels.length > 0) {
        for (const label of entry.moodLabels) {
          if (PREDEFINED_MOODS.includes(label)) {
            moodBreakdown[label] = (moodBreakdown[label] || 0) + 1;
          }
        }
      }
    }

    // Sentiment stats
    const sentiments = entries
      .filter((e) => e.sentiment !== null)
      .map((e) => e.sentiment as number);
    const avgSentiment = sentiments.length > 0
      ? Math.round((sentiments.reduce((a, b) => a + b, 0) / sentiments.length) * 100) / 100
      : null;

    // Sentiment trend: compare first half vs second half
    let sentimentTrend: "up" | "down" | "stable" = "stable";
    if (sentiments.length >= 4) {
      const mid = Math.floor(sentiments.length / 2);
      const firstHalf = sentiments.slice(mid); // older (entries ordered desc)
      const secondHalf = sentiments.slice(0, mid); // newer
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      const diff = secondAvg - firstAvg;
      if (diff > 0.05) sentimentTrend = "up";
      else if (diff < -0.05) sentimentTrend = "down";
    }

    // Keywords
    const topKeywords = extractKeywords(entries);

    // Writing streak
    const writingStreak = computeStreak(entries);

    // Entry summaries for AI (compact format)
    const entrySummaries = entries.slice(0, 50).map((e) => ({
      date: e.createdAt.toISOString().split('T')[0],
      title: e.title,
      moods: (e.moodLabels || []).filter((l: string) => PREDEFINED_MOODS.includes(l)),
      sentiment: e.sentiment !== null ? Math.round(e.sentiment * 100) : null,
      snippet: (e.content || "").slice(0, 150),
    }));

    // Chat logs context for AI analysis
    const recentMessages = await prisma.message.findMany({
      where: {
        chat: { userId: user.id },
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: {
        chat: { select: { title: true } }
      }
    });

    const chatSummaries = recentMessages.reverse().map((m) => ({
      date: m.createdAt.toISOString().split('T')[0],
      role: m.role,
      content: m.content.slice(0, 150),
      chatTitle: m.chat.title,
    }));

    return NextResponse.json({
      totalEntries: entries.length,
      moodBreakdown,
      avgSentiment,
      sentimentTrend,
      topKeywords,
      writingStreak,
      entrySummaries,
      chatSummaries,
      period: days,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('GET /api/entries/analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

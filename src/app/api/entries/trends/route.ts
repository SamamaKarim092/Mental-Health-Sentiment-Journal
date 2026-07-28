// GET /api/entries/trends?days=7 — Mood trends for authenticated user

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth/api';
import { Mood } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    let days = parseInt(searchParams.get('days') || '30', 10);
    if (!Number.isFinite(days) || days <= 0) days = 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await prisma.entry.findMany({
      where: { userId: user.id, createdAt: { gte: startDate } },
      orderBy: { createdAt: 'asc' },
    });

    // Fetch user tasks for the period
    const tasks = await prisma.task.findMany({
      where: { userId: user.id, date: { gte: startDate } },
      orderBy: { date: 'asc' },
    });

    const trendMap = new Map<
      string,
      {
        positive: number;
        neutral: number;
        negative: number;
        sentiments: number[];
        moodCounts: Record<string, number>;
        entryCount: number;
        totalTasks: number;
        completedTasks: number;
      }
    >();

    const PREDEFINED_MOODS = ["Happy", "Neutral", "Sad", "Anxious", "Energetic", "Calm", "Grateful", "Angry"];

    for (const entry of entries) {
      const dateKey = entry.createdAt.toISOString().split('T')[0];
      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, {
          positive: 0, neutral: 0, negative: 0,
          sentiments: [],
          moodCounts: {},
          entryCount: 0,
          totalTasks: 0,
          completedTasks: 0,
        });
      }
      const dayData = trendMap.get(dateKey)!;
      dayData.entryCount++;

      // Old enum tracking
      if (entry.mood === Mood.POSITIVE) dayData.positive++;
      else if (entry.mood === Mood.NEUTRAL) dayData.neutral++;
      else if (entry.mood === Mood.NEGATIVE) dayData.negative++;

      // Sentiment score
      if (entry.sentiment !== null) dayData.sentiments.push(entry.sentiment);

      // Count each mood label (from moodLabels array)
      if (entry.moodLabels && entry.moodLabels.length > 0) {
        for (const label of entry.moodLabels) {
          if (PREDEFINED_MOODS.includes(label)) {
            dayData.moodCounts[label] = (dayData.moodCounts[label] || 0) + 1;
          }
        }
      }
    }

    // Populate task completion data into trendMap
    for (const task of tasks) {
      const dateKey = task.date.toISOString().split('T')[0];
      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, {
          positive: 0, neutral: 0, negative: 0,
          sentiments: [],
          moodCounts: {},
          entryCount: 0,
          totalTasks: 0,
          completedTasks: 0,
        });
      }
      const dayData = trendMap.get(dateKey)!;
      dayData.totalTasks++;
      if (task.completed) dayData.completedTasks++;
    }

    const trends = Array.from(trendMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date,
        positiveCount: data.positive,
        neutralCount: data.neutral,
        negativeCount: data.negative,
        entryCount: data.entryCount,
        totalTasks: data.totalTasks,
        completedTasks: data.completedTasks,
        taskCompletionRate: data.totalTasks > 0 ? Math.round((data.completedTasks / data.totalTasks) * 100) : null,
        averageSentiment:
          data.sentiments.length > 0
            ? Math.round((data.sentiments.reduce((a, b) => a + b, 0) / data.sentiments.length) * 100) / 100
            : null,
        // Mood label counts
        Happy: data.moodCounts["Happy"] || 0,
        Neutral: data.moodCounts["Neutral"] || 0,
        Sad: data.moodCounts["Sad"] || 0,
        Anxious: data.moodCounts["Anxious"] || 0,
        Energetic: data.moodCounts["Energetic"] || 0,
        Calm: data.moodCounts["Calm"] || 0,
        Grateful: data.moodCounts["Grateful"] || 0,
        Angry: data.moodCounts["Angry"] || 0,
      }));

    return NextResponse.json(trends);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('GET /api/entries/trends error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

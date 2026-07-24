// GET  /api/entries — List user's entries
// POST /api/entries — Create a new entry + trigger sentiment analysis

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth/api';
import { Mood, Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const { searchParams } = new URL(request.url);

    const mood = searchParams.get('mood') as Mood | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const take = parseInt(searchParams.get('take') || '20', 10);

    const where: Prisma.EntryWhereInput = { userId: user.id };
    if (mood) where.mood = mood;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const entries = await prisma.entry.findMany({
      where,
      include: { attachments: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    return NextResponse.json(entries);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('GET /api/entries error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const body = await request.json();

    const { title, content, mood, customMoodLabel, moodLabels, tags, attachments } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const entry = await prisma.entry.create({
      data: {
        userId: user.id,
        title,
        content,
        mood: mood || null,
        customMoodLabel: customMoodLabel || null,
        moodLabels: moodLabels || [],
        tags: tags || [],
        attachments: Array.isArray(attachments) && attachments.length > 0
          ? {
              create: attachments.map((att: any) => ({
                fileName: att.fileName || att.name || 'attachment',
                fileUrl: att.fileUrl || att.url,
                fileType: att.fileType || 'image/png',
                fileSize: att.fileSize || 0,
              })),
            }
          : undefined,
      },
      include: { attachments: true },
    });

    // Fire-and-forget: trigger n8n sentiment analysis
    triggerSentimentAnalysis(entry.id, entry.content, entry.title);

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('POST /api/entries error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function triggerSentimentAnalysis(entryId: string, content: string, title?: string) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    console.warn('GROQ_API_KEY not configured - skipping sentiment analysis');
    return;
  }

  try {
    const text = `${title || ''}. ${content}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let groqResponse: Response;
    try {
      groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [
            { role: 'system', content: 'Analyze sentiment and respond with only a decimal number between -1.0 (very negative) and 1.0 (very positive).' },
            { role: 'user', content: text },
          ],
          temperature: 0.2,
          max_tokens: 10,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (groqResponse.ok) {
      const groqData = await groqResponse.json();
      const responseContent = groqData.choices?.[0]?.message?.content?.trim() || '';

      const match = responseContent.match(/-?\d+\.?\d*/);
      if (match) {
        let sentiment = parseFloat(match[0]);
        // Normalize if it returned a percentage
        if (sentiment > 1 && sentiment <= 100) sentiment = (sentiment / 100) * 2 - 1;
        // Clamp bounds
        if (sentiment < -1) sentiment = -1;
        if (sentiment > 1) sentiment = 1;
        sentiment = Math.round(sentiment * 100) / 100;

        await prisma.entry.update({
          where: { id: entryId },
          data: { sentiment },
        });
      }
    }
  } catch (error) {
    console.error(`Failed to trigger sentiment analysis for entry ${entryId}:`, error);
  }
}

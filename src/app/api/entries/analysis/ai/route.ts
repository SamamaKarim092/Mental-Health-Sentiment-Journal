// POST /api/entries/analysis/ai — Get AI-generated insights
// Calls Groq directly (bypasses n8n for reliability)

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, AuthError } from '@/lib/auth/api';

const PREDEFINED_MOODS = ["Happy", "Neutral", "Sad", "Anxious", "Energetic", "Calm", "Grateful", "Angry"];

export async function POST(request: NextRequest) {
  try {
    await getAuthUser(request); // Auth check
    const body = await request.json();

    const { entrySummaries, chatSummaries, moodBreakdown, avgSentiment, sentimentTrend, writingStreak, totalEntries, period } = body;

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({
        summary: "AI analysis is not configured. Please set GROQ_API_KEY in your .env file.",
        insights: [],
        suggestions: [],
      });
    }

    if ((!entrySummaries || entrySummaries.length === 0) && (!chatSummaries || chatSummaries.length === 0)) {
      return NextResponse.json({
        summary: "Not enough journal entries or chat conversations to generate insights. Keep writing or chatting!",
        insights: [],
        suggestions: [],
      });
    }

    // Build prompt
    const entryLines = entrySummaries.slice(0, 30).map((e: any) =>
      `${e.date}: "${e.title}" — Moods: ${(e.moods || []).join(', ') || 'none'}, Sentiment: ${e.sentiment ?? 'N/A'}%`
    ).join('\n');

    const chatLines = (chatSummaries || []).map((m: any) =>
      `${m.date} - ${m.role === 'USER' ? 'User' : 'AI Coach'} (Chat: "${m.chatTitle || 'Coach Chat'}"): "${m.content}"`
    ).join('\n');

    const moodSummary = Object.entries(moodBreakdown || {})
      .sort((a: any, b: any) => b[1] - a[1])
      .map(([mood, count]) => `${mood}: ${count}`)
      .join(', ');

    const prompt = `You are a compassionate mental health AI analyst. Analyze this user's journal entries and recent chat conversations with their AI Coach from the last ${period || 30} days, and provide personalized insights. 
    Synthesize patterns from both their reflective journals and what they discuss with the AI Coach to form a holistic understanding of their emotional journey.

DATA:
- Total journal entries: ${totalEntries || 0}
- Writing streak: ${writingStreak || 0} days
- Average sentiment: ${avgSentiment !== null && avgSentiment !== undefined ? Math.round(avgSentiment * 100) + '%' : 'N/A'}
- Sentiment trend: ${sentimentTrend || 'unknown'}
- Mood breakdown: ${moodSummary || 'none'}

RECENT JOURNAL ENTRIES:
${entryLines || 'No entries available.'}

RECENT CONVERSATIONS WITH AI COACH:
${chatLines || 'No recent conversations.'}

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "summary": "A warm, empathetic 2-3 sentence summary of their emotional journey this period, synthesizing both journal logs and AI Coach chats. Reference specific patterns you see.",
  "insights": [
    {"type": "positive", "title": "Short title", "description": "A positive pattern you noticed from entries/chats"},
    {"type": "warning", "title": "Short title", "description": "A concerning pattern or something to watch from entries/chats"},
    {"type": "suggestion", "title": "Short title", "description": "An actionable suggestion based on entries/chats"}
  ],
  "suggestions": [
    "Specific wellness tip 1 based on their data",
    "Specific wellness tip 2 based on their data",
    "Specific wellness tip 3 based on their data",
    "Specific wellness tip 4 based on their data"
  ]
}`;

    // Call Groq directly (with timeout)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let groqResponse: Response;
    try {
      groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a mental health AI analyst. Always respond with valid JSON only.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
        signal: controller.signal,
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return NextResponse.json({
          summary: "AI analysis timed out. Please try again later.",
          insights: [],
          suggestions: [],
        });
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API error:', groqResponse.status, errorText);
      return NextResponse.json({
        summary: "Unable to generate AI insights at the moment. Please try again later.",
        insights: [],
        suggestions: [],
      });
    }

    const groqData = await groqResponse.json();
    const rawContent = groqData.choices?.[0]?.message?.content || '';
    console.log('Groq AI raw response:', rawContent.substring(0, 300));

    // Parse the AI response
    try {
      const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json(parsed);
    } catch {
      // If JSON parsing fails, still return something useful
      return NextResponse.json({
        summary: rawContent || "AI generated a response but it couldn't be parsed.",
        insights: [],
        suggestions: [],
      });
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('POST /api/entries/analysis/ai error:', error);
    return NextResponse.json({
      summary: "An error occurred while generating AI insights.",
      insights: [],
      suggestions: [],
    });
  }
}

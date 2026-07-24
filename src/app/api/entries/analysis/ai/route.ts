// POST /api/entries/analysis/ai — Get AI-generated insights
// Calls Groq directly (bypasses n8n for reliability)

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, AuthError } from '@/lib/auth/api';

const PREDEFINED_MOODS = ["Happy", "Neutral", "Sad", "Anxious", "Energetic", "Calm", "Grateful", "Angry"];

export async function POST(request: NextRequest) {
  try {
    await getAuthUser(request); // Auth check
    const body = await request.json();

    const { entrySummaries, chatSummaries, moodBreakdown, avgSentiment, sentimentTrend, writingStreak, totalEntries, period, taskStats, goalStats } = body;

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({
        summary: "AI analysis is not configured. Please set GROQ_API_KEY in your .env file.",
        insights: [],
        suggestions: [],
      });
    }

    const hasJournalData = entrySummaries && entrySummaries.length > 0;
    const hasChatData = chatSummaries && chatSummaries.length > 0;
    const hasTaskData = taskStats && taskStats.totalTasks > 0;
    const hasGoalData = goalStats && goalStats.totalGoals > 0;

    if (!hasJournalData && !hasChatData && !hasTaskData && !hasGoalData) {
      return NextResponse.json({
        summary: "Not enough user data (entries, chats, tasks, or goals) to generate insights. Start journaling or managing tasks!",
        insights: [],
        suggestions: [],
      });
    }

    // Build prompt
    const entryLines = (entrySummaries || []).slice(0, 30).map((e: any) =>
      `${e.date}: "${e.title}" — Moods: ${(e.moods || []).join(', ') || 'none'}, Sentiment: ${e.sentiment ?? 'N/A'}%`
    ).join('\n');

    const chatLines = (chatSummaries || []).map((m: any) =>
      `${m.date} - ${m.role === 'USER' ? 'User' : 'AI Coach'} (Chat: "${m.chatTitle || 'Coach Chat'}"): "${m.content}"`
    ).join('\n');

    const taskLines = (taskStats?.recentTasks || []).map((t: any) =>
      `${t.date}: [${t.completed ? 'COMPLETED' : 'PENDING'}] Priority: ${t.priority} — "${t.text}"`
    ).join('\n');

    const goalLines = (goalStats?.goalsList || []).map((g: any) =>
      `[${g.completed ? 'ACHIEVED' : 'ACTIVE'}] Category: ${g.category} — "${g.text}"`
    ).join('\n');

    const moodSummary = Object.entries(moodBreakdown || {})
      .sort((a: any, b: any) => b[1] - a[1])
      .map(([mood, count]) => `${mood}: ${count}`)
      .join(', ');

    const prompt = `You are a compassionate mental health and productivity AI analyst. Analyze this user's complete activity log from the last ${period || 30} days—including reflective journal entries, AI Coach conversations, todo tasks, and long-term goals—to provide holistic, personalized insights. 

Synthesize patterns across their emotional well-being (journals/chats), daily productivity (tasks/todos), and long-term aspirations (goals).

WELLBEING DATA:
- Total journal entries: ${totalEntries || 0}
- Writing streak: ${writingStreak || 0} days
- Average sentiment: ${avgSentiment !== null && avgSentiment !== undefined ? Math.round(avgSentiment * 100) + '%' : 'N/A'}
- Sentiment trend: ${sentimentTrend || 'unknown'}
- Mood breakdown: ${moodSummary || 'none'}

DAILY TASKS & TODO DATA:
- Total tasks in period: ${taskStats?.totalTasks || 0}
- Completed tasks: ${taskStats?.completedTasks || 0} (${taskStats?.completionRate || 0}% completion rate)
- Tasks carried over / pushed: ${taskStats?.pushedTasksCount || 0}
- Task Priority breakdown: High (${taskStats?.priorityBreakdown?.HIGH || 0}), Medium (${taskStats?.priorityBreakdown?.MEDIUM || 0}), Low (${taskStats?.priorityBreakdown?.LOW || 0})

LONG-TERM GOALS DATA:
- Total goals: ${goalStats?.totalGoals || 0}
- Completed goals: ${goalStats?.completedGoals || 0} (${goalStats?.completionRate || 0}% goal completion rate)

RECENT JOURNAL ENTRIES:
${entryLines || 'No entries available.'}

RECENT CONVERSATIONS WITH AI COACH:
${chatLines || 'No recent conversations.'}

RECENT TODO TASKS:
${taskLines || 'No recent tasks.'}

LONG-TERM GOALS:
${goalLines || 'No long-term goals set.'}

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "summary": "A warm, empathetic 2-3 sentence summary of their emotional journey, task completion habits, and goal alignment this period. Highlight any connection between workload/tasks and emotional state.",
  "insights": [
    {"type": "positive", "title": "Short title", "description": "A positive pattern from journals, chats, tasks, or goals"},
    {"type": "warning", "title": "Short title", "description": "A concerning pattern (e.g. high stress with carried over tasks or declining sentiment)"},
    {"type": "suggestion", "title": "Short title", "description": "An actionable suggestion connecting mood, productivity, and goals"}
  ],
  "suggestions": [
    "Specific wellness or task management tip 1",
    "Specific wellness or task management tip 2",
    "Specific wellness or task management tip 3",
    "Specific wellness or task management tip 4"
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

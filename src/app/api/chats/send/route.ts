// POST /api/chats/send — Send message (creates chat if no chatId provided)
// This handles the case where no chat exists yet

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth/api';
import { MessageRole } from '@prisma/client';
import { findRelevantEntries, type RelevantEntry } from '@/lib/rag';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const body = await request.json();
    const { chatId: inputChatId, content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    let chatId = inputChatId;

    // Create new chat if no chatId provided
    if (!chatId) {
      const chat = await prisma.chat.create({
        data: {
          userId: user.id,
          title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        },
      });
      chatId = chat.id;
    } else {
      // Verify ownership
      const chat = await prisma.chat.findUnique({ where: { id: chatId } });
      if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      if (chat.userId !== user.id) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Save user message
    await prisma.message.create({
      data: { chatId, role: MessageRole.USER, content },
    });

    // Get AI response with RAG semantic retrieval
    const { response: aiResponse, ragEntries } = await getAIResponse(chatId, content, user.id);

    await prisma.message.create({
      data: { chatId, role: MessageRole.AI, content: aiResponse },
    });

    // Return full chat with RAG metadata
    const updatedChat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    return NextResponse.json({
      ...updatedChat,
      ragContext: ragEntries.length > 0 ? {
        entriesUsed: ragEntries.length,
        entries: ragEntries.map(e => ({
          title: e.title,
          date: e.createdAt,
          relevance: e.similarityPercent,
        })),
      } : null,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('POST /api/chats/send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getAIResponse(
  chatId: string,
  userMessage: string,
  userId: string
): Promise<{ response: string; ragEntries: RelevantEntry[] }> {
  const n8nWebhookUrl = process.env.N8N_CHAT_WEBHOOK_URL;
  const groqKey = process.env.GROQ_API_KEY;

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 10 },
        contextEntry: true,
      },
    });

    const chatHistory = chat?.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })) || [];

    const contextEntry = chat?.contextEntry
      ? {
        title: chat.contextEntry.title,
        content: chat.contextEntry.content,
        moodLabels: chat.contextEntry.moodLabels,
      }
      : undefined;

    // Fetch user's tasks, goals, and latest journal entry for AI Coach awareness
    let userTasks: any[] = [];
    let userGoals: any[] = [];
    let latestJournalEntry: { title: string; content: string; createdAt: Date; moodLabels: string[] } | null = null;

    if (chat?.userId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tasks = await prisma.task.findMany({
        where: { userId: chat.userId, date: { gte: today } },
        take: 10,
        orderBy: { priority: 'desc' },
      });
      userTasks = tasks.map((t) => ({
        text: t.text,
        completed: t.completed,
        priority: t.priority,
      }));

      const goals = await prisma.goal.findMany({
        where: { userId: chat.userId },
        take: 10,
      });
      userGoals = goals.map((g) => ({
        text: g.text,
        completed: g.completed,
        category: g.category || 'General',
      }));

      // Fetch user's most recent journal entry
      const latest = await prisma.entry.findFirst({
        where: { userId: chat.userId },
        orderBy: { createdAt: 'desc' },
        select: { title: true, content: true, createdAt: true, moodLabels: true },
      });
      if (latest) {
        latestJournalEntry = latest;
      }
    }

    // ── RAG: Retrieve relevant past journal entries ──────────────────
    let ragEntries: RelevantEntry[] = [];
    try {
      ragEntries = await findRelevantEntries(userId, userMessage, 3);
    } catch (ragError) {
      console.warn('RAG retrieval failed, continuing without context:', ragError);
    }

    // Try n8n first if configured
    if (n8nWebhookUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        let response: Response;
        try {
          response = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: userMessage,
              chatHistory,
              contextEntry,
              userTasks,
              userGoals,
              ragContext: ragEntries.length > 0 ? ragEntries.map(e => ({
                title: e.title,
                content: e.content.slice(0, 300),
                date: e.createdAt,
                relevance: e.similarityPercent,
                moodLabels: e.moodLabels,
              })) : undefined,
            }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }

        if (response.ok) {
          const data = await response.json();
          const result = Array.isArray(data) ? data[0] : data;
          const n8nResponse = result?.response;
          if (n8nResponse) return { response: n8nResponse, ragEntries };
        }
        // If n8n didn't return a valid response, fall through to Groq
        console.warn('n8n returned invalid response, falling back to Groq');
      } catch (n8nError) {
        console.warn('n8n webhook failed, falling back to Groq:', n8nError);
      }
    }

    // Direct Groq fallback
    if (!groqKey) {
      console.warn('Neither N8N_CHAT_WEBHOOK_URL nor GROQ_API_KEY is configured');
      return {
        response: "I'm sorry, the AI service is not configured. Please set up either N8N_CHAT_WEBHOOK_URL or GROQ_API_KEY in your environment.",
        ragEntries: [],
      };
    }

    // Build a rich system prompt with all user context
    let systemPrompt = `You are a compassionate, warm, and supportive mental health coach inside a journaling app called MindFul-Space. Your role is to listen empathetically, validate feelings, ask thoughtful follow-up questions, and offer gentle guidance. Keep responses concise (2-4 paragraphs). Never diagnose conditions or prescribe medication. If someone is in crisis, suggest they contact emergency services or a crisis helpline.`;

    if (contextEntry) {
      systemPrompt += `\n\nThe user started this conversation from a journal entry titled "${contextEntry.title}". Entry content: "${contextEntry.content.slice(0, 500)}". Moods tagged: ${contextEntry.moodLabels.join(', ') || 'none'}.`;
    } else if (latestJournalEntry) {
      const dateStr = new Date(latestJournalEntry.createdAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      });
      systemPrompt += `\n\nUSER'S LATEST JOURNAL ENTRY (Written ${dateStr}): Title: "${latestJournalEntry.title}" | Content: "${latestJournalEntry.content.slice(0, 500)}" | Moods: ${latestJournalEntry.moodLabels.join(', ') || 'none'}. (You are aware of this latest journal entry if the user asks or mentions their recent feelings).`;
    }

    if (userTasks.length > 0) {
      const taskSummary = userTasks.map(t => `${t.completed ? '✅' : '⬜'} [${t.priority}] ${t.text}`).join('; ');
      systemPrompt += `\n\nUser's current tasks: ${taskSummary}`;
    }

    if (userGoals.length > 0) {
      const goalSummary = userGoals.map(g => `${g.completed ? '✅' : '🎯'} (${g.category}) ${g.text}`).join('; ');
      systemPrompt += `\n\nUser's wellness goals: ${goalSummary}`;
    }

    // ── RAG: Inject retrieved journal entries into system prompt ─────
    if (ragEntries.length > 0) {
      const ragContext = ragEntries.map(e => {
        const date = new Date(e.createdAt).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
        });
        const moods = e.moodLabels.length > 0 ? ` | Moods: ${e.moodLabels.join(', ')}` : '';
        return `- [${date}] "${e.title}"${moods}: "${e.content.slice(0, 400)}" (Relevance: ${e.similarityPercent}%)`;
      }).join('\n');

      systemPrompt += `\n\nRELEVANT PAST JOURNAL ENTRIES (Retrieved via RAG semantic search — use these to give grounded, accurate answers about the user's history. Reference specific dates and details when relevant):\n${ragContext}`;
    }

    // Convert chat history to Groq message format
    const groqMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    for (const msg of chatHistory) {
      groqMessages.push({
        role: msg.role === 'USER' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Add the current user message
    groqMessages.push({ role: 'user', content: userMessage });

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
          messages: groqMessages,
          temperature: 0.7,
          max_tokens: 800,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API error:', groqResponse.status, errorText);
      return { response: "I'm having trouble connecting right now. Please try again in a moment.", ragEntries: [] };
    }

    const groqData = await groqResponse.json();
    const aiContent = groqData.choices?.[0]?.message?.content?.trim();
    return {
      response: aiContent || "I'm here to listen. Could you tell me more?",
      ragEntries,
    };
  } catch (error) {
    console.error('Error getting AI response:', error);
    return {
      response: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
      ragEntries: [],
    };
  }
}

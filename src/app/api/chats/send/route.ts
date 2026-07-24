// POST /api/chats/send — Send message (creates chat if no chatId provided)
// This handles the case where no chat exists yet

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth/api';
import { MessageRole } from '@prisma/client';

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

    // Get AI response
    const aiResponse = await getAIResponse(chatId, content);

    await prisma.message.create({
      data: { chatId, role: MessageRole.AI, content: aiResponse },
    });

    // Return full chat
    const updatedChat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    return NextResponse.json(updatedChat);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('POST /api/chats/send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getAIResponse(chatId: string, userMessage: string): Promise<string> {
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

    // Fetch user's tasks and goals for AI Coach awareness
    let userTasks: any[] = [];
    let userGoals: any[] = [];
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
            body: JSON.stringify({ message: userMessage, chatHistory, contextEntry, userTasks, userGoals }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }

        if (response.ok) {
          const data = await response.json();
          const result = Array.isArray(data) ? data[0] : data;
          const n8nResponse = result?.response;
          if (n8nResponse) return n8nResponse;
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
      return "I'm sorry, the AI service is not configured. Please set up either N8N_CHAT_WEBHOOK_URL or GROQ_API_KEY in your environment.";
    }

    // Build a rich system prompt with all user context
    let systemPrompt = `You are a compassionate, warm, and supportive mental health coach inside a journaling app called MindFul-Space. Your role is to listen empathetically, validate feelings, ask thoughtful follow-up questions, and offer gentle guidance. Keep responses concise (2-4 paragraphs). Never diagnose conditions or prescribe medication. If someone is in crisis, suggest they contact emergency services or a crisis helpline.`;

    if (contextEntry) {
      systemPrompt += `\n\nThe user started this conversation from a journal entry titled "${contextEntry.title}". Entry content: "${contextEntry.content.slice(0, 500)}". Moods tagged: ${contextEntry.moodLabels.join(', ') || 'none'}.`;
    }

    if (userTasks.length > 0) {
      const taskSummary = userTasks.map(t => `${t.completed ? '✅' : '⬜'} [${t.priority}] ${t.text}`).join('; ');
      systemPrompt += `\n\nUser's current tasks: ${taskSummary}`;
    }

    if (userGoals.length > 0) {
      const goalSummary = userGoals.map(g => `${g.completed ? '✅' : '🎯'} (${g.category}) ${g.text}`).join('; ');
      systemPrompt += `\n\nUser's wellness goals: ${goalSummary}`;
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
      return "I'm having trouble connecting right now. Please try again in a moment.";
    }

    const groqData = await groqResponse.json();
    const aiContent = groqData.choices?.[0]?.message?.content?.trim();
    return aiContent || "I'm here to listen. Could you tell me more?";
  } catch (error) {
    console.error('Error getting AI response:', error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.";
  }
}

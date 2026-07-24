// POST /api/chats/contextual — Start a contextual chat from a journal entry

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth/api';
import { MessageRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const body = await request.json();
    const { entryId } = body;

    if (!entryId) {
      return NextResponse.json({ error: 'entryId is required' }, { status: 400 });
    }

    // Verify entry exists and belongs to user
    const entry = await prisma.entry.findUnique({ where: { id: entryId } });
    if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    if (entry.userId !== user.id) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    // Create chat linked to the entry
    const chat = await prisma.chat.create({
      data: {
        userId: user.id,
        contextEntryId: entryId,
        title: `Chat: ${entry.title.substring(0, 30)}${entry.title.length > 30 ? '...' : ''}`,
      },
    });

    // Get contextual opening from AI
    const openingMessage = await getContextualOpening(entry);

    await prisma.message.create({
      data: { chatId: chat.id, role: MessageRole.AI, content: openingMessage },
    });

    // Return chat with messages
    const chatWithMessages = await prisma.chat.findUnique({
      where: { id: chat.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    return NextResponse.json(chatWithMessages, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('POST /api/chats/contextual error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getContextualOpening(entry: {
  title: string;
  content: string;
  moodLabels: string[];
}): Promise<string> {
  const n8nWebhookUrl = process.env.N8N_CHAT_WEBHOOK_URL;
  const groqKey = process.env.GROQ_API_KEY;

  // Try n8n first if configured
  if (n8nWebhookUrl) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const MAX_CONTENT_LENGTH = 500;
      const truncatedContent =
        entry.content.length > MAX_CONTENT_LENGTH
          ? entry.content.substring(0, MAX_CONTENT_LENGTH) + '...'
          : entry.content;

      let response: Response;
      try {
        response = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message:
              'Start a supportive conversation about my journal entry. Acknowledge what I wrote and ask a thoughtful follow-up question.',
            chatHistory: [],
            contextEntry: {
              title: entry.title,
              content: truncatedContent,
              moodLabels: entry.moodLabels,
            },
          }),
          signal: controller.signal,
        });
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.warn('n8n contextual webhook timed out, falling back to Groq');
        } else {
          console.warn('n8n contextual webhook failed, falling back to Groq:', err);
        }
        // Fall through to Groq
        response = undefined as any;
      } finally {
        clearTimeout(timeout);
      }

      if (response?.ok) {
        const data = await response.json();
        const result = Array.isArray(data) ? data[0] : data;
        const n8nResponse = result?.response;
        if (n8nResponse) return n8nResponse;
      }
    } catch (error) {
      console.warn('n8n contextual webhook error, falling back to Groq:', error);
    }
  }

  // Direct Groq fallback
  if (groqKey) {
    try {
      const MAX_CONTENT_LENGTH = 500;
      const truncatedContent =
        entry.content.length > MAX_CONTENT_LENGTH
          ? entry.content.substring(0, MAX_CONTENT_LENGTH) + '...'
          : entry.content;

      const moodText = entry.moodLabels.length > 0
        ? `The user tagged their mood as: ${entry.moodLabels.join(', ')}.`
        : '';

      const systemPrompt = `You are a compassionate, warm mental health coach inside a journaling app called MindFul-Space. The user just opened a chat about a journal entry they wrote. Your job is to warmly acknowledge what they wrote, validate their feelings, and ask a thoughtful follow-up question to deepen the conversation. Keep your opening to 2-3 short paragraphs. Be empathetic and supportive.`;

      const userPrompt = `I wrote a journal entry titled "${entry.title}". Here's what I wrote:\n\n"${truncatedContent}"\n\n${moodText}\n\nPlease start a supportive conversation about this entry.`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

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
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      if (groqResponse.ok) {
        const groqData = await groqResponse.json();
        const aiContent = groqData.choices?.[0]?.message?.content?.trim();
        if (aiContent) return aiContent;
      }
    } catch (error) {
      console.error('Groq contextual opening error:', error);
    }
  }

  // Final fallback — static template
  return getFallbackOpening(entry);
}

function getFallbackOpening(entry: {
  title: string;
  content: string;
  moodLabels: string[];
}): string {
  const moodText =
    entry.moodLabels.length > 0
      ? `I noticed you're feeling ${entry.moodLabels.join(', ').toLowerCase()}.`
      : '';

  const contentPreview =
    entry.content.length > 100 ? entry.content.substring(0, 100) + '...' : entry.content;

  return `I see you were writing about "${entry.title}". ${moodText}\n\n${contentPreview ? `You mentioned: "${contentPreview}"` : ''}\n\nI'm here to listen and help you explore these thoughts. What aspect of this would you like to talk about first?`;
}

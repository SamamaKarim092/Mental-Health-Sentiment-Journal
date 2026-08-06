// Purpose: group all frontend actions that change data, like create, update,
// and delete. This file sends authenticated API requests and refreshes the UI
// afterward so the screen always shows the latest data.

import { apiFetch } from './fetcher';
import { mutate } from 'swr';

// ===== Entries =====

export async function createEntry(data: {
  title: string;
  content: string;
  mood?: string;
  customMoodLabel?: string | null;
  moodLabels?: string[];
  tags?: string[];
  attachments?: Array<{ fileName: string; fileUrl: string; fileType: string; fileSize: number }>;
}) {
  const entry = await apiFetch('/api/entries', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  // Revalidate entries list & stats
  mutate('/api/entries');
  mutate('/api/entries/stats');
  return entry;
}

export async function updateEntry(
  id: string,
  data: { title?: string; content?: string; mood?: string; tags?: string[] }
) {
  const entry = await apiFetch(`/api/entries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  mutate('/api/entries');
  mutate(`/api/entries/${id}`);
  return entry;
}

export async function deleteEntry(id: string) {
  await apiFetch(`/api/entries/${id}`, { method: 'DELETE' });
  mutate('/api/entries');
  mutate('/api/entries/stats');
}

export async function suggestMood(content: string, title?: string) {
  return apiFetch<{ suggestions: Array<{ label: string; color_category: string }> }>(
    '/api/entries/suggest-mood',
    {
      method: 'POST',
      body: JSON.stringify({ content, title }),
    }
  );
}

// ===== Chats =====

export async function sendMessage(chatId: string | null, content: string) {
  const chat = await apiFetch('/api/chats/send', {
    method: 'POST',
    body: JSON.stringify({ chatId, content }),
  });
  if (chatId) mutate(`/api/chats/${chatId}`);
  mutate('/api/chats');
  return chat;
}

export async function startContextualChat(entryId: string) {
  const chat = await apiFetch('/api/chats/contextual', {
    method: 'POST',
    body: JSON.stringify({ entryId }),
  });
  mutate('/api/chats');
  return chat;
}

export async function updateChatTitle(id: string, title: string) {
  const chat = await apiFetch(`/api/chats/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });
  mutate(`/api/chats/${id}`);
  mutate('/api/chats');
  return chat;
}

export async function deleteChat(id: string) {
  await apiFetch(`/api/chats/${id}`, { method: 'DELETE' });
  mutate('/api/chats');
}

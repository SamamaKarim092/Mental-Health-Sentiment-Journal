// SWR hooks for data fetching — replaces Apollo useQuery calls

'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/api/fetcher';

// ===== Entries =====

export function useEntries(filters?: { mood?: string; skip?: number; take?: number }) {
  const params = new URLSearchParams();
  if (filters?.mood) params.set('mood', filters.mood);
  if (filters?.skip) params.set('skip', String(filters.skip));
  if (filters?.take) params.set('take', String(filters.take));

  const query = params.toString();
  const url = `/api/entries${query ? `?${query}` : ''}`;

  return useSWR<any[]>(url, fetcher, { refreshInterval: 5000 });
}

export function useEntry(id: string | null) {
  return useSWR<any>(id ? `/api/entries/${id}` : null, fetcher);
}

export function useEntryStats() {
  return useSWR<any>('/api/entries/stats', fetcher, { refreshInterval: 30000 });
}

export function useMoodTrends(days: number) {
  return useSWR<any[]>(`/api/entries/trends?days=${days}`, fetcher, { refreshInterval: 60000 });
}

export function useAnalysis(days: number) {
  return useSWR<any>(`/api/entries/analysis?days=${days}`, fetcher, { refreshInterval: 60000 });
}

// ===== Chats =====

export function useChats() {
  return useSWR<any[]>('/api/chats', fetcher);
}

export function useChat(id: string | null) {
  return useSWR<any>(id ? `/api/chats/${id}` : null, fetcher);
}

// ===== Quotes =====

export function useQuote() {
  return useSWR<any>('/api/quotes/random', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
}

// ===== Tasks =====

export function useTasks(date: string) {
  return useSWR<any[]>(date ? `/api/tasks?date=${date}` : null, fetcher, { refreshInterval: 5000 });
}

// ===== Goals =====

export function useGoals() {
  return useSWR<any[]>('/api/goals', fetcher, { refreshInterval: 10000 });
}


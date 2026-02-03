import { searchEndpoints } from '@picstash/api';
import { apiClient } from '@/shared/api/client';

// Search Suggestions API
export interface SearchSuggestion {
  type: 'label' | 'keyword' | 'history';
  value: string;
  id?: string; // history ID for deletion
}

export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[];
}

export async function fetchSearchSuggestions(
  query: string,
): Promise<SearchSuggestionsResponse> {
  if (query.trim() === '') {
    return { suggestions: [] };
  }
  return await apiClient<SearchSuggestionsResponse>(
    searchEndpoints.suggestions({ q: query.trim() }),
  );
}

// Search History API
export interface SearchHistory {
  id: string;
  query: string;
  searchedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchHistoryResponse {
  history: SearchHistory[];
}

export async function saveSearchHistory(query: string): Promise<SearchHistory> {
  return await apiClient<SearchHistory>(searchEndpoints.history, {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export async function fetchSearchHistory(): Promise<SearchHistoryResponse> {
  return await apiClient<SearchHistoryResponse>(searchEndpoints.history);
}

export async function deleteSearchHistory(id: string): Promise<void> {
  await apiClient<undefined>(searchEndpoints.historyDetail(id), { method: 'DELETE' });
}

export async function deleteAllSearchHistory(): Promise<void> {
  await apiClient<undefined>(searchEndpoints.history, { method: 'DELETE' });
}

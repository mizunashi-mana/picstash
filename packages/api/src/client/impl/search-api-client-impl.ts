/**
 * Search API Client Implementation
 */

import {
  searchEndpoints,
  type SearchHistory,
  type SearchHistoryResponse,
  type SearchSuggestionsResponse,
} from '@/search.js';
import type { HttpClient } from '@/client/http-client.js';
import type { SearchApiClient } from '@/client/search-api-client.js';

export function createSearchApiClient(http: HttpClient): SearchApiClient {
  return {
    suggestions: async (query: string) =>
      await http.get<SearchSuggestionsResponse>(
        searchEndpoints.suggestions({ q: query }),
      ),

    saveHistory: async (query: string) =>
      await http.post<SearchHistory>(searchEndpoints.history, { query }),

    fetchHistory: async () =>
      await http.get<SearchHistoryResponse>(searchEndpoints.history),

    deleteHistory: async (id: string) => {
      await http.delete(searchEndpoints.historyDetail(id));
    },

    deleteAllHistory: async () => {
      await http.delete(searchEndpoints.history);
    },
  };
}

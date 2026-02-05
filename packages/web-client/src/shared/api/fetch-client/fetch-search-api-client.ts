/**
 * Fetch Search API Client
 *
 * Implements SearchApiClient interface using fetch.
 */

import {
  searchEndpoints,
  type SearchApiClient,
  type SearchHistory,
  type SearchHistoryResponse,
  type SearchSuggestionsResponse,
} from '@picstash/api';
import { type BaseHttpClient } from './base-client';

export class FetchSearchApiClient implements SearchApiClient {
  private readonly http: BaseHttpClient;

  constructor(http: BaseHttpClient) {
    this.http = http;
  }

  async suggestions(query: string): Promise<SearchSuggestionsResponse> {
    if (query.trim() === '') {
      return { suggestions: [] };
    }
    return await this.http.get<SearchSuggestionsResponse>(
      searchEndpoints.suggestions({ q: query.trim() }),
    );
  }

  async saveHistory(query: string): Promise<SearchHistory> {
    return await this.http.post<SearchHistory>(searchEndpoints.history, { query });
  }

  async fetchHistory(): Promise<SearchHistoryResponse> {
    return await this.http.get<SearchHistoryResponse>(searchEndpoints.history);
  }

  async deleteHistory(id: string): Promise<void> {
    await this.http.delete(searchEndpoints.historyDetail(id));
  }

  async deleteAllHistory(): Promise<void> {
    await this.http.delete(searchEndpoints.history);
  }
}

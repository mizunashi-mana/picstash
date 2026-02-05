/**
 * Search API Client Interface
 */

import type {
  SearchHistory,
  SearchHistoryResponse,
  SearchSuggestionsResponse,
} from '@/search.js';

export interface SearchApiClient {
  /** 検索サジェスト取得 */
  suggestions: (query: string) => Promise<SearchSuggestionsResponse>;

  /** 検索履歴保存 */
  saveHistory: (query: string) => Promise<SearchHistory>;

  /** 検索履歴一覧取得 */
  fetchHistory: () => Promise<SearchHistoryResponse>;

  /** 検索履歴削除 */
  deleteHistory: (id: string) => Promise<void>;

  /** 検索履歴全削除 */
  deleteAllHistory: () => Promise<void>;
}

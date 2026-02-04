/**
 * Search API - エンドポイント定義と型
 *
 * client と server で共有する検索関連の API 定義
 */

import { buildUrl } from './url.js';

// ============================================================
// レスポンス型
// ============================================================

/** 検索サジェスト */
export interface SearchSuggestion {
  type: 'label' | 'keyword' | 'history';
  value: string;
  /** 履歴 ID（削除用） */
  id?: string;
}

/** 検索サジェストレスポンス */
export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[];
}

/** 検索履歴 */
export interface SearchHistory {
  id: string;
  query: string;
  searchedAt: string;
  createdAt: string;
  updatedAt: string;
}

/** 検索履歴レスポンス */
export interface SearchHistoryResponse {
  history: SearchHistory[];
}

// ============================================================
// クエリパラメータ型
// ============================================================

/** 検索サジェスト取得オプション */
export type SearchSuggestionsQuery = {
  /** 検索クエリ */
  q: string;
};

// ============================================================
// エンドポイント定義
// ============================================================

/**
 * 検索エンドポイント定義
 */
export const searchEndpoints = {
  /** 検索サジェスト取得 */
  suggestions: (query: SearchSuggestionsQuery) =>
    buildUrl('/api/search/suggestions', query),

  /** 検索履歴一覧取得 (GET) / 検索履歴保存 (POST) / 全履歴削除 (DELETE) */
  history: '/api/search/history' as const,

  /** 検索履歴削除 */
  historyDetail: (id: string) => `/api/search/history/${id}` as const,

  /**
   * server 側のルート登録用パターン
   */
  routes: {
    suggestions: '/api/search/suggestions',
    history: '/api/search/history',
    historyDetail: '/api/search/history/:id',
  },
} as const;

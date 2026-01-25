import type {
  SearchHistory,
  SaveSearchHistoryInput,
} from '../../domain/search-history/index.js';

// Re-export domain types for convenience
export type { SearchHistory, SaveSearchHistoryInput };

/** Options for listing search history */
export interface SearchHistoryListOptions {
  limit?: number;
}

export interface SearchHistoryRepository {
  /** Save search history (upsert: create new or update searchedAt) */
  save: (input: SaveSearchHistoryInput) => Promise<SearchHistory>;

  /** Find search history by query (exact match) */
  findByQuery: (query: string) => Promise<SearchHistory | null>;

  /** Find search history by prefix match (for autocomplete) */
  findByPrefix: (prefix: string, limit?: number) => Promise<SearchHistory[]>;

  /** Get recent search history */
  findRecent: (options?: SearchHistoryListOptions) => Promise<SearchHistory[]>;

  /** Delete search history by ID */
  deleteById: (id: string) => Promise<void>;

  /** Delete all search history */
  deleteAll: () => Promise<void>;
}

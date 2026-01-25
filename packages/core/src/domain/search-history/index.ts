/** Search history entity */
export interface SearchHistory {
  id: string;
  query: string;
  searchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** Input for creating or updating search history */
export interface SaveSearchHistoryInput {
  query: string;
}

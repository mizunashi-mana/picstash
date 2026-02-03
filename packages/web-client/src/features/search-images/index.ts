export {
  fetchSearchSuggestions,
  saveSearchHistory,
  fetchSearchHistory,
  deleteSearchHistory,
  deleteAllSearchHistory,
} from './api/search';
export type {
  SearchSuggestion,
  SearchSuggestionsResponse,
  SearchHistory,
  SearchHistoryResponse,
} from './api/search';
export { SearchBar } from './ui/SearchBar';

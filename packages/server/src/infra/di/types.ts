import { TYPES as CORE_TYPES } from '@picstash/core';

// Re-export core types
export { TYPES as CORE_TYPES } from '@picstash/core';

// Controller-specific types (HTTP layer only)
export const CONTROLLER_TYPES = {
  ImageController: Symbol.for('ImageController'),
  ImageSimilarityController: Symbol.for('ImageSimilarityController'),
  ImageSuggestionController: Symbol.for('ImageSuggestionController'),
  ImageAttributeController: Symbol.for('ImageAttributeController'),
  LabelController: Symbol.for('LabelController'),
  CollectionController: Symbol.for('CollectionController'),
  ArchiveController: Symbol.for('ArchiveController'),
  ViewHistoryController: Symbol.for('ViewHistoryController'),
  RecommendationController: Symbol.for('RecommendationController'),
  RecommendationConversionController: Symbol.for('RecommendationConversionController'),
  StatsController: Symbol.for('StatsController'),
  SearchController: Symbol.for('SearchController'),
  UrlCrawlController: Symbol.for('UrlCrawlController'),
  JobController: Symbol.for('JobController'),
} as const;

// Combined types for backward compatibility
export const TYPES = {
  ...CORE_TYPES,
  ...CONTROLLER_TYPES,
} as const;

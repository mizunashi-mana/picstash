import { TYPES as CORE_TYPES } from '@picstash/core';

// Re-export core types
export { TYPES as CORE_TYPES } from '@picstash/core';

// Server-specific database service type (not part of core)
export const DB_TYPES = {
  PrismaService: Symbol.for('PrismaService'),
} as const;

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

// Combined types for convenience
export const TYPES = {
  ...CORE_TYPES,
  ...DB_TYPES,
  ...CONTROLLER_TYPES,
} as const;

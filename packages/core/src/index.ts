// @picstash/core - Core business logic package

// Config types (no parsing logic - that belongs in server package)
export type {
  CoreConfig,
  LoggingConfig,
  LogFileConfig,
  LogRotationConfig,
  OllamaConfig,
} from './config.js';

// DI Container
export { TYPES, CoreContainer, buildCoreContainer, createCoreContainer } from './infra/di/index.js';

// Shared utilities
export { normalizeKeywords } from './shared/normalizers/index.js';
export { isNonEmptyString, trimOrUndefined } from './shared/validators/index.js';
export { fileExists } from './shared/file-utils.js';

// Domain types
export { generateTitle } from './domain/image/index.js';
export type { Image, CreateImageInput, UpdateImageInput } from './domain/image/index.js';
export {
  ImageMimeType,
  ALLOWED_IMAGE_MIME_TYPES,
  type AllowedImageMimeType,
} from './domain/image/index.js';

// Application Use Cases
export * from './application/image/index.js';
export * from './application/label/index.js';
export * from './application/image-attribute/index.js';
export * from './application/url-crawl/index.js';
export * from './application/duplicate-detection/index.js';
export { parseSearchQuery, isEmptyQuery } from './application/search/query-parser.js';
export type { AndGroup, SearchQuery } from './application/search/query-parser.js';
export { buildSearchWhere, buildTermCondition } from './application/search/build-search-where.js';
export type { ImageSearchWhereInput } from './application/search/build-search-where.js';
export {
  generateEmbedding,
  generateMissingEmbeddings,
  removeEmbedding,
  syncEmbeddingsToVectorDb,
} from './application/embedding/generate-embedding.js';
export type {
  GenerateEmbeddingInput,
  GenerateEmbeddingResult,
  GenerateEmbeddingError,
  GenerateEmbeddingDeps,
  BatchGenerateResult,
  GenerateMissingEmbeddingsOptions,
  SyncEmbeddingsResult,
} from './application/embedding/generate-embedding.js';
export {
  generateRecommendations,
} from './application/recommendation/generate-recommendations.js';
export type {
  GenerateRecommendationsOptions,
  RecommendedImage,
  RecommendationsResult,
} from './application/recommendation/generate-recommendations.js';
export {
  suggestAttributes,
} from './application/attribute-suggestion/suggest-attributes.js';
export type {
  SuggestedKeyword,
  AttributeSuggestion,
  SuggestAttributesInput,
  SuggestAttributesResult,
  SuggestAttributesError,
  SuggestAttributesDeps,
} from './application/attribute-suggestion/suggest-attributes.js';
export {
  generateLabelEmbedding,
  generateMissingLabelEmbeddings,
  regenerateAllLabelEmbeddings,
} from './application/attribute-suggestion/generate-label-embeddings.js';
export type {
  GenerateLabelEmbeddingInput,
  GenerateLabelEmbeddingResult,
  GenerateLabelEmbeddingError,
  GenerateLabelEmbeddingDeps,
  BatchGenerateLabelResult,
  GenerateMissingLabelEmbeddingsOptions,
} from './application/attribute-suggestion/generate-label-embeddings.js';

// Domain types - Archive
export type { ArchiveEntry, ArchiveSession, ArchiveType } from './domain/archive/index.js';

// Domain types - URL Crawl
export type { CrawledImageEntry, UrlCrawlSession } from './domain/url-crawl/index.js';

// Application Ports
export type { ArchiveHandler } from './application/ports/archive-handler.js';
export type { ArchiveSessionManager } from './application/ports/archive-session-manager.js';
export type { CaptionService } from './application/ports/caption-service.js';
export type { CollectionRepository } from './application/ports/collection-repository.js';
export type { EmbeddingRepository } from './application/ports/embedding-repository.js';
export type { EmbeddingService } from './application/ports/embedding-service.js';
export type { FileStorage } from './application/ports/file-storage.js';
export type { ImageAttributeRepository } from './application/ports/image-attribute-repository.js';
export type { ImageProcessor } from './application/ports/image-processor.js';
export type { ImageRepository, ImageWithEmbedding } from './application/ports/image-repository.js';
export type { Job, JobQueue, JobStatus } from './application/ports/job-queue.js';
export type { LabelRepository } from './application/ports/label-repository.js';
export type { LlmService } from './application/ports/llm-service.js';
export type { OcrService } from './application/ports/ocr-service.js';
export type {
  RecommendationConversionRepository,
  CreateImpressionInput,
} from './application/ports/recommendation-conversion-repository.js';
export type { SearchHistoryRepository } from './application/ports/search-history-repository.js';
export type { StatsRepository } from './application/ports/stats-repository.js';
export type { UrlCrawlSessionManager } from './application/ports/url-crawl-session-manager.js';
export type { ViewHistoryRepository } from './application/ports/view-history-repository.js';

// Adapters (concrete implementations)
export * from './infra/adapters/index.js';

// AI Services
export { TransformersCaptionService } from './infra/caption/index.js';
export { ClipEmbeddingService } from './infra/embedding/clip-embedding-service.js';
export { OllamaLlmService } from './infra/llm/index.js';
export { TesseractOcrService } from './infra/ocr/index.js';

// Database
export { PrismaService, Prisma } from './infra/database/prisma-service.js';
export {
  initializeDatabase,
  connectDatabase,
  disconnectDatabase,
} from './infra/database/prisma.js';
export { EMBEDDING_DIMENSION } from './application/ports/embedding-repository.js';
export type { SimilarityResult } from './application/ports/embedding-repository.js';

// Queue
export { JobWorker } from './infra/queue/index.js';
export type { JobHandler, JobWorkerConfig } from './infra/queue/index.js';

// Workers
export {
  createCaptionJobHandler,
  CAPTION_JOB_TYPE,
  createArchiveImportJobHandler,
  ARCHIVE_IMPORT_JOB_TYPE,
} from './infra/workers/index.js';
export type {
  CaptionJobPayload,
  CaptionJobResult,
  ArchiveImportJobPayload,
  ArchiveImportJobResult,
  ArchiveImportImageResult,
} from './infra/workers/index.js';

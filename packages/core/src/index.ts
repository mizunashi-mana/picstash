// @picstash/core - Core business logic package

// Config
export { coreConfigSchema, loadCoreConfig, parseConfigArg, parseCliArgs } from './config.js';
export type { CoreConfig } from './config.js';

// DI Container
export { TYPES, CoreContainer, buildCoreContainer, createCoreContainer } from './infra/di/index.js';

// Domain (re-export from individual modules as needed)
// These will be exported when modules are properly set up

// Application Ports
export type { ArchiveHandler } from './application/ports/archive-handler.js';
export type { ArchiveSessionManager, ArchiveSession } from './application/ports/archive-session-manager.js';
export type { CaptionService } from './application/ports/caption-service.js';
export type { CollectionRepository } from './application/ports/collection-repository.js';
export type { EmbeddingRepository } from './application/ports/embedding-repository.js';
export type { EmbeddingService } from './application/ports/embedding-service.js';
export type { FileStorage } from './application/ports/file-storage.js';
export type { ImageAttributeRepository } from './application/ports/image-attribute-repository.js';
export type { ImageProcessor } from './application/ports/image-processor.js';
export type { ImageRepository } from './application/ports/image-repository.js';
export type { Job, JobQueue } from './application/ports/job-queue.js';
export type { LabelRepository } from './application/ports/label-repository.js';
export type { LlmService } from './application/ports/llm-service.js';
export type { OcrService } from './application/ports/ocr-service.js';
export type { RecommendationConversionRepository } from './application/ports/recommendation-conversion-repository.js';
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
export { prisma, connectDatabase, disconnectDatabase } from './infra/database/prisma.js';
export {
  getVectorDb,
  upsertEmbedding,
  deleteEmbedding,
  findSimilarImages,
  closeVectorDb,
  getEmbeddingCount,
  hasEmbedding,
  getAllImageIds,
  EMBEDDING_DIMENSION,
} from './infra/database/sqlite-vec.js';
export type { SimilarityResult } from './infra/database/sqlite-vec.js';

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

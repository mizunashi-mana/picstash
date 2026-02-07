/* v8 ignore start -- DI container configuration, tested through integration */
import 'reflect-metadata';
import { Container } from 'inversify';
import {
  InMemoryArchiveSessionManager,
  InMemoryUrlCrawlSessionManager,
  LocalFileStorage,
  RarArchiveHandler,
  SharpImageProcessor,
  ZipArchiveHandler,
} from '@/infra/adapters/index.js';
import { TransformersCaptionService } from '@/infra/caption/index.js';
import { TYPES } from '@/infra/di/types.js';
import { ClipEmbeddingService } from '@/infra/embedding/clip-embedding-service.js';
import { OllamaLlmService } from '@/infra/llm/index.js';
import { TesseractOcrService } from '@/infra/ocr/index.js';
import type { ArchiveHandler } from '@/application/ports/archive-handler.js';
import type { ArchiveSessionManager } from '@/application/ports/archive-session-manager.js';
import type { CaptionService } from '@/application/ports/caption-service.js';
import type { CollectionRepository } from '@/application/ports/collection-repository.js';
import type { EmbeddingRepository } from '@/application/ports/embedding-repository.js';
import type { EmbeddingService } from '@/application/ports/embedding-service.js';
import type { FileStorage } from '@/application/ports/file-storage.js';
import type { ImageAttributeRepository } from '@/application/ports/image-attribute-repository.js';
import type { ImageProcessor } from '@/application/ports/image-processor.js';
import type { ImageRepository } from '@/application/ports/image-repository.js';
import type { JobQueue } from '@/application/ports/job-queue.js';
import type { LabelRepository } from '@/application/ports/label-repository.js';
import type { LlmService } from '@/application/ports/llm-service.js';
import type { OcrService } from '@/application/ports/ocr-service.js';
import type { RecommendationConversionRepository } from '@/application/ports/recommendation-conversion-repository.js';
import type { SearchHistoryRepository } from '@/application/ports/search-history-repository.js';
import type { StatsRepository } from '@/application/ports/stats-repository.js';
import type { UrlCrawlSessionManager } from '@/application/ports/url-crawl-session-manager.js';
import type { ViewHistoryRepository } from '@/application/ports/view-history-repository.js';
import type { CoreConfig } from '@/config.js';

/**
 * Creates and configures a new inversify Container with core dependencies.
 * Does not include database/repository implementations - those are added by consuming packages.
 * Does not include HTTP controllers - those are added by the server package.
 * @param config - Core configuration
 */
export function createCoreContainer(config: CoreConfig): Container {
  const container = new Container();

  // Bind config
  container.bind<CoreConfig>(TYPES.Config).toConstantValue(config);

  // NOTE: Database and repository bindings are NOT included here.
  // Each consuming package (server, desktop-app) must bind their own
  // database service and repository implementations:
  // - TYPES.ImageRepository
  // - TYPES.LabelRepository
  // - TYPES.ImageAttributeRepository
  // - TYPES.CollectionRepository
  // - TYPES.ViewHistoryRepository
  // - TYPES.RecommendationConversionRepository
  // - TYPES.StatsRepository
  // - TYPES.SearchHistoryRepository
  // - TYPES.EmbeddingRepository
  // - TYPES.JobQueue

  // Bind storage & processing as singletons
  container
    .bind<FileStorage>(TYPES.FileStorage)
    .to(LocalFileStorage)
    .inSingletonScope();

  container
    .bind<ImageProcessor>(TYPES.ImageProcessor)
    .to(SharpImageProcessor)
    .inSingletonScope();

  // Bind archive handlers
  container.bind<ArchiveHandler>(TYPES.ArchiveHandler).to(ZipArchiveHandler);
  container.bind<ArchiveHandler>(TYPES.ArchiveHandler).to(RarArchiveHandler);

  container
    .bind<ArchiveSessionManager>(TYPES.ArchiveSessionManager)
    .to(InMemoryArchiveSessionManager)
    .inSingletonScope();

  // Bind URL crawl session manager
  container
    .bind<UrlCrawlSessionManager>(TYPES.UrlCrawlSessionManager)
    .to(InMemoryUrlCrawlSessionManager)
    .inSingletonScope();

  // Bind AI/Embedding services
  container
    .bind<EmbeddingService>(TYPES.EmbeddingService)
    .to(ClipEmbeddingService)
    .inSingletonScope();

  container
    .bind<CaptionService>(TYPES.CaptionService)
    .to(TransformersCaptionService)
    .inSingletonScope();

  container
    .bind<OcrService>(TYPES.OcrService)
    .to(TesseractOcrService)
    .inSingletonScope();

  // Bind LLM service only if ollama is configured
  if (config.ollama !== undefined) {
    container
      .bind<LlmService>(TYPES.LlmService)
      .to(OllamaLlmService)
      .inSingletonScope();
  }

  return container;
}

/**
 * Core DI container wrapper.
 * Provides type-safe accessor methods for core services.
 * Does not include HTTP controllers.
 */
export class CoreContainer {
  protected readonly container: Container;

  constructor(container: Container) {
    this.container = container;
  }

  /**
   * Get the underlying inversify container.
   * Useful for extending with additional bindings.
   */
  getContainer(): Container {
    return this.container;
  }

  // Repositories

  getImageRepository(): ImageRepository {
    return this.container.get<ImageRepository>(TYPES.ImageRepository);
  }

  getLabelRepository(): LabelRepository {
    return this.container.get<LabelRepository>(TYPES.LabelRepository);
  }

  getImageAttributeRepository(): ImageAttributeRepository {
    return this.container.get<ImageAttributeRepository>(TYPES.ImageAttributeRepository);
  }

  getCollectionRepository(): CollectionRepository {
    return this.container.get<CollectionRepository>(TYPES.CollectionRepository);
  }

  getViewHistoryRepository(): ViewHistoryRepository {
    return this.container.get<ViewHistoryRepository>(TYPES.ViewHistoryRepository);
  }

  getRecommendationConversionRepository(): RecommendationConversionRepository {
    return this.container.get<RecommendationConversionRepository>(
      TYPES.RecommendationConversionRepository,
    );
  }

  getStatsRepository(): StatsRepository {
    return this.container.get<StatsRepository>(TYPES.StatsRepository);
  }

  getSearchHistoryRepository(): SearchHistoryRepository {
    return this.container.get<SearchHistoryRepository>(TYPES.SearchHistoryRepository);
  }

  // Storage & Processing

  getFileStorage(): FileStorage {
    return this.container.get<FileStorage>(TYPES.FileStorage);
  }

  getImageProcessor(): ImageProcessor {
    return this.container.get<ImageProcessor>(TYPES.ImageProcessor);
  }

  // Archive

  getArchiveHandlers(): ArchiveHandler[] {
    return this.container.getAll<ArchiveHandler>(TYPES.ArchiveHandler);
  }

  getArchiveSessionManager(): ArchiveSessionManager {
    return this.container.get<ArchiveSessionManager>(TYPES.ArchiveSessionManager);
  }

  // URL Crawl

  getUrlCrawlSessionManager(): UrlCrawlSessionManager {
    return this.container.get<UrlCrawlSessionManager>(TYPES.UrlCrawlSessionManager);
  }

  // AI/Embedding

  getEmbeddingService(): EmbeddingService {
    return this.container.get<EmbeddingService>(TYPES.EmbeddingService);
  }

  getEmbeddingRepository(): EmbeddingRepository {
    return this.container.get<EmbeddingRepository>(TYPES.EmbeddingRepository);
  }

  getCaptionService(): CaptionService {
    return this.container.get<CaptionService>(TYPES.CaptionService);
  }

  getOcrService(): OcrService {
    return this.container.get<OcrService>(TYPES.OcrService);
  }

  // Job Queue

  getJobQueue(): JobQueue {
    return this.container.get<JobQueue>(TYPES.JobQueue);
  }
}

/**
 * Creates a new CoreContainer instance with all core dependencies configured.
 * @param config - Core configuration
 */
export function buildCoreContainer(config: CoreConfig): CoreContainer {
  const container = createCoreContainer(config);
  return new CoreContainer(container);
}
/* v8 ignore stop */

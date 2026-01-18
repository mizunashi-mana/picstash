import { createContainer } from './container.js';
import { TYPES } from './types.js';
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
import type { LabelRepository } from '@/application/ports/label-repository.js';
import type { RecommendationConversionRepository } from '@/application/ports/recommendation-conversion-repository.js';
import type { SearchHistoryRepository } from '@/application/ports/search-history-repository.js';
import type { StatsRepository } from '@/application/ports/stats-repository.js';
import type { UrlCrawlSessionManager } from '@/application/ports/url-crawl-session-manager.js';
import type { ViewHistoryRepository } from '@/application/ports/view-history-repository.js';
import type {
  ArchiveController,
  CollectionController,
  ImageAttributeController,
  ImageController,
  LabelController,
  RecommendationController,
  RecommendationConversionController,
  SearchController,
  StatsController,
  UrlCrawlController,
  ViewHistoryController,
} from '@/infra/http/controllers/index.js';
import type { Container } from 'inversify';

/**
 * Application DI container wrapper.
 * Provides type-safe accessor methods for all registered services.
 */
export class AppContainer {
  private readonly container: Container;

  constructor(container: Container) {
    this.container = container;
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

  // Controllers

  getImageController(): ImageController {
    return this.container.get<ImageController>(TYPES.ImageController);
  }

  getImageAttributeController(): ImageAttributeController {
    return this.container.get<ImageAttributeController>(TYPES.ImageAttributeController);
  }

  getLabelController(): LabelController {
    return this.container.get<LabelController>(TYPES.LabelController);
  }

  getCollectionController(): CollectionController {
    return this.container.get<CollectionController>(TYPES.CollectionController);
  }

  getArchiveController(): ArchiveController {
    return this.container.get<ArchiveController>(TYPES.ArchiveController);
  }

  getViewHistoryController(): ViewHistoryController {
    return this.container.get<ViewHistoryController>(TYPES.ViewHistoryController);
  }

  getRecommendationController(): RecommendationController {
    return this.container.get<RecommendationController>(TYPES.RecommendationController);
  }

  getRecommendationConversionController(): RecommendationConversionController {
    return this.container.get<RecommendationConversionController>(TYPES.RecommendationConversionController);
  }

  getStatsController(): StatsController {
    return this.container.get<StatsController>(TYPES.StatsController);
  }

  getSearchController(): SearchController {
    return this.container.get<SearchController>(TYPES.SearchController);
  }

  getUrlCrawlController(): UrlCrawlController {
    return this.container.get<UrlCrawlController>(TYPES.UrlCrawlController);
  }
}

/**
 * Creates a new AppContainer instance with all dependencies configured.
 */
export function buildAppContainer(): AppContainer {
  const container = createContainer();
  return new AppContainer(container);
}

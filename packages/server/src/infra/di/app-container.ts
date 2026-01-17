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
import type { StatsRepository } from '@/application/ports/stats-repository.js';
import type { ViewHistoryRepository } from '@/application/ports/view-history-repository.js';
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
}

/**
 * Creates a new AppContainer instance with all dependencies configured.
 */
export function buildAppContainer(): AppContainer {
  const container = createContainer();
  return new AppContainer(container);
}

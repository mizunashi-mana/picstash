import 'reflect-metadata';
import { Container } from 'inversify';
import {
  InMemoryArchiveSessionManager,
  InMemoryUrlCrawlSessionManager,
  LocalFileStorage,
  PrismaCollectionRepository,
  PrismaImageAttributeRepository,
  PrismaImageRepository,
  PrismaLabelRepository,
  PrismaRecommendationConversionRepository,
  PrismaStatsRepository,
  PrismaViewHistoryRepository,
  RarArchiveHandler,
  SharpImageProcessor,
  SqliteVecEmbeddingRepository,
  ZipArchiveHandler,
} from '@/infra/adapters/index.js';
import { TransformersCaptionService } from '@/infra/caption/index.js';
import { ClipEmbeddingService } from '@/infra/embedding/clip-embedding-service.js';
import {
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
import type { UrlCrawlSessionManager } from '@/application/ports/url-crawl-session-manager.js';
import type { ViewHistoryRepository } from '@/application/ports/view-history-repository.js';

/**
 * Creates and configures a new inversify Container with all dependencies.
 */
export function createContainer(): Container {
  const container = new Container();

  // Bind repositories as singletons
  container
    .bind<ImageRepository>(TYPES.ImageRepository)
    .to(PrismaImageRepository)
    .inSingletonScope();

  container
    .bind<LabelRepository>(TYPES.LabelRepository)
    .to(PrismaLabelRepository)
    .inSingletonScope();

  container
    .bind<ImageAttributeRepository>(TYPES.ImageAttributeRepository)
    .to(PrismaImageAttributeRepository)
    .inSingletonScope();

  container
    .bind<CollectionRepository>(TYPES.CollectionRepository)
    .to(PrismaCollectionRepository)
    .inSingletonScope();

  container
    .bind<ViewHistoryRepository>(TYPES.ViewHistoryRepository)
    .to(PrismaViewHistoryRepository)
    .inSingletonScope();

  container
    .bind<RecommendationConversionRepository>(
      TYPES.RecommendationConversionRepository,
    )
    .to(PrismaRecommendationConversionRepository)
    .inSingletonScope();

  container
    .bind<StatsRepository>(TYPES.StatsRepository)
    .to(PrismaStatsRepository)
    .inSingletonScope();

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
    .bind<EmbeddingRepository>(TYPES.EmbeddingRepository)
    .to(SqliteVecEmbeddingRepository)
    .inSingletonScope();

  container
    .bind<CaptionService>(TYPES.CaptionService)
    .to(TransformersCaptionService)
    .inSingletonScope();

  // Bind Controllers
  container.bind<ImageController>(TYPES.ImageController).to(ImageController);
  container.bind<ImageAttributeController>(TYPES.ImageAttributeController).to(ImageAttributeController);
  container.bind<LabelController>(TYPES.LabelController).to(LabelController);
  container.bind<CollectionController>(TYPES.CollectionController).to(CollectionController);
  container.bind<ArchiveController>(TYPES.ArchiveController).to(ArchiveController);
  container.bind<ViewHistoryController>(TYPES.ViewHistoryController).to(ViewHistoryController);
  container.bind<RecommendationController>(TYPES.RecommendationController).to(RecommendationController);
  container.bind<RecommendationConversionController>(TYPES.RecommendationConversionController).to(RecommendationConversionController);
  container.bind<StatsController>(TYPES.StatsController).to(StatsController);
  container.bind<SearchController>(TYPES.SearchController).to(SearchController);
  container.bind<UrlCrawlController>(TYPES.UrlCrawlController).to(UrlCrawlController);

  return container;
}

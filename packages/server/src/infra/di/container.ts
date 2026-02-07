import 'reflect-metadata';
import { createCoreContainer, TYPES } from '@picstash/core';
import {
  PrismaCollectionRepository,
  PrismaImageAttributeRepository,
  PrismaImageRepository,
  PrismaJobQueue,
  PrismaLabelRepository,
  PrismaRecommendationConversionRepository,
  PrismaSearchHistoryRepository,
  PrismaStatsRepository,
  PrismaViewHistoryRepository,
  SqliteVecEmbeddingRepository,
} from '@/infra/adapters/index.js';
import { PrismaService } from '@/infra/database/index.js';
import {
  ArchiveController,
  CollectionController,
  ImageAttributeController,
  ImageController,
  ImageSimilarityController,
  ImageSuggestionController,
  JobController,
  LabelController,
  RecommendationController,
  RecommendationConversionController,
  SearchController,
  StatsController,
  UrlCrawlController,
  ViewHistoryController,
} from '@/infra/http/controllers/index.js';
import { CONTROLLER_TYPES } from './types.js';
import type { Config } from '@/config.js';
import type {
  CollectionRepository,
  EmbeddingRepository,
  ImageAttributeRepository,
  ImageRepository,
  JobQueue,
  LabelRepository,
  RecommendationConversionRepository,
  SearchHistoryRepository,
  StatsRepository,
  ViewHistoryRepository,
} from '@picstash/core';
import type { Container } from 'inversify';

/**
 * Rebind database and repository implementations with server-local implementations.
 * This allows the server package to use its own Prisma schema and generated client.
 */
async function rebindRepositories(container: Container): Promise<void> {
  // Unbind core's repository bindings
  await Promise.all([
    container.unbind(TYPES.PrismaService),
    container.unbind(TYPES.ImageRepository),
    container.unbind(TYPES.LabelRepository),
    container.unbind(TYPES.ImageAttributeRepository),
    container.unbind(TYPES.CollectionRepository),
    container.unbind(TYPES.ViewHistoryRepository),
    container.unbind(TYPES.RecommendationConversionRepository),
    container.unbind(TYPES.StatsRepository),
    container.unbind(TYPES.SearchHistoryRepository),
    container.unbind(TYPES.EmbeddingRepository),
    container.unbind(TYPES.JobQueue),
  ]);

  // Rebind with server-local implementations
  container
    .bind<PrismaService>(TYPES.PrismaService)
    .to(PrismaService)
    .inSingletonScope();

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
    .bind<RecommendationConversionRepository>(TYPES.RecommendationConversionRepository)
    .to(PrismaRecommendationConversionRepository)
    .inSingletonScope();

  container
    .bind<StatsRepository>(TYPES.StatsRepository)
    .to(PrismaStatsRepository)
    .inSingletonScope();

  container
    .bind<SearchHistoryRepository>(TYPES.SearchHistoryRepository)
    .to(PrismaSearchHistoryRepository)
    .inSingletonScope();

  container
    .bind<EmbeddingRepository>(TYPES.EmbeddingRepository)
    .to(SqliteVecEmbeddingRepository)
    .inSingletonScope();

  container
    .bind<JobQueue>(TYPES.JobQueue)
    .to(PrismaJobQueue)
    .inSingletonScope();
}

/**
 * Creates and configures a new inversify Container with all dependencies.
 * Extends core container with HTTP controllers.
 * @param config - Application configuration
 */
export async function createContainer(config: Config): Promise<Container> {
  // Create core container with all core services
  const container = createCoreContainer(config);

  // Rebind database and repository implementations with local implementations
  // This allows server to use its own Prisma schema and generated client
  await rebindRepositories(container);

  // Bind Controllers (HTTP layer specific)
  container.bind(CONTROLLER_TYPES.ImageController).to(ImageController);
  container.bind(CONTROLLER_TYPES.ImageSimilarityController).to(ImageSimilarityController);
  container.bind(CONTROLLER_TYPES.ImageSuggestionController).to(ImageSuggestionController);
  container.bind(CONTROLLER_TYPES.ImageAttributeController).to(ImageAttributeController);
  container.bind(CONTROLLER_TYPES.LabelController).to(LabelController);
  container.bind(CONTROLLER_TYPES.CollectionController).to(CollectionController);
  container.bind(CONTROLLER_TYPES.ArchiveController).to(ArchiveController);
  container.bind(CONTROLLER_TYPES.ViewHistoryController).to(ViewHistoryController);
  container.bind(CONTROLLER_TYPES.RecommendationController).to(RecommendationController);
  container.bind(CONTROLLER_TYPES.RecommendationConversionController).to(RecommendationConversionController);
  container.bind(CONTROLLER_TYPES.StatsController).to(StatsController);
  container.bind(CONTROLLER_TYPES.SearchController).to(SearchController);
  container.bind(CONTROLLER_TYPES.UrlCrawlController).to(UrlCrawlController);
  container.bind(CONTROLLER_TYPES.JobController).to(JobController);

  return container;
}

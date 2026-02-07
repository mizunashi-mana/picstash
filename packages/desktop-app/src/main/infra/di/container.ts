import 'reflect-metadata';
import { buildCoreContainer } from '@picstash/core';
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
} from '@desktop-app/main/infra/adapters/index.js';
import { TYPES } from '@desktop-app/main/infra/di/types.js';
import type { PrismaService } from '@desktop-app/main/infra/database/index.js';
import type {
  CollectionRepository,
  CoreConfig,
  CoreContainer,
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

/**
 * Bind database and repository implementations with desktop-app-local implementations.
 * This allows the desktop-app package to use its own Prisma schema and generated client.
 * @param coreContainer - The core container to extend
 * @param prismaService - The PrismaService instance (created externally with user-selected path)
 */
export function bindRepositories(
  coreContainer: CoreContainer,
  prismaService: PrismaService,
): void {
  const container = coreContainer.getContainer();

  // Bind the externally-created PrismaService instance
  container
    .bind<PrismaService>(TYPES.PrismaService)
    .toConstantValue(prismaService);

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
 * Creates and configures a new CoreContainer with all dependencies for desktop-app.
 * Extends core container with desktop-app specific repository implementations.
 * @param config - Application configuration
 * @param prismaService - The PrismaService instance (created externally with user-selected path)
 */
export function createDesktopContainer(
  config: CoreConfig,
  prismaService: PrismaService,
): CoreContainer {
  // Create core container with all core services
  const coreContainer = buildCoreContainer(config);

  // Bind database and repository implementations with local implementations
  bindRepositories(coreContainer, prismaService);

  return coreContainer;
}

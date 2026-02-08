/* v8 ignore start -- DI container configuration */
import { CoreContainer } from '@picstash/core';
import { createContainer } from './container.js';
import { CONTROLLER_TYPES, TYPES } from './types.js';
import type { Config } from '@/config.js';
import type { PrismaService } from '@/infra/database/prisma-service.js';
import type {
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

/**
 * Application DI container wrapper.
 * Extends CoreContainer with HTTP controller accessor methods.
 */
export class AppContainer extends CoreContainer {
  // Database Service

  getDatabaseService(): PrismaService {
    return this.container.get<PrismaService>(TYPES.PrismaService);
  }

  // Controllers

  getImageController(): ImageController {
    return this.container.get<ImageController>(CONTROLLER_TYPES.ImageController);
  }

  getImageSimilarityController(): ImageSimilarityController {
    return this.container.get<ImageSimilarityController>(CONTROLLER_TYPES.ImageSimilarityController);
  }

  getImageSuggestionController(): ImageSuggestionController {
    return this.container.get<ImageSuggestionController>(CONTROLLER_TYPES.ImageSuggestionController);
  }

  getImageAttributeController(): ImageAttributeController {
    return this.container.get<ImageAttributeController>(CONTROLLER_TYPES.ImageAttributeController);
  }

  getLabelController(): LabelController {
    return this.container.get<LabelController>(CONTROLLER_TYPES.LabelController);
  }

  getCollectionController(): CollectionController {
    return this.container.get<CollectionController>(CONTROLLER_TYPES.CollectionController);
  }

  getArchiveController(): ArchiveController {
    return this.container.get<ArchiveController>(CONTROLLER_TYPES.ArchiveController);
  }

  getViewHistoryController(): ViewHistoryController {
    return this.container.get<ViewHistoryController>(CONTROLLER_TYPES.ViewHistoryController);
  }

  getRecommendationController(): RecommendationController {
    return this.container.get<RecommendationController>(CONTROLLER_TYPES.RecommendationController);
  }

  getRecommendationConversionController(): RecommendationConversionController {
    return this.container.get<RecommendationConversionController>(CONTROLLER_TYPES.RecommendationConversionController);
  }

  getStatsController(): StatsController {
    return this.container.get<StatsController>(CONTROLLER_TYPES.StatsController);
  }

  getSearchController(): SearchController {
    return this.container.get<SearchController>(CONTROLLER_TYPES.SearchController);
  }

  getUrlCrawlController(): UrlCrawlController {
    return this.container.get<UrlCrawlController>(CONTROLLER_TYPES.UrlCrawlController);
  }

  getJobController(): JobController {
    return this.container.get<JobController>(CONTROLLER_TYPES.JobController);
  }
}

/**
 * Creates a new AppContainer instance with all dependencies configured.
 * @param config - Application configuration
 */
export function buildAppContainer(config: Config): AppContainer {
  const container = createContainer(config);
  return new AppContainer(container);
}
/* v8 ignore stop */

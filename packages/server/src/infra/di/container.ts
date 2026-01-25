import 'reflect-metadata';
import { createCoreContainer } from '@picstash/core';
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
import type { Container } from 'inversify';

/**
 * Creates and configures a new inversify Container with all dependencies.
 * Extends core container with HTTP controllers.
 * @param config - Application configuration
 */
export function createContainer(config: Config): Container {
  // Create core container with all core services
  const container = createCoreContainer(config);

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

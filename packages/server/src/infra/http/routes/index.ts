import { healthRoutes } from '@/infra/http/routes/health.js';
import type { AppContainer } from '@/infra/di/index.js';
import type { FastifyInstance } from 'fastify';

export function registerRoutes(app: FastifyInstance, container: AppContainer): void {
  // Health check (no prefix, needs PrismaService for database check)
  healthRoutes(app, container.getPrismaService());

  // Register controllers with inversify DI
  container.getImageController().registerRoutes(app);
  container.getImageSimilarityController().registerRoutes(app);
  container.getImageSuggestionController().registerRoutes(app);
  container.getImageAttributeController().registerRoutes(app);
  container.getLabelController().registerRoutes(app);
  container.getCollectionController().registerRoutes(app);
  container.getArchiveController().registerRoutes(app);
  container.getViewHistoryController().registerRoutes(app);
  container.getRecommendationController().registerRoutes(app);
  container.getRecommendationConversionController().registerRoutes(app);
  container.getStatsController().registerRoutes(app);
  container.getSearchController().registerRoutes(app);
  container.getUrlCrawlController().registerRoutes(app);
  container.getJobController().registerRoutes(app);
}

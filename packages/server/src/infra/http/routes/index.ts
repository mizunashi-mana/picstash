import { archiveRoutes } from '@/infra/http/routes/archives.js';
import { collectionRoutes } from '@/infra/http/routes/collections.js';
import { healthRoutes } from '@/infra/http/routes/health.js';
import { imageAttributeRoutes } from '@/infra/http/routes/image-attributes.js';
import { imageRoutes } from '@/infra/http/routes/images.js';
import { labelRoutes } from '@/infra/http/routes/labels.js';
import { recommendationConversionRoutes } from '@/infra/http/routes/recommendation-conversions.js';
import { recommendationRoutes } from '@/infra/http/routes/recommendations.js';
import { statsRoutes } from '@/infra/http/routes/stats.js';
import { viewHistoryRoutes } from '@/infra/http/routes/view-history.js';
import type { AppContainer } from '@/infra/di/index.js';
import type { FastifyInstance } from 'fastify';

export function registerRoutes(app: FastifyInstance, container: AppContainer): void {
  // Health check (no prefix, no container dependency)
  healthRoutes(app);

  // Image routes
  imageRoutes(app, container);

  // Image attribute routes
  imageAttributeRoutes(app, container);

  // Label routes
  labelRoutes(app, container);

  // Collection routes
  collectionRoutes(app, container);

  // Archive routes
  archiveRoutes(app, container);

  // View history routes
  viewHistoryRoutes(app, container);

  // Recommendation routes
  recommendationRoutes(app, container);

  // Recommendation conversion routes
  recommendationConversionRoutes(app, container);

  // Stats routes
  statsRoutes(app, container);
}

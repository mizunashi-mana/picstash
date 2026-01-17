import type { AppContainer } from '@/infra/di/index.js';
import type { FastifyInstance } from 'fastify';

interface StatsQuery {
  days?: string;
}

interface PopularImagesQuery {
  days?: string;
  limit?: string;
}

export function statsRoutes(app: FastifyInstance, container: AppContainer): void {
  const statsRepository = container.getStatsRepository();

  // Get overview statistics
  app.get<{ Querystring: StatsQuery }>('/api/stats/overview', async (request, reply) => {
    const days
      = request.query.days !== undefined && request.query.days !== ''
        ? parseInt(request.query.days, 10)
        : undefined;

    if (days !== undefined && (isNaN(days) || days < 1)) {
      return await reply.status(400).send({
        error: 'Bad Request',
        message: 'Days must be a positive number',
      });
    }

    const stats = await statsRepository.getOverview({ days });
    return await reply.send(stats);
  });

  // Get daily view trends
  app.get<{ Querystring: StatsQuery }>('/api/stats/view-trends', async (request, reply) => {
    const days
      = request.query.days !== undefined && request.query.days !== ''
        ? parseInt(request.query.days, 10)
        : undefined;

    if (days !== undefined && (isNaN(days) || days < 1)) {
      return await reply.status(400).send({
        error: 'Bad Request',
        message: 'Days must be a positive number',
      });
    }

    const trends = await statsRepository.getViewTrends({ days });
    return await reply.send(trends);
  });

  // Get daily recommendation trends
  app.get<{ Querystring: StatsQuery }>(
    '/api/stats/recommendation-trends',
    async (request, reply) => {
      const days
        = request.query.days !== undefined && request.query.days !== ''
          ? parseInt(request.query.days, 10)
          : undefined;

      if (days !== undefined && (isNaN(days) || days < 1)) {
        return await reply.status(400).send({
          error: 'Bad Request',
          message: 'Days must be a positive number',
        });
      }

      const trends = await statsRepository.getRecommendationTrends({ days });
      return await reply.send(trends);
    },
  );

  // Get popular images
  app.get<{ Querystring: PopularImagesQuery }>(
    '/api/stats/popular-images',
    async (request, reply) => {
      const days
        = request.query.days !== undefined && request.query.days !== ''
          ? parseInt(request.query.days, 10)
          : undefined;

      const limit
        = request.query.limit !== undefined && request.query.limit !== ''
          ? parseInt(request.query.limit, 10)
          : undefined;

      if (days !== undefined && (isNaN(days) || days < 1)) {
        return await reply.status(400).send({
          error: 'Bad Request',
          message: 'Days must be a positive number',
        });
      }

      if (limit !== undefined && (isNaN(limit) || limit < 1 || limit > 100)) {
        return await reply.status(400).send({
          error: 'Bad Request',
          message: 'Limit must be a positive number not greater than 100',
        });
      }

      const images = await statsRepository.getPopularImages({ days, limit });
      return await reply.send(images);
    },
  );
}

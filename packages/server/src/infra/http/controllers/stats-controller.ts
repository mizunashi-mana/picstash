import { inject, injectable } from 'inversify';
import { TYPES } from '@/infra/di/types.js';
import type { StatsRepository } from '@/application/ports/stats-repository.js';
import type { FastifyInstance } from 'fastify';

interface StatsQuery {
  days?: string;
}

interface PopularImagesQuery {
  days?: string;
  limit?: string;
}

@injectable()
export class StatsController {
  constructor(
    @inject(TYPES.StatsRepository) private readonly statsRepository: StatsRepository,
  ) {}

  registerRoutes(app: FastifyInstance): void {
    // Get overview statistics
    app.get<{ Querystring: StatsQuery }>('/api/stats/overview', async (request, reply) => {
      const days
        = request.query.days !== undefined && request.query.days !== ''
          ? parseInt(request.query.days, 10)
          : undefined;

      if (days !== undefined && (isNaN(days) || days < 1 || days > 365)) {
        return await reply.status(400).send({
          error: 'Bad Request',
          message: 'Days must be a positive number not greater than 365',
        });
      }

      const stats = await this.statsRepository.getOverview({ days });
      return await reply.send(stats);
    });

    // Get daily view trends
    app.get<{ Querystring: StatsQuery }>('/api/stats/view-trends', async (request, reply) => {
      const days
        = request.query.days !== undefined && request.query.days !== ''
          ? parseInt(request.query.days, 10)
          : undefined;

      if (days !== undefined && (isNaN(days) || days < 1 || days > 365)) {
        return await reply.status(400).send({
          error: 'Bad Request',
          message: 'Days must be a positive number not greater than 365',
        });
      }

      const trends = await this.statsRepository.getViewTrends({ days });
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

        if (days !== undefined && (isNaN(days) || days < 1 || days > 365)) {
          return await reply.status(400).send({
            error: 'Bad Request',
            message: 'Days must be a positive number not greater than 365',
          });
        }

        const trends = await this.statsRepository.getRecommendationTrends({ days });
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

        if (days !== undefined && (isNaN(days) || days < 1 || days > 365)) {
          return await reply.status(400).send({
            error: 'Bad Request',
            message: 'Days must be a positive number not greater than 365',
          });
        }

        if (limit !== undefined && (isNaN(limit) || limit < 1 || limit > 100)) {
          return await reply.status(400).send({
            error: 'Bad Request',
            message: 'Limit must be a positive number not greater than 100',
          });
        }

        const images = await this.statsRepository.getPopularImages({ days, limit });
        return await reply.send(images);
      },
    );
  }
}

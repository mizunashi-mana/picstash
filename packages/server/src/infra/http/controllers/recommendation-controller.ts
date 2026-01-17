import { inject, injectable } from 'inversify';
import { generateRecommendations } from '@/application/recommendation/generate-recommendations.js';
import { TYPES } from '@/infra/di/types.js';
import type { EmbeddingRepository } from '@/application/ports/embedding-repository.js';
import type { ImageRepository } from '@/application/ports/image-repository.js';
import type { ViewHistoryRepository } from '@/application/ports/view-history-repository.js';
import type { FastifyInstance } from 'fastify';

interface RecommendationsQuery {
  limit?: string;
  historyDays?: string;
}

@injectable()
export class RecommendationController {
  constructor(
    @inject(TYPES.ViewHistoryRepository) private readonly viewHistoryRepository: ViewHistoryRepository,
    @inject(TYPES.ImageRepository) private readonly imageRepository: ImageRepository,
    @inject(TYPES.EmbeddingRepository) private readonly embeddingRepository: EmbeddingRepository,
  ) {}

  registerRoutes(app: FastifyInstance): void {
    // Get recommendations
    app.get<{ Querystring: RecommendationsQuery }>(
      '/api/recommendations',
      async (request, reply) => {
        const limit
          = request.query.limit !== undefined && request.query.limit !== ''
            ? parseInt(request.query.limit, 10)
            : undefined;
        const historyDays
          = request.query.historyDays !== undefined
            && request.query.historyDays !== ''
            ? parseInt(request.query.historyDays, 10)
            : undefined;

        // Validate parsed values
        if (limit !== undefined && (isNaN(limit) || limit < 1 || limit > 100)) {
          return await reply.status(400).send({
            error: 'Bad Request',
            message: 'Limit must be a positive number not greater than 100',
          });
        }

        if (
          historyDays !== undefined
          && (isNaN(historyDays) || historyDays < 1)
        ) {
          return await reply.status(400).send({
            error: 'Bad Request',
            message: 'History days must be a positive number',
          });
        }

        const result = await generateRecommendations(
          this.viewHistoryRepository,
          this.imageRepository,
          this.embeddingRepository,
          { limit, historyDays },
        );

        return await reply.send(result);
      },
    );
  }
}

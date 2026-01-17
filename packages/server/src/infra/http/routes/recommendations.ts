import { generateRecommendations } from '@/application/recommendation/generate-recommendations.js';
import type { AppContainer } from '@/infra/di/index.js';
import type { FastifyInstance } from 'fastify';

interface RecommendationsQuery {
  limit?: string;
  historyDays?: string;
}

export function recommendationRoutes(
  app: FastifyInstance,
  container: AppContainer,
): void {
  const viewHistoryRepo = container.getViewHistoryRepository();
  const imageRepo = container.getImageRepository();
  const embeddingRepo = container.getEmbeddingRepository();

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
        viewHistoryRepo,
        imageRepo,
        embeddingRepo,
        { limit, historyDays },
      );

      return await reply.send(result);
    },
  );
}

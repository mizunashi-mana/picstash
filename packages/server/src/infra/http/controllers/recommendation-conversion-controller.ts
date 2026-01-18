import { inject, injectable } from 'inversify';
import { TYPES } from '@/infra/di/types.js';
import { Prisma } from '@~generated/prisma/client.js';
import type { CreateImpressionInput, RecommendationConversionRepository } from '@/application/ports/recommendation-conversion-repository.js';
import type { FastifyInstance } from 'fastify';

interface RecommendationInput {
  imageId: unknown;
  score: unknown;
}

interface CreateImpressionsBody {
  recommendations: RecommendationInput[];
}

interface RecordClickBody {
  viewHistoryId: unknown;
}

interface GetStatsQuery {
  days?: string;
}

/** Type guard for validated recommendation input */
function isValidRecommendation(
  rec: RecommendationInput,
): rec is { imageId: string; score: number } {
  return (
    typeof rec.imageId === 'string'
    && rec.imageId.trim() !== ''
    && typeof rec.score === 'number'
    && Number.isFinite(rec.score)
    && rec.score >= 0
    && rec.score <= 1
  );
}

@injectable()
export class RecommendationConversionController {
  constructor(
    @inject(TYPES.RecommendationConversionRepository) private readonly conversionRepository: RecommendationConversionRepository,
  ) {}

  registerRoutes(app: FastifyInstance): void {
    // Create impression records for displayed recommendations
    app.post<{ Body: CreateImpressionsBody }>(
      '/api/recommendation-conversions/impressions',
      async (request, reply) => {
        const { recommendations } = request.body;

        if (!Array.isArray(recommendations) || recommendations.length === 0) {
          return await reply.status(400).send({
            error: 'Bad Request',
            message: 'At least one recommendation is required',
          });
        }

        // Limit array size to prevent resource exhaustion
        const MAX_RECOMMENDATIONS = 100;
        if (recommendations.length > MAX_RECOMMENDATIONS) {
          return await reply.status(400).send({
            error: 'Bad Request',
            message: `Too many recommendations (max ${MAX_RECOMMENDATIONS})`,
          });
        }

        // Validate and transform recommendations
        const validatedInputs: CreateImpressionInput[] = [];
        for (const rec of recommendations) {
          if (!isValidRecommendation(rec)) {
            return await reply.status(400).send({
              error: 'Bad Request',
              message: 'Each recommendation must have a valid imageId (string) and score (0-1)',
            });
          }
          validatedInputs.push({
            imageId: rec.imageId.trim(),
            score: rec.score,
          });
        }

        // Create impressions (missing images are silently skipped)
        const conversions
          = await this.conversionRepository.createImpressions(validatedInputs);

        return await reply.status(201).send({
          ids: conversions.map(c => c.id),
        });
      },
    );

    // Record a click on a recommendation
    app.patch<{ Params: { id: string }; Body: RecordClickBody }>(
      '/api/recommendation-conversions/:id/click',
      async (request, reply) => {
        const { id } = request.params;
        const { viewHistoryId } = request.body;

        if (typeof viewHistoryId !== 'string' || viewHistoryId.trim() === '') {
          return await reply.status(400).send({
            error: 'Bad Request',
            message: 'viewHistoryId is required',
          });
        }

        const existing = await this.conversionRepository.findById(id);
        if (existing === null) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Recommendation conversion record not found',
          });
        }

        // Already clicked
        if (existing.clickedAt !== null) {
          return await reply.status(409).send({
            error: 'Conflict',
            message: 'This recommendation has already been clicked',
          });
        }

        try {
          const conversion = await this.conversionRepository.recordClick(id, {
            viewHistoryId: viewHistoryId.trim(),
          });
          return await reply.send(conversion);
        }
        catch (error) {
          // Handle view history not found (P2003: Foreign key constraint violation)
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return await reply.status(404).send({
              error: 'Not Found',
              message: 'View history record not found',
            });
          }
          throw error;
        }
      },
    );

    // Get conversion statistics
    app.get<{ Querystring: GetStatsQuery }>(
      '/api/recommendation-conversions/stats',
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

        const stats = await this.conversionRepository.getStats({ days });
        return await reply.send(stats);
      },
    );
  }
}

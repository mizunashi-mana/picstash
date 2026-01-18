import 'reflect-metadata';
import { injectable } from 'inversify';
import { prisma } from '@/infra/database/prisma.js';
import { Prisma } from '@~generated/prisma/client.js';
import type {
  RecommendationConversion,
  CreateImpressionInput,
  RecordClickInput,
  ConversionStats,
  RecommendationConversionRepository,
  ConversionStatsOptions,
} from '@/application/ports/recommendation-conversion-repository.js';

@injectable()
export class PrismaRecommendationConversionRepository implements RecommendationConversionRepository {
  async createImpressions(
    inputs: CreateImpressionInput[],
  ): Promise<RecommendationConversion[]> {
    const now = new Date();

    // Create impressions individually, skipping any that fail due to missing images
    const results: RecommendationConversion[] = [];

    for (const input of inputs) {
      try {
        const record = await prisma.recommendationConversion.create({
          data: {
            imageId: input.imageId,
            recommendationScore: input.score,
            impressionAt: now,
          },
        });
        results.push(record);
      }
      catch (error) {
        // Skip if image doesn't exist (foreign key constraint violation)
        if (
          error instanceof Prisma.PrismaClientKnownRequestError
          && error.code === 'P2003'
        ) {
          continue;
        }
        throw error;
      }
    }

    return results;
  }

  async findById(id: string): Promise<RecommendationConversion | null> {
    return await prisma.recommendationConversion.findUnique({
      where: { id },
    });
  }

  async recordClick(
    id: string,
    input: RecordClickInput,
  ): Promise<RecommendationConversion> {
    return await prisma.recommendationConversion.update({
      where: { id },
      data: {
        clickedAt: new Date(),
        viewHistoryId: input.viewHistoryId,
      },
    });
  }

  async getStats(options?: ConversionStatsOptions): Promise<ConversionStats> {
    const days = options?.days ?? 30;
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - days);

    // Get total impressions and clicks
    const totals = await prisma.recommendationConversion.aggregate({
      where: {
        impressionAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      _count: {
        _all: true,
      },
    });

    const clicks = await prisma.recommendationConversion.count({
      where: {
        impressionAt: {
          gte: periodStart,
          lte: periodEnd,
        },
        clickedAt: { not: null },
      },
    });

    // Get average duration for clicked recommendations
    const avgDuration = await prisma.viewHistory.aggregate({
      where: {
        recommendationConversion: {
          impressionAt: {
            gte: periodStart,
            lte: periodEnd,
          },
          clickedAt: { not: null },
        },
        duration: { not: null },
      },
      _avg: {
        duration: true,
      },
    });

    const totalImpressions = totals._count._all;
    const conversionRate
      = totalImpressions > 0 ? clicks / totalImpressions : 0;

    return {
      totalImpressions,
      totalClicks: clicks,
      conversionRate,
      avgClickedDuration: avgDuration._avg.duration ?? null,
      periodStart,
      periodEnd,
    };
  }
}

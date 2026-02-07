import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '@desktop-app/main/infra/di/types.js';
import { Prisma } from '@~generated/prisma/client.js';
import type { PrismaService } from '@desktop-app/main/infra/database/prisma-service.js';
import type {
  RecommendationConversion,
  CreateImpressionInput,
  RecordClickInput,
  ConversionStats,
  RecommendationConversionRepository,
  ConversionStatsOptions,
} from '@picstash/core';
import type { PrismaClient } from '@~generated/prisma/client.js';

@injectable()
export class PrismaRecommendationConversionRepository implements RecommendationConversionRepository {
  private readonly prisma: PrismaClient;

  constructor(@inject(TYPES.PrismaService) prismaService: PrismaService) {
    this.prisma = prismaService.getClient();
  }

  async createImpressions(
    inputs: CreateImpressionInput[],
  ): Promise<RecommendationConversion[]> {
    const now = new Date();

    // Create impressions individually, skipping any that fail due to missing images
    const results: RecommendationConversion[] = [];

    for (const input of inputs) {
      try {
        const record = await this.prisma.recommendationConversion.create({
          data: {
            imageId: input.imageId,
            recommendationScore: input.score,
            impressionAt: now,
          },
        });
        results.push(record);
      }
      catch (error: unknown) {
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
    return await this.prisma.recommendationConversion.findUnique({
      where: { id },
    });
  }

  async recordClick(
    id: string,
    input: RecordClickInput,
  ): Promise<RecommendationConversion> {
    return await this.prisma.recommendationConversion.update({
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
    const totals = await this.prisma.recommendationConversion.aggregate({
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

    const clicks = await this.prisma.recommendationConversion.count({
      where: {
        impressionAt: {
          gte: periodStart,
          lte: periodEnd,
        },
        clickedAt: { not: null },
      },
    });

    // Get average duration for clicked recommendations
    const avgDuration = await this.prisma.viewHistory.aggregate({
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

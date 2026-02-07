import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '@desktop-app/main/infra/di/types.js';
import type { PrismaService } from '@desktop-app/main/infra/database/prisma-service.js';
import type {
  OverviewStats,
  DailyViewStats,
  DailyRecommendationStats,
  PopularImage,
  StatsRepository,
  TrendOptions,
  PopularImagesOptions,
} from '@picstash/core';
import type { PrismaClient } from '@~generated/prisma/client.js';

/** Format a date as YYYY-MM-DD in local timezone */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Generate an array of date strings for the given period (in local timezone) */
function generateDateRange(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(formatLocalDate(date));
  }
  return dates;
}

@injectable()
export class PrismaStatsRepository implements StatsRepository {
  private readonly prisma: PrismaClient;

  constructor(@inject(TYPES.PrismaService) prismaService: PrismaService) {
    this.prisma = prismaService.getClient();
  }

  async getOverview(options?: TrendOptions): Promise<OverviewStats> {
    const days = options?.days ?? 30;
    const periodStart = new Date();
    periodStart.setHours(0, 0, 0, 0);
    periodStart.setDate(periodStart.getDate() - (days - 1));

    // Get total images
    const totalImages = await this.prisma.image.count();

    // Get view stats for the period
    const viewStats = await this.prisma.viewHistory.aggregate({
      where: {
        viewedAt: { gte: periodStart },
      },
      _count: { _all: true },
      _sum: { duration: true },
      _avg: { duration: true },
    });

    // Get recommendation conversion stats for the period
    const totalImpressions = await this.prisma.recommendationConversion.count({
      where: {
        impressionAt: { gte: periodStart },
      },
    });

    const totalClicks = await this.prisma.recommendationConversion.count({
      where: {
        impressionAt: { gte: periodStart },
        clickedAt: { not: null },
      },
    });

    const conversionRate
      = totalImpressions > 0 ? totalClicks / totalImpressions : 0;

    return {
      totalImages,
      totalViews: viewStats._count._all,
      totalViewDuration: viewStats._sum.duration ?? 0,
      conversionRate,
      avgViewDuration: viewStats._avg.duration ?? null,
    };
  }

  async getViewTrends(options?: TrendOptions): Promise<DailyViewStats[]> {
    const days = options?.days ?? 30;
    const periodStart = new Date();
    periodStart.setHours(0, 0, 0, 0);
    periodStart.setDate(periodStart.getDate() - (days - 1));

    // Use raw query to group by date
    // Note: Prisma's tagged template $queryRaw automatically parameterizes values
    const results = await this.prisma.$queryRaw<
      Array<{
        date: string;
        view_count: bigint;
        total_duration: bigint | null;
      }>
    >`
      SELECT
        date(viewed_at, 'localtime') as date,
        COUNT(*) as view_count,
        SUM(duration) as total_duration
      FROM "view_history"
      WHERE viewed_at >= ${periodStart}
      GROUP BY date(viewed_at, 'localtime')
      ORDER BY date ASC
    `;

    // Create a map of existing data
    const dataMap = new Map(
      results.map(row => [
        row.date,
        {
          viewCount: Number(row.view_count),
          totalDuration: Number(row.total_duration ?? 0),
        },
      ]),
    );

    // Fill in all dates in the range
    const allDates = generateDateRange(days);
    return allDates.map(date => ({
      date,
      viewCount: dataMap.get(date)?.viewCount ?? 0,
      totalDuration: dataMap.get(date)?.totalDuration ?? 0,
    }));
  }

  async getRecommendationTrends(
    options?: TrendOptions,
  ): Promise<DailyRecommendationStats[]> {
    const days = options?.days ?? 30;
    const periodStart = new Date();
    periodStart.setHours(0, 0, 0, 0);
    periodStart.setDate(periodStart.getDate() - (days - 1));

    // Use raw query to group by date
    // Note: Prisma's tagged template $queryRaw automatically parameterizes values
    const results = await this.prisma.$queryRaw<
      Array<{
        date: string;
        impressions: bigint;
        clicks: bigint;
      }>
    >`
      SELECT
        date(impression_at, 'localtime') as date,
        COUNT(*) as impressions,
        SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) as clicks
      FROM "recommendation_conversion"
      WHERE impression_at >= ${periodStart}
      GROUP BY date(impression_at, 'localtime')
      ORDER BY date ASC
    `;

    // Create a map of existing data
    const dataMap = new Map(
      results.map((row) => {
        const impressions = Number(row.impressions);
        const clicks = Number(row.clicks);
        return [
          row.date,
          {
            impressions,
            clicks,
            conversionRate: impressions > 0 ? clicks / impressions : 0,
          },
        ];
      }),
    );

    // Fill in all dates in the range
    const allDates = generateDateRange(days);
    return allDates.map(date => ({
      date,
      impressions: dataMap.get(date)?.impressions ?? 0,
      clicks: dataMap.get(date)?.clicks ?? 0,
      conversionRate: dataMap.get(date)?.conversionRate ?? 0,
    }));
  }

  async getPopularImages(
    options?: PopularImagesOptions,
  ): Promise<PopularImage[]> {
    const days = options?.days ?? 30;
    const limit = options?.limit ?? 10;
    const periodStart = new Date();
    periodStart.setHours(0, 0, 0, 0);
    periodStart.setDate(periodStart.getDate() - (days - 1));

    // Use raw query for aggregation with join
    // Note: Prisma's tagged template $queryRaw automatically parameterizes values
    const results = await this.prisma.$queryRaw<
      Array<{
        id: string;
        title: string;
        thumbnail_path: string | null;
        view_count: bigint;
        total_duration: bigint | null;
        last_viewed_at: string | null;
      }>
    >`
      SELECT
        i.id,
        i.title,
        i.thumbnail_path,
        COUNT(vh.id) as view_count,
        SUM(vh.duration) as total_duration,
        MAX(vh.viewed_at) as last_viewed_at
      FROM "Image" i
      INNER JOIN "view_history" vh ON vh.image_id = i.id
      WHERE vh.viewed_at >= ${periodStart}
      GROUP BY i.id, i.title, i.thumbnail_path
      ORDER BY view_count DESC, total_duration DESC
      LIMIT ${limit}
    `;

    return results.map(row => ({
      id: row.id,
      title: row.title,
      thumbnailPath: row.thumbnail_path,
      viewCount: Number(row.view_count),
      totalDuration: Number(row.total_duration ?? 0),
      lastViewedAt: row.last_viewed_at !== null ? new Date(row.last_viewed_at).toISOString() : null,
    }));
  }
}

import 'reflect-metadata';
import { injectable } from 'inversify';
import { prisma } from '@/infra/database/prisma.js';
import type {
  ViewHistory,
  ViewHistoryWithImage,
  CreateViewHistoryInput,
  UpdateViewHistoryDurationInput,
  ImageViewStats,
  ViewHistoryRepository,
  ViewHistoryListOptions,
} from '@/application/ports/view-history-repository.js';

@injectable()
export class PrismaViewHistoryRepository implements ViewHistoryRepository {
  async create(input: CreateViewHistoryInput): Promise<ViewHistory> {
    return await prisma.viewHistory.create({
      data: {
        imageId: input.imageId,
      },
    });
  }

  async findById(id: string): Promise<ViewHistory | null> {
    return await prisma.viewHistory.findUnique({
      where: { id },
    });
  }

  async updateDuration(
    id: string,
    input: UpdateViewHistoryDurationInput,
  ): Promise<ViewHistory> {
    return await prisma.viewHistory.update({
      where: { id },
      data: {
        duration: input.duration,
      },
    });
  }

  async findRecentWithImages(
    options?: ViewHistoryListOptions,
  ): Promise<ViewHistoryWithImage[]> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const records = await prisma.viewHistory.findMany({
      take: limit,
      skip: offset,
      orderBy: { viewedAt: 'desc' },
      include: {
        image: {
          select: {
            id: true,
            filename: true,
            thumbnailPath: true,
          },
        },
      },
    });

    return records.map(record => ({
      id: record.id,
      imageId: record.imageId,
      viewedAt: record.viewedAt,
      duration: record.duration,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      image: {
        id: record.image.id,
        filename: record.image.filename,
        thumbnailPath: record.image.thumbnailPath,
      },
    }));
  }

  async getImageStats(imageId: string): Promise<ImageViewStats> {
    const [stats] = await prisma.$queryRaw<
      Array<{
        viewCount: bigint;
        totalDuration: bigint | null;
        lastViewedAt: Date | null;
      }>
    >`
      SELECT
        COUNT(*) as viewCount,
        SUM(duration) as totalDuration,
        MAX(viewed_at) as lastViewedAt
      FROM view_history
      WHERE image_id = ${imageId}
    `;

    return {
      viewCount: Number(stats?.viewCount ?? 0),
      totalDuration: Number(stats?.totalDuration ?? 0),
      lastViewedAt: stats?.lastViewedAt ?? null,
    };
  }

  async deleteById(id: string): Promise<void> {
    await prisma.viewHistory.delete({
      where: { id },
    });
  }
}

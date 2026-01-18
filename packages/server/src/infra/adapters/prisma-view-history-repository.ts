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
        thumbnailPath: record.image.thumbnailPath,
      },
    }));
  }

  async getImageStats(imageId: string): Promise<ImageViewStats> {
    const stats = await prisma.viewHistory.aggregate({
      where: { imageId },
      _count: { _all: true },
      _sum: { duration: true },
      _max: { viewedAt: true },
    });

    return {
      viewCount: stats._count._all,
      totalDuration: stats._sum.duration ?? 0,
      lastViewedAt: stats._max.viewedAt ?? null,
    };
  }

  async deleteById(id: string): Promise<void> {
    await prisma.viewHistory.delete({
      where: { id },
    });
  }
}

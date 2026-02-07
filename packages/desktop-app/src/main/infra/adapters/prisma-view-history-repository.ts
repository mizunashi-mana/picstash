import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '@desktop-app/main/infra/di/types.js';
import type { PrismaService } from '@desktop-app/main/infra/database/prisma-service.js';
import type {
  ViewHistory,
  ViewHistoryWithImage,
  CreateViewHistoryInput,
  UpdateViewHistoryDurationInput,
  ImageViewStats,
  ViewHistoryRepository,
  ViewHistoryListOptions,
} from '@picstash/core';
import type { Prisma, PrismaClient } from '@~generated/prisma/client.js';

type ViewHistoryWithImageRecord = Prisma.ViewHistoryGetPayload<{
  include: { image: { select: { id: true; title: true; thumbnailPath: true } } };
}>;

@injectable()
export class PrismaViewHistoryRepository implements ViewHistoryRepository {
  private readonly prisma: PrismaClient;

  constructor(@inject(TYPES.PrismaService) prismaService: PrismaService) {
    this.prisma = prismaService.getClient();
  }

  async create(input: CreateViewHistoryInput): Promise<ViewHistory> {
    return await this.prisma.viewHistory.create({
      data: {
        imageId: input.imageId,
      },
    });
  }

  async findById(id: string): Promise<ViewHistory | null> {
    return await this.prisma.viewHistory.findUnique({
      where: { id },
    });
  }

  async updateDuration(
    id: string,
    input: UpdateViewHistoryDurationInput,
  ): Promise<ViewHistory> {
    return await this.prisma.viewHistory.update({
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

    const records = await this.prisma.viewHistory.findMany({
      take: limit,
      skip: offset,
      orderBy: { viewedAt: 'desc' },
      include: {
        image: {
          select: {
            id: true,
            title: true,
            thumbnailPath: true,
          },
        },
      },
    });

    return records.map((record: ViewHistoryWithImageRecord) => ({
      id: record.id,
      imageId: record.imageId,
      viewedAt: record.viewedAt,
      duration: record.duration,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      image: {
        id: record.image.id,
        title: record.image.title,
        thumbnailPath: record.image.thumbnailPath,
      },
    }));
  }

  async getImageStats(imageId: string): Promise<ImageViewStats> {
    const stats = await this.prisma.viewHistory.aggregate({
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
    await this.prisma.viewHistory.delete({
      where: { id },
    });
  }
}

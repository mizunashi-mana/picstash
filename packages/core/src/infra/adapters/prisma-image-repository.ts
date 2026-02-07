import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { buildSearchWhere } from '@/application/search/build-search-where.js';
import { isEmptyQuery, parseSearchQuery } from '@/application/search/query-parser.js';
import { TYPES } from '@/infra/di/types.js';
import type {
  CreateImageInput,
  ImageEntity,
  ImageListItem,
  ImageDetail,
  ImageRepository,
  ImageWithEmbedding,
  PaginatedResult,
  PaginationOptions,
  UpdateEmbeddingInput,
  UpdateImageInput,
} from '@/application/ports/image-repository.js';
import type { PrismaService } from '@/infra/database/prisma-service.js';
import type { Prisma, PrismaClient } from '@~generated/prisma/client.js';

@injectable()
export class PrismaImageRepository implements ImageRepository {
  private readonly prisma: PrismaClient;

  constructor(@inject(TYPES.PrismaService) prismaService: PrismaService) {
    this.prisma = prismaService.getClient();
  }

  async create(input: CreateImageInput): Promise<ImageEntity> {
    return await this.prisma.image.create({
      data: input,
    });
  }

  async findById(id: string): Promise<ImageDetail | null> {
    return await this.prisma.image.findUnique({
      where: { id },
    });
  }

  async findByIds(ids: string[]): Promise<ImageListItem[]> {
    if (ids.length === 0) {
      return [];
    }
    return await this.prisma.image.findMany({
      where: { id: { in: ids } },
    });
  }

  async findAll(): Promise<ImageListItem[]> {
    return await this.prisma.image.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllPaginated(options: PaginationOptions): Promise<PaginatedResult<ImageListItem>> {
    const [items, total] = await Promise.all([
      this.prisma.image.findMany({
        orderBy: { createdAt: 'desc' },
        skip: options.offset,
        take: options.limit,
      }),
      this.prisma.image.count(),
    ]);

    return {
      items,
      total,
      limit: options.limit,
      offset: options.offset,
    };
  }

  async search(query: string): Promise<ImageListItem[]> {
    const parsedQuery = parseSearchQuery(query);

    // If query is empty, return all images
    if (isEmptyQuery(parsedQuery)) {
      return await this.findAll();
    }

    // Build WHERE clause for multi-condition search
    // Type assertion is safe: buildSearchWhere returns a structure compatible with Prisma.ImageWhereInput
    const where = buildSearchWhere(parsedQuery) as Prisma.ImageWhereInput;

    return await this.prisma.image.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async searchPaginated(query: string, options: PaginationOptions): Promise<PaginatedResult<ImageListItem>> {
    const parsedQuery = parseSearchQuery(query);

    // If query is empty, return all images paginated
    if (isEmptyQuery(parsedQuery)) {
      return await this.findAllPaginated(options);
    }

    // Build WHERE clause for multi-condition search
    // Type assertion is safe: buildSearchWhere returns a structure compatible with Prisma.ImageWhereInput
    const where = buildSearchWhere(parsedQuery) as Prisma.ImageWhereInput;

    const [items, total] = await Promise.all([
      this.prisma.image.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: options.offset,
        take: options.limit,
      }),
      this.prisma.image.count({ where }),
    ]);

    return {
      items,
      total,
      limit: options.limit,
      offset: options.offset,
    };
  }

  async updateById(id: string, input: UpdateImageInput): Promise<ImageEntity> {
    return await this.prisma.image.update({
      where: { id },
      data: input,
    });
  }

  async deleteById(id: string): Promise<ImageEntity> {
    return await this.prisma.image.delete({
      where: { id },
    });
  }

  // Embedding-related methods
  async findIdsWithoutEmbedding(): Promise<Array<{ id: string }>> {
    return await this.prisma.image.findMany({
      where: { embedding: null },
      select: { id: true },
    });
  }

  async findByIdWithEmbedding(id: string): Promise<ImageWithEmbedding | null> {
    return await this.prisma.image.findUnique({
      where: { id },
      select: { id: true, path: true, embedding: true },
    });
  }

  async findWithEmbedding(): Promise<ImageWithEmbedding[]> {
    return await this.prisma.image.findMany({
      where: { embedding: { not: null } },
      select: { id: true, path: true, embedding: true },
    });
  }

  async updateEmbedding(id: string, input: UpdateEmbeddingInput): Promise<void> {
    await this.prisma.image.update({
      where: { id },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Float32Array is compatible with Prisma's Bytes type
        embedding: input.embedding as unknown as Uint8Array<ArrayBuffer>,
        embeddedAt: input.embeddedAt,
      },
    });
  }

  async clearAllEmbeddings(): Promise<void> {
    await this.prisma.image.updateMany({
      data: {
        embedding: null,
        embeddedAt: null,
      },
    });
  }

  async count(): Promise<number> {
    return await this.prisma.image.count();
  }

  async countWithEmbedding(): Promise<number> {
    return await this.prisma.image.count({
      where: { embedding: { not: null } },
    });
  }
}

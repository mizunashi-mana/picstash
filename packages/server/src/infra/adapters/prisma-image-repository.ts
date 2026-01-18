import 'reflect-metadata';
import { injectable } from 'inversify';
import { buildSearchWhere } from '@/application/search/build-search-where.js';
import { isEmptyQuery, parseSearchQuery } from '@/application/search/query-parser.js';
import { prisma } from '@/infra/database/prisma.js';
import type {
  CreateImageInput,
  Image,
  ImageRepository,
  ImageWithEmbedding,
  UpdateEmbeddingInput,
  UpdateImageInput,
} from '@/application/ports/image-repository.js';
import type { Prisma } from '@~generated/prisma/client.js';

@injectable()
export class PrismaImageRepository implements ImageRepository {
  async create(input: CreateImageInput): Promise<Image> {
    return await prisma.image.create({
      data: input,
    });
  }

  async findById(id: string): Promise<Image | null> {
    return await prisma.image.findUnique({
      where: { id },
    });
  }

  async findByIds(ids: string[]): Promise<Image[]> {
    if (ids.length === 0) {
      return [];
    }
    return await prisma.image.findMany({
      where: { id: { in: ids } },
    });
  }

  async findAll(): Promise<Image[]> {
    return await prisma.image.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async search(query: string): Promise<Image[]> {
    const parsedQuery = parseSearchQuery(query);

    // If query is empty, return all images
    if (isEmptyQuery(parsedQuery)) {
      return await this.findAll();
    }

    // Build WHERE clause for multi-condition search
    // Type assertion is safe: buildSearchWhere returns a structure compatible with Prisma.ImageWhereInput
    const where = buildSearchWhere(parsedQuery) as Prisma.ImageWhereInput;

    return await prisma.image.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateById(id: string, input: UpdateImageInput): Promise<Image> {
    return await prisma.image.update({
      where: { id },
      data: input,
    });
  }

  async deleteById(id: string): Promise<Image> {
    return await prisma.image.delete({
      where: { id },
    });
  }

  // Embedding-related methods
  async findIdsWithoutEmbedding(): Promise<Array<{ id: string }>> {
    return await prisma.image.findMany({
      where: { embedding: null },
      select: { id: true },
    });
  }

  async findByIdWithEmbedding(id: string): Promise<ImageWithEmbedding | null> {
    return await prisma.image.findUnique({
      where: { id },
      select: { id: true, path: true, embedding: true },
    });
  }

  async findWithEmbedding(): Promise<ImageWithEmbedding[]> {
    return await prisma.image.findMany({
      where: { embedding: { not: null } },
      select: { id: true, path: true, embedding: true },
    });
  }

  async updateEmbedding(id: string, input: UpdateEmbeddingInput): Promise<void> {
    await prisma.image.update({
      where: { id },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Float32Array is compatible with Prisma's Bytes type
        embedding: input.embedding as unknown as Uint8Array<ArrayBuffer>,
        embeddedAt: input.embeddedAt,
      },
    });
  }

  async clearAllEmbeddings(): Promise<void> {
    await prisma.image.updateMany({
      data: {
        embedding: null,
        embeddedAt: null,
      },
    });
  }

  async count(): Promise<number> {
    return await prisma.image.count();
  }

  async countWithEmbedding(): Promise<number> {
    return await prisma.image.count({
      where: { embedding: { not: null } },
    });
  }
}

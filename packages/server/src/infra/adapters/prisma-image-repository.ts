import 'reflect-metadata';
import { injectable } from 'inversify';
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
    const where = this.buildSearchWhere(parsedQuery);

    return await prisma.image.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Build Prisma WHERE clause for a single search term.
   * Matches if term is found in filename, description, keywords, or label name.
   */
  private buildTermCondition(term: string): Prisma.ImageWhereInput {
    return {
      OR: [
        { filename: { contains: term } },
        { description: { contains: term } },
        {
          attributes: {
            some: {
              OR: [
                { keywords: { contains: term } },
                { label: { name: { contains: term } } },
              ],
            },
          },
        },
      ],
    };
  }

  /**
   * Build Prisma WHERE clause from parsed SearchQuery.
   * Structure: OR of AND groups, where each AND group contains multiple terms.
   */
  private buildSearchWhere(parsedQuery: ReturnType<typeof parseSearchQuery>): Prisma.ImageWhereInput {
    // Each AND group: all terms must match
    const orConditions = parsedQuery.map((andGroup) => {
      if (andGroup.length === 1) {
        // Single term - no need for AND wrapper
        // Non-null assertion is safe: andGroup.length === 1 guarantees andGroup[0] exists
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Length check guarantees element exists
        return this.buildTermCondition(andGroup[0]!);
      }
      // Multiple terms - wrap in AND
      return {
        AND: andGroup.map(term => this.buildTermCondition(term)),
      };
    });

    // If only one OR group, return it directly
    if (orConditions.length === 1) {
      // Non-null assertion is safe: orConditions.length === 1 guarantees orConditions[0] exists
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Length check guarantees element exists
      return orConditions[0]!;
    }

    // Multiple OR groups - wrap in OR
    return { OR: orConditions };
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

import 'reflect-metadata';
import { injectable } from 'inversify';
import { prisma } from '@/infra/database/prisma.js';
import type {
  CreateImageInput,
  Image,
  ImageRepository,
  ImageWithEmbedding,
  UpdateEmbeddingInput,
  UpdateImageInput,
} from '@/application/ports/image-repository.js';

@injectable()
export class PrismaImageRepository implements ImageRepository {
  async create(input: CreateImageInput): Promise<Image> {
    return prisma.image.create({
      data: input,
    });
  }

  async findById(id: string): Promise<Image | null> {
    return prisma.image.findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<Image[]> {
    return prisma.image.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async search(query: string): Promise<Image[]> {
    return prisma.image.findMany({
      where: {
        OR: [
          { filename: { contains: query } },
          { description: { contains: query } },
          {
            attributes: {
              some: {
                OR: [
                  { keywords: { contains: query } },
                  { label: { name: { contains: query } } },
                ],
              },
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateById(id: string, input: UpdateImageInput): Promise<Image> {
    return prisma.image.update({
      where: { id },
      data: input,
    });
  }

  async deleteById(id: string): Promise<Image> {
    return prisma.image.delete({
      where: { id },
    });
  }

  // Embedding-related methods
  async findIdsWithoutEmbedding(): Promise<Array<{ id: string }>> {
    return prisma.image.findMany({
      where: { embedding: null },
      select: { id: true },
    });
  }

  async findWithEmbedding(): Promise<ImageWithEmbedding[]> {
    return prisma.image.findMany({
      where: { embedding: { not: null } },
      select: { id: true, path: true, embedding: true },
    });
  }

  async updateEmbedding(id: string, input: UpdateEmbeddingInput): Promise<void> {
    await prisma.image.update({
      where: { id },
      data: {
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
    return prisma.image.count();
  }

  async countWithEmbedding(): Promise<number> {
    return prisma.image.count({
      where: { embedding: { not: null } },
    });
  }
}

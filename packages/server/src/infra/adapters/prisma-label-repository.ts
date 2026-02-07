import 'reflect-metadata';
import { TYPES } from '@picstash/core';
import { inject, injectable } from 'inversify';
import type { PrismaService } from '@/infra/database/prisma-service.js';
import type {
  CreateLabelInput,
  LabelEntity,
  LabelRepository,
  LabelWithEmbedding,
  UpdateLabelEmbeddingInput,
  UpdateLabelInput,
} from '@picstash/core';
import type { PrismaClient } from '@~generated/prisma/client.js';

@injectable()
export class PrismaLabelRepository implements LabelRepository {
  private readonly prisma: PrismaClient;

  constructor(@inject(TYPES.PrismaService) prismaService: PrismaService) {
    this.prisma = prismaService.getClient();
  }

  async create(input: CreateLabelInput): Promise<LabelEntity> {
    return await this.prisma.attributeLabel.create({
      data: input,
    });
  }

  async findById(id: string): Promise<LabelEntity | null> {
    return await this.prisma.attributeLabel.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<LabelEntity | null> {
    return await this.prisma.attributeLabel.findUnique({
      where: { name },
    });
  }

  async findAll(): Promise<LabelEntity[]> {
    return await this.prisma.attributeLabel.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async updateById(id: string, input: UpdateLabelInput): Promise<LabelEntity> {
    return await this.prisma.attributeLabel.update({
      where: { id },
      data: input,
    });
  }

  async deleteById(id: string): Promise<LabelEntity> {
    return await this.prisma.attributeLabel.delete({
      where: { id },
    });
  }

  // Embedding-related methods
  async findAllWithEmbedding(): Promise<LabelWithEmbedding[]> {
    return await this.prisma.attributeLabel.findMany({
      where: { embedding: { not: null } },
      select: { id: true, name: true, embedding: true },
      orderBy: { name: 'asc' },
    });
  }

  async findIdsWithoutEmbedding(): Promise<Array<{ id: string; name: string }>> {
    return await this.prisma.attributeLabel.findMany({
      where: { embedding: null },
      select: { id: true, name: true },
    });
  }

  async updateEmbedding(id: string, input: UpdateLabelEmbeddingInput): Promise<void> {
    await this.prisma.attributeLabel.update({
      where: { id },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Float32Array is compatible with Prisma's Bytes type
        embedding: input.embedding as unknown as Uint8Array<ArrayBuffer>,
        embeddedAt: input.embeddedAt,
      },
    });
  }

  async clearAllEmbeddings(): Promise<void> {
    await this.prisma.attributeLabel.updateMany({
      data: {
        embedding: null,
        embeddedAt: null,
      },
    });
  }

  async countWithEmbedding(): Promise<number> {
    return await this.prisma.attributeLabel.count({
      where: { embedding: { not: null } },
    });
  }
}

import 'reflect-metadata';
import { injectable } from 'inversify';
import { prisma } from '@/infra/database/prisma.js';
import type {
  CreateLabelInput,
  Label,
  LabelRepository,
  LabelWithEmbedding,
  UpdateLabelEmbeddingInput,
  UpdateLabelInput,
} from '@/application/ports/label-repository.js';

@injectable()
export class PrismaLabelRepository implements LabelRepository {
  async create(input: CreateLabelInput): Promise<Label> {
    return await prisma.attributeLabel.create({
      data: input,
    });
  }

  async findById(id: string): Promise<Label | null> {
    return await prisma.attributeLabel.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Label | null> {
    return await prisma.attributeLabel.findUnique({
      where: { name },
    });
  }

  async findAll(): Promise<Label[]> {
    return await prisma.attributeLabel.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async updateById(id: string, input: UpdateLabelInput): Promise<Label> {
    return await prisma.attributeLabel.update({
      where: { id },
      data: input,
    });
  }

  async deleteById(id: string): Promise<Label> {
    return await prisma.attributeLabel.delete({
      where: { id },
    });
  }

  // Embedding-related methods
  async findAllWithEmbedding(): Promise<LabelWithEmbedding[]> {
    return await prisma.attributeLabel.findMany({
      where: { embedding: { not: null } },
      select: { id: true, name: true, embedding: true },
      orderBy: { name: 'asc' },
    });
  }

  async findIdsWithoutEmbedding(): Promise<Array<{ id: string; name: string }>> {
    return await prisma.attributeLabel.findMany({
      where: { embedding: null },
      select: { id: true, name: true },
    });
  }

  async updateEmbedding(id: string, input: UpdateLabelEmbeddingInput): Promise<void> {
    await prisma.attributeLabel.update({
      where: { id },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Float32Array is compatible with Prisma's Bytes type
        embedding: input.embedding as unknown as Uint8Array<ArrayBuffer>,
        embeddedAt: input.embeddedAt,
      },
    });
  }

  async clearAllEmbeddings(): Promise<void> {
    await prisma.attributeLabel.updateMany({
      data: {
        embedding: null,
        embeddedAt: null,
      },
    });
  }

  async countWithEmbedding(): Promise<number> {
    return await prisma.attributeLabel.count({
      where: { embedding: { not: null } },
    });
  }
}

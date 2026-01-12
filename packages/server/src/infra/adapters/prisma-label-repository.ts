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
    return prisma.attributeLabel.create({
      data: input,
    });
  }

  async findById(id: string): Promise<Label | null> {
    return prisma.attributeLabel.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Label | null> {
    return prisma.attributeLabel.findUnique({
      where: { name },
    });
  }

  async findAll(): Promise<Label[]> {
    return prisma.attributeLabel.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async updateById(id: string, input: UpdateLabelInput): Promise<Label> {
    return prisma.attributeLabel.update({
      where: { id },
      data: input,
    });
  }

  async deleteById(id: string): Promise<Label> {
    return prisma.attributeLabel.delete({
      where: { id },
    });
  }

  // Embedding-related methods
  async findAllWithEmbedding(): Promise<LabelWithEmbedding[]> {
    return prisma.attributeLabel.findMany({
      where: { embedding: { not: null } },
      select: { id: true, name: true, embedding: true },
      orderBy: { name: 'asc' },
    });
  }

  async findIdsWithoutEmbedding(): Promise<Array<{ id: string; name: string }>> {
    return prisma.attributeLabel.findMany({
      where: { embedding: null },
      select: { id: true, name: true },
    });
  }

  async updateEmbedding(id: string, input: UpdateLabelEmbeddingInput): Promise<void> {
    await prisma.attributeLabel.update({
      where: { id },
      data: {
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
    return prisma.attributeLabel.count({
      where: { embedding: { not: null } },
    });
  }
}

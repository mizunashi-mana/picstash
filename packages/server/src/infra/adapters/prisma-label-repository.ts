import 'reflect-metadata';
import { injectable } from 'inversify';
import { prisma } from '@/infra/database/prisma.js';
import type {
  CreateLabelInput,
  Label,
  LabelRepository,
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
}

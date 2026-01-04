import 'reflect-metadata';
import { injectable } from 'inversify';
import { prisma } from '@/infra/database/prisma.js';
import type {
  CreateImageInput,
  Image,
  ImageRepository,
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

  async deleteById(id: string): Promise<Image> {
    return prisma.image.delete({
      where: { id },
    });
  }
}

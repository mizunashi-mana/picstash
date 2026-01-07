import 'reflect-metadata';
import { injectable } from 'inversify';
import { prisma } from '@/infra/database/prisma.js';
import type {
  CreateImageInput,
  Image,
  ImageRepository,
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
}

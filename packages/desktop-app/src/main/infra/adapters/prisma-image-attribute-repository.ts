import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '@desktop-app/main/infra/di/types.js';
import type { PrismaService } from '@desktop-app/main/infra/database/prisma-service.js';
import type {
  CreateImageAttributeInput,
  ImageAttribute,
  ImageAttributeRepository,
  UpdateImageAttributeInput,
} from '@picstash/core';
import type { PrismaClient } from '@~generated/prisma/client.js';

@injectable()
export class PrismaImageAttributeRepository
implements ImageAttributeRepository {
  private readonly prisma: PrismaClient;

  constructor(@inject(TYPES.PrismaService) prismaService: PrismaService) {
    this.prisma = prismaService.getClient();
  }

  async findById(id: string): Promise<ImageAttribute | null> {
    return await this.prisma.imageAttribute.findUnique({
      where: { id },
      include: { label: true },
    });
  }

  async findByImageId(imageId: string): Promise<ImageAttribute[]> {
    return await this.prisma.imageAttribute.findMany({
      where: { imageId },
      include: { label: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByImageAndLabel(
    imageId: string,
    labelId: string,
  ): Promise<ImageAttribute | null> {
    return await this.prisma.imageAttribute.findUnique({
      where: { imageId_labelId: { imageId, labelId } },
      include: { label: true },
    });
  }

  async create(input: CreateImageAttributeInput): Promise<ImageAttribute> {
    return await this.prisma.imageAttribute.create({
      data: {
        imageId: input.imageId,
        labelId: input.labelId,
        keywords: input.keywords,
      },
      include: { label: true },
    });
  }

  async updateById(
    id: string,
    input: UpdateImageAttributeInput,
  ): Promise<ImageAttribute> {
    return await this.prisma.imageAttribute.update({
      where: { id },
      data: { keywords: input.keywords },
      include: { label: true },
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.imageAttribute.delete({
      where: { id },
    });
  }
}

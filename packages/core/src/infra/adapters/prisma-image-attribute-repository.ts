import 'reflect-metadata';
import { injectable } from 'inversify';
import { prisma } from '../database/prisma.js';
import type {
  CreateImageAttributeInput,
  ImageAttribute,
  ImageAttributeRepository,
  UpdateImageAttributeInput,
} from '../../application/ports/image-attribute-repository.js';

@injectable()
export class PrismaImageAttributeRepository
implements ImageAttributeRepository {
  async findById(id: string): Promise<ImageAttribute | null> {
    return await prisma.imageAttribute.findUnique({
      where: { id },
      include: { label: true },
    });
  }

  async findByImageId(imageId: string): Promise<ImageAttribute[]> {
    return await prisma.imageAttribute.findMany({
      where: { imageId },
      include: { label: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByImageAndLabel(
    imageId: string,
    labelId: string,
  ): Promise<ImageAttribute | null> {
    return await prisma.imageAttribute.findUnique({
      where: { imageId_labelId: { imageId, labelId } },
      include: { label: true },
    });
  }

  async create(input: CreateImageAttributeInput): Promise<ImageAttribute> {
    return await prisma.imageAttribute.create({
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
    return await prisma.imageAttribute.update({
      where: { id },
      data: { keywords: input.keywords },
      include: { label: true },
    });
  }

  async deleteById(id: string): Promise<void> {
    await prisma.imageAttribute.delete({
      where: { id },
    });
  }
}

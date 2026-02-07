import 'reflect-metadata';
import { TYPES } from '@picstash/core';
import { inject, injectable } from 'inversify';
import type { PrismaService } from '@/infra/database/prisma-service.js';
import type {
  AddImageToCollectionInput,
  CollectionEntity,
  CollectionImage,
  CollectionRepository,
  CollectionListItem,
  CollectionDetail,
  CreateCollectionInput,
  UpdateCollectionInput,
  UpdateImageOrderInput,
} from '@picstash/core';
import type { PrismaClient } from '@~generated/prisma/client.js';

@injectable()
export class PrismaCollectionRepository implements CollectionRepository {
  private readonly prisma: PrismaClient;

  constructor(@inject(TYPES.DatabaseService) prismaService: PrismaService) {
    this.prisma = prismaService.getClient();
  }

  async create(input: CreateCollectionInput): Promise<CollectionEntity> {
    return await this.prisma.collection.create({
      data: input,
    });
  }

  async findById(id: string): Promise<CollectionEntity | null> {
    return await this.prisma.collection.findUnique({
      where: { id },
    });
  }

  async findByIdWithImages(id: string): Promise<CollectionDetail | null> {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { order: 'asc' },
          include: {
            image: {
              select: { title: true, thumbnailPath: true },
            },
          },
        },
      },
    });

    if (collection === null) {
      return null;
    }

    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      coverImageId: collection.coverImageId,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      images: collection.images.map(ci => ({
        id: ci.id,
        imageId: ci.imageId,
        order: ci.order,
        title: ci.image.title,
        thumbnailPath: ci.image.thumbnailPath,
      })),
    };
  }

  async findAll(): Promise<CollectionListItem[]> {
    const collections = await this.prisma.collection.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { images: true },
        },
      },
    });

    return collections.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      coverImageId: c.coverImageId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      imageCount: c._count.images,
    }));
  }

  async updateById(id: string, input: UpdateCollectionInput): Promise<CollectionEntity> {
    return await this.prisma.collection.update({
      where: { id },
      data: input,
    });
  }

  async deleteById(id: string): Promise<CollectionEntity> {
    return await this.prisma.collection.delete({
      where: { id },
    });
  }

  // Collection image management
  async addImage(collectionId: string, input: AddImageToCollectionInput): Promise<CollectionImage> {
    return await this.prisma.$transaction(async (tx) => {
      // If order is not specified, add at the end
      let order = input.order;
      if (order === undefined) {
        const maxOrder = await tx.collectionImage.findFirst({
          where: { collectionId },
          orderBy: { order: 'desc' },
          select: { order: true },
        });
        order = (maxOrder?.order ?? -1) + 1;
      }

      return await tx.collectionImage.create({
        data: {
          collectionId,
          imageId: input.imageId,
          order,
        },
      });
    });
  }

  async removeImage(collectionId: string, imageId: string): Promise<void> {
    await this.prisma.collectionImage.delete({
      where: {
        collectionId_imageId: {
          collectionId,
          imageId,
        },
      },
    });
  }

  async updateImageOrder(collectionId: string, orders: UpdateImageOrderInput[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const { imageId, order } of orders) {
        await tx.collectionImage.update({
          where: {
            collectionId_imageId: {
              collectionId,
              imageId,
            },
          },
          data: { order },
        });
      }
    });
  }

  // Query helpers
  async findCollectionsByImageId(imageId: string): Promise<CollectionEntity[]> {
    const collectionImages = await this.prisma.collectionImage.findMany({
      where: { imageId },
      include: { collection: true },
    });

    return collectionImages.map(ci => ci.collection);
  }
}

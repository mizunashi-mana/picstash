import 'reflect-metadata';
import { injectable } from 'inversify';
import { prisma } from '@/infra/database/prisma.js';
import type {
  AddImageToCollectionInput,
  Collection,
  CollectionImage,
  CollectionRepository,
  CollectionWithCount,
  CollectionWithImages,
  CreateCollectionInput,
  UpdateCollectionInput,
  UpdateImageOrderInput,
} from '@/application/ports/collection-repository.js';

@injectable()
export class PrismaCollectionRepository implements CollectionRepository {
  async create(input: CreateCollectionInput): Promise<Collection> {
    return await prisma.collection.create({
      data: input,
    });
  }

  async findById(id: string): Promise<Collection | null> {
    return await prisma.collection.findUnique({
      where: { id },
    });
  }

  async findByIdWithImages(id: string): Promise<CollectionWithImages | null> {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { order: 'asc' },
          include: {
            // We need to join with Image table to get filename and thumbnailPath
            // But Prisma doesn't have Image relation on CollectionImage
            // We'll need to handle this differently
          },
        },
      },
    });

    if (collection === null) {
      return null;
    }

    // Fetch image details separately
    const imageIds = collection.images.map(ci => ci.imageId);
    const images = await prisma.image.findMany({
      where: { id: { in: imageIds } },
      select: { id: true, filename: true, thumbnailPath: true },
    });

    const imageMap = new Map(images.map(img => [img.id, img]));

    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      coverImageId: collection.coverImageId,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      images: collection.images.map((ci) => {
        const img = imageMap.get(ci.imageId);
        return {
          id: ci.id,
          imageId: ci.imageId,
          order: ci.order,
          filename: img?.filename ?? '',
          thumbnailPath: img?.thumbnailPath ?? null,
        };
      }),
    };
  }

  async findAll(): Promise<CollectionWithCount[]> {
    const collections = await prisma.collection.findMany({
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

  async updateById(id: string, input: UpdateCollectionInput): Promise<Collection> {
    return await prisma.collection.update({
      where: { id },
      data: input,
    });
  }

  async deleteById(id: string): Promise<Collection> {
    return await prisma.collection.delete({
      where: { id },
    });
  }

  // Collection image management
  async addImage(collectionId: string, input: AddImageToCollectionInput): Promise<CollectionImage> {
    // If order is not specified, add at the end
    let order = input.order;
    if (order === undefined) {
      const maxOrder = await prisma.collectionImage.findFirst({
        where: { collectionId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      order = (maxOrder?.order ?? -1) + 1;
    }

    return await prisma.collectionImage.create({
      data: {
        collectionId,
        imageId: input.imageId,
        order,
      },
    });
  }

  async removeImage(collectionId: string, imageId: string): Promise<void> {
    await prisma.collectionImage.delete({
      where: {
        collectionId_imageId: {
          collectionId,
          imageId,
        },
      },
    });
  }

  async updateImageOrder(collectionId: string, orders: UpdateImageOrderInput[]): Promise<void> {
    await prisma.$transaction(async (tx) => {
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
  async findCollectionsByImageId(imageId: string): Promise<Collection[]> {
    const collectionImages = await prisma.collectionImage.findMany({
      where: { imageId },
      include: { collection: true },
    });

    return collectionImages.map(ci => ci.collection);
  }
}

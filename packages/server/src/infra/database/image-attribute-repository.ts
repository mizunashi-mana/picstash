import { prisma } from './prisma.js';

export async function findAttributesByImageId(imageId: string) {
  return prisma.imageAttribute.findMany({
    where: { imageId },
    include: { label: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function findImageAttributeById(id: string) {
  return prisma.imageAttribute.findUnique({
    where: { id },
    include: { label: true },
  });
}

export async function findImageAttributeByImageAndLabel(
  imageId: string,
  labelId: string,
) {
  return prisma.imageAttribute.findUnique({
    where: { imageId_labelId: { imageId, labelId } },
    include: { label: true },
  });
}

export async function createImageAttribute(data: {
  imageId: string;
  labelId: string;
  keywords?: string;
}) {
  return prisma.imageAttribute.create({
    data: {
      imageId: data.imageId,
      labelId: data.labelId,
      keywords: data.keywords,
    },
    include: { label: true },
  });
}

export async function updateImageAttributeById(
  id: string,
  data: { keywords?: string },
) {
  return prisma.imageAttribute.update({
    where: { id },
    data: { keywords: data.keywords },
    include: { label: true },
  });
}

export async function deleteImageAttributeById(id: string) {
  return prisma.imageAttribute.delete({
    where: { id },
  });
}

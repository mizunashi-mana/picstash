import { prisma } from './prisma.js';
import type { Image } from '@~generated/prisma/client.js';

export interface CreateImageInput {
  filename: string;
  path: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
}

/**
 * Create a new image record
 */
export async function createImage(input: CreateImageInput): Promise<Image> {
  return prisma.image.create({
    data: input,
  });
}

/**
 * Find an image by ID
 */
export async function findImageById(id: string): Promise<Image | null> {
  return prisma.image.findUnique({
    where: { id },
  });
}

/**
 * Find all images
 */
export async function findAllImages(): Promise<Image[]> {
  return prisma.image.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Delete an image by ID
 */
export async function deleteImageById(id: string): Promise<Image> {
  return prisma.image.delete({
    where: { id },
  });
}

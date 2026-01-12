/**
 * Use case for generating image embeddings.
 *
 * This orchestrates the embedding generation process:
 * 1. Load image data
 * 2. Generate embedding using CLIP model
 * 3. Store embedding in database (Prisma + sqlite-vec)
 */

import { readFile } from 'node:fs/promises';
import { prisma } from '@/infra/database/prisma.js';
import {
  upsertEmbedding,
  deleteEmbedding,
  EMBEDDING_DIMENSION,
} from '@/infra/database/sqlite-vec.js';
import { container } from '@/infra/di/container.js';
import { TYPES } from '@/infra/di/types.js';
import type { EmbeddingService } from '@/application/ports/embedding-service.js';
import type { FileStorage } from '@/application/ports/file-storage.js';

export interface GenerateEmbeddingInput {
  imageId: string;
}

export interface GenerateEmbeddingResult {
  imageId: string;
  dimension: number;
  model: string;
  generatedAt: Date;
}

export type GenerateEmbeddingError = 'IMAGE_NOT_FOUND' | 'EMBEDDING_FAILED';

/**
 * Generate embedding for a single image.
 *
 * @param input - The image ID to generate embedding for
 * @returns Result with embedding details or error
 */
export async function generateEmbedding(
  input: GenerateEmbeddingInput,
): Promise<GenerateEmbeddingResult | GenerateEmbeddingError> {
  const embeddingService = container.get<EmbeddingService>(
    TYPES.EmbeddingService,
  );
  const fileStorage = container.get<FileStorage>(TYPES.FileStorage);

  // Get image from database
  const image = await prisma.image.findUnique({
    where: { id: input.imageId },
  });

  if (!image) {
    return 'IMAGE_NOT_FOUND';
  }

  try {
    // Get full path to image file
    const imagePath = fileStorage.getAbsolutePath(image.path);

    // Read image data
    const imageData = await readFile(imagePath);

    // Generate embedding
    const result = await embeddingService.generateFromBuffer(imageData);

    // Store embedding in Prisma (as BLOB for backup/export)
    // Use Buffer.from to ensure we get a proper ArrayBuffer-backed Uint8Array
    const embeddingBytes = Buffer.from(
      result.embedding.buffer,
      result.embedding.byteOffset,
      result.embedding.byteLength,
    ) as unknown as Uint8Array<ArrayBuffer>;
    const generatedAt = new Date();

    await prisma.image.update({
      where: { id: input.imageId },
      data: {
        embedding: embeddingBytes,
        embeddedAt: generatedAt,
      },
    });

    // Store in sqlite-vec for fast vector search
    upsertEmbedding(input.imageId, result.embedding);

    return {
      imageId: input.imageId,
      dimension: result.dimension,
      model: result.model,
      generatedAt,
    };
  }
  catch (error) {
    // eslint-disable-next-line no-console -- Error logging for failed embedding generation
    console.error(`Failed to generate embedding for image ${input.imageId}:`, error);
    return 'EMBEDDING_FAILED';
  }
}

export interface BatchGenerateResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{ imageId: string; error: string }>;
}

/**
 * Generate embeddings for all images that don't have one yet.
 *
 * @param options - Options for batch generation
 * @returns Summary of batch generation
 */
export async function generateMissingEmbeddings(options?: {
  onProgress?: (current: number, total: number) => void;
  // batchSize is reserved for future parallel processing implementation

  batchSize?: number;
}): Promise<BatchGenerateResult> {
  // Find all images without embeddings
  const imagesWithoutEmbedding = await prisma.image.findMany({
    where: { embedding: null },
    select: { id: true },
  });

  const total = imagesWithoutEmbedding.length;
  let success = 0;
  let failed = 0;
  const errors: Array<{ imageId: string; error: string }> = [];

  // Process in batches
  for (let i = 0; i < total; i++) {
    const image = imagesWithoutEmbedding[i]!;

    const result = await generateEmbedding({ imageId: image.id });

    if (typeof result === 'string') {
      failed++;
      errors.push({ imageId: image.id, error: result });
    }
    else {
      success++;
    }

    options?.onProgress?.(i + 1, total);
  }

  return { total, success, failed, errors };
}

/**
 * Remove embedding for an image.
 * Called when an image is deleted.
 */
export function removeEmbedding(imageId: string): void {
  deleteEmbedding(imageId);
}

/**
 * Sync embeddings from Prisma to sqlite-vec.
 * Useful for rebuilding the vector index.
 */
export async function syncEmbeddingsToVectorDb(): Promise<{
  synced: number;
  skipped: number;
}> {
  const imagesWithEmbedding = await prisma.image.findMany({
    where: { embedding: { not: null } },
    select: { id: true, embedding: true },
  });

  let synced = 0;
  let skipped = 0;

  for (const image of imagesWithEmbedding) {
    if (!image.embedding) {
      skipped++;
      continue;
    }

    // Convert Buffer back to Float32Array
    const embedding = new Float32Array(
      image.embedding.buffer,
      image.embedding.byteOffset,
      image.embedding.byteLength / 4,
    );

    if (embedding.length !== EMBEDDING_DIMENSION) {
      // eslint-disable-next-line no-console -- Warning for data integrity issue
      console.warn(
        `Skipping image ${image.id}: unexpected embedding dimension ${embedding.length}`,
      );
      skipped++;
      continue;
    }

    upsertEmbedding(image.id, embedding);
    synced++;
  }

  return { synced, skipped };
}

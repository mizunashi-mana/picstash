/**
 * Use case for generating image embeddings.
 *
 * This orchestrates the embedding generation process:
 * 1. Load image data
 * 2. Generate embedding using CLIP model
 * 3. Store embedding in database (Prisma + sqlite-vec)
 */

import { readFile } from 'node:fs/promises';
import { EMBEDDING_DIMENSION } from '../ports/embedding-repository.js';
import type { EmbeddingRepository } from '../ports/embedding-repository.js';
import type { EmbeddingService } from '../ports/embedding-service.js';
import type { FileStorage } from '../ports/file-storage.js';
import type { ImageRepository } from '../ports/image-repository.js';

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

export interface GenerateEmbeddingDeps {
  imageRepository: ImageRepository;
  fileStorage: FileStorage;
  embeddingService: EmbeddingService;
  embeddingRepository: EmbeddingRepository;
}

/**
 * Generate embedding for a single image.
 *
 * @param input - The image ID to generate embedding for
 * @param deps - Dependencies
 * @returns Result with embedding details or error
 */
export async function generateEmbedding(
  input: GenerateEmbeddingInput,
  deps: GenerateEmbeddingDeps,
): Promise<GenerateEmbeddingResult | GenerateEmbeddingError> {
  const { imageRepository, fileStorage, embeddingService, embeddingRepository } = deps;

  // Get image from database
  const image = await imageRepository.findById(input.imageId);

  if (image === null) {
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
    );
    const generatedAt = new Date();

    await imageRepository.updateEmbedding(input.imageId, {
      embedding: embeddingBytes,
      embeddedAt: generatedAt,
    });

    // Store in sqlite-vec for fast vector search
    embeddingRepository.upsert(input.imageId, result.embedding);

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

export interface GenerateMissingEmbeddingsOptions {
  onProgress?: (current: number, total: number) => void;
  // batchSize is reserved for future parallel processing implementation
  batchSize?: number;
}

/**
 * Generate embeddings for all images that don't have one yet.
 *
 * @param deps - Dependencies
 * @param options - Options for batch generation
 * @returns Summary of batch generation
 */
export async function generateMissingEmbeddings(
  deps: GenerateEmbeddingDeps,
  options?: GenerateMissingEmbeddingsOptions,
): Promise<BatchGenerateResult> {
  const { imageRepository } = deps;

  // Find all images without embeddings
  const imagesWithoutEmbedding = await imageRepository.findIdsWithoutEmbedding();

  const total = imagesWithoutEmbedding.length;
  let success = 0;
  let failed = 0;
  const errors: Array<{ imageId: string; error: string }> = [];

  // Process in batches
  for (let i = 0; i < total; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- loop bounds ensure valid index
    const image = imagesWithoutEmbedding[i]!;

    const result = await generateEmbedding({ imageId: image.id }, deps);

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
export function removeEmbedding(
  imageId: string,
  deps: { embeddingRepository: EmbeddingRepository },
): void {
  deps.embeddingRepository.remove(imageId);
}

export interface SyncEmbeddingsResult {
  synced: number;
  skipped: number;
}

/**
 * Sync embeddings from Prisma to sqlite-vec.
 * Useful for rebuilding the vector index.
 */
export async function syncEmbeddingsToVectorDb(
  deps: { imageRepository: ImageRepository; embeddingRepository: EmbeddingRepository },
): Promise<SyncEmbeddingsResult> {
  const { imageRepository, embeddingRepository } = deps;

  const imagesWithEmbedding = await imageRepository.findWithEmbedding();

  let synced = 0;
  let skipped = 0;

  for (const image of imagesWithEmbedding) {
    if (image.embedding === null) {
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

    embeddingRepository.upsert(image.id, embedding);
    synced++;
  }

  return { synced, skipped };
}

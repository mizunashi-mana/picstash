/**
 * Use case for generating label text embeddings.
 *
 * This generates CLIP text embeddings for labels, enabling
 * image-to-label similarity matching for attribute suggestion.
 */

import type { EmbeddingService } from '@/application/ports/embedding-service.js';
import type { LabelRepository } from '@/application/ports/label-repository.js';

export interface GenerateLabelEmbeddingInput {
  labelId: string;
}

export interface GenerateLabelEmbeddingResult {
  labelId: string;
  labelName: string;
  dimension: number;
  model: string;
  generatedAt: Date;
}

export type GenerateLabelEmbeddingError = 'LABEL_NOT_FOUND' | 'EMBEDDING_FAILED';

export interface GenerateLabelEmbeddingDeps {
  labelRepository: LabelRepository;
  embeddingService: EmbeddingService;
}

/**
 * Generate embedding for a single label.
 *
 * @param input - The label ID to generate embedding for
 * @param deps - Dependencies
 * @returns Result with embedding details or error
 */
export async function generateLabelEmbedding(
  input: GenerateLabelEmbeddingInput,
  deps: GenerateLabelEmbeddingDeps,
): Promise<GenerateLabelEmbeddingResult | GenerateLabelEmbeddingError> {
  const { labelRepository, embeddingService } = deps;

  // Get label from database
  const label = await labelRepository.findById(input.labelId);

  if (label === null) {
    return 'LABEL_NOT_FOUND';
  }

  try {
    // Generate text embedding from label name
    const result = await embeddingService.generateFromText(label.name);

    // Store embedding in database
    const embeddingBytes = Buffer.from(
      result.embedding.buffer,
      result.embedding.byteOffset,
      result.embedding.byteLength,
    );
    const generatedAt = new Date();

    await labelRepository.updateEmbedding(input.labelId, {
      embedding: embeddingBytes,
      embeddedAt: generatedAt,
    });

    return {
      labelId: input.labelId,
      labelName: label.name,
      dimension: result.dimension,
      model: result.model,
      generatedAt,
    };
  }
  catch (error) {
    // eslint-disable-next-line no-console -- Error logging for failed embedding generation
    console.error(`Failed to generate embedding for label ${input.labelId}:`, error);
    return 'EMBEDDING_FAILED';
  }
}

export interface BatchGenerateLabelResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{ labelId: string; labelName: string; error: string }>;
}

export interface GenerateMissingLabelEmbeddingsOptions {
  onProgress?: (current: number, total: number, labelName: string) => void;
}

/**
 * Generate embeddings for all labels that don't have one yet.
 *
 * @param deps - Dependencies
 * @param options - Options for batch generation
 * @returns Summary of batch generation
 */
export async function generateMissingLabelEmbeddings(
  deps: GenerateLabelEmbeddingDeps,
  options?: GenerateMissingLabelEmbeddingsOptions,
): Promise<BatchGenerateLabelResult> {
  const { labelRepository } = deps;

  // Find all labels without embeddings
  const labelsWithoutEmbedding = await labelRepository.findIdsWithoutEmbedding();

  const total = labelsWithoutEmbedding.length;
  let success = 0;
  let failed = 0;
  const errors: Array<{ labelId: string; labelName: string; error: string }> = [];

  for (let i = 0; i < total; i++) {
    const label = labelsWithoutEmbedding[i]!;

    options?.onProgress?.(i + 1, total, label.name);

    const result = await generateLabelEmbedding({ labelId: label.id }, deps);

    if (typeof result === 'string') {
      failed++;
      errors.push({ labelId: label.id, labelName: label.name, error: result });
    }
    else {
      success++;
    }
  }

  return { total, success, failed, errors };
}

/**
 * Regenerate embeddings for all labels.
 */
export async function regenerateAllLabelEmbeddings(
  deps: GenerateLabelEmbeddingDeps,
  options?: GenerateMissingLabelEmbeddingsOptions,
): Promise<BatchGenerateLabelResult> {
  const { labelRepository } = deps;

  // Clear all embeddings first
  await labelRepository.clearAllEmbeddings();

  // Then generate new ones
  return generateMissingLabelEmbeddings(deps, options);
}

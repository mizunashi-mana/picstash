import { EMBEDDING_DIMENSION } from '@/application/ports/embedding-repository.js';
import type { EmbeddingRepository } from '@/application/ports/embedding-repository.js';
import type { ImageRepository } from '@/application/ports/image-repository.js';
import type { ViewHistoryRepository } from '@/application/ports/view-history-repository.js';

/** Options for generating recommendations */
export interface GenerateRecommendationsOptions {
  /** Maximum number of recommendations to return */
  limit?: number;
  /** Number of days of view history to consider */
  historyDays?: number;
  /** Maximum number of view history records to consider */
  historyLimit?: number;
}

/** A recommended image with score */
export interface RecommendedImage {
  id: string;
  filename: string;
  thumbnailPath: string | null;
  score: number;
}

/** Result of generating recommendations */
export interface RecommendationsResult {
  recommendations: RecommendedImage[];
  /** Reason if no recommendations could be generated */
  reason?: 'no_history' | 'no_embeddings' | 'no_similar';
}

const DEFAULT_LIMIT = 10;
const DEFAULT_HISTORY_DAYS = 30;
const DEFAULT_HISTORY_LIMIT = 100;
const MIN_DURATION_MS = 1000; // Minimum 1 second to count as a meaningful view

/**
 * Generate image recommendations based on view history and embeddings.
 */
export async function generateRecommendations(
  viewHistoryRepo: ViewHistoryRepository,
  imageRepo: ImageRepository,
  embeddingRepo: EmbeddingRepository,
  options: GenerateRecommendationsOptions = {},
): Promise<RecommendationsResult> {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const historyDays = options.historyDays ?? DEFAULT_HISTORY_DAYS;
  const historyLimit = options.historyLimit ?? DEFAULT_HISTORY_LIMIT;

  // Get recent view history
  const viewHistory = await viewHistoryRepo.findRecentWithImages({
    limit: historyLimit,
  });

  // Filter by date range
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - historyDays);

  const recentHistory = viewHistory.filter(
    vh => new Date(vh.viewedAt) >= cutoffDate,
  );

  if (recentHistory.length === 0) {
    return { recommendations: [], reason: 'no_history' };
  }

  // Collect unique viewed image IDs and their weighted durations
  const imageWeights = new Map<string, number>();
  for (const vh of recentHistory) {
    const duration = vh.duration ?? MIN_DURATION_MS;
    const weight = Math.max(duration, MIN_DURATION_MS);
    const existing = imageWeights.get(vh.imageId) ?? 0;
    imageWeights.set(vh.imageId, existing + weight);
  }

  // Fetch embeddings for viewed images and compute weighted average
  const embeddings: Array<{ embedding: Float32Array; weight: number }> = [];

  for (const [imageId, weight] of imageWeights) {
    const imageWithEmbedding = await imageRepo.findByIdWithEmbedding(imageId);
    if (imageWithEmbedding?.embedding !== null && imageWithEmbedding?.embedding !== undefined) {
      const embedding = new Float32Array(imageWithEmbedding.embedding.buffer);
      embeddings.push({ embedding, weight });
    }
  }

  if (embeddings.length === 0) {
    return { recommendations: [], reason: 'no_embeddings' };
  }

  // Compute weighted average embedding (preference vector)
  const preferenceVector = computeWeightedAverage(embeddings);

  // Find similar images, excluding already viewed ones
  const viewedImageIds = Array.from(imageWeights.keys());
  const similarResults = embeddingRepo.findSimilar(
    preferenceVector,
    limit + viewedImageIds.length, // Request more in case some need to be filtered
    viewedImageIds,
  );

  if (similarResults.length === 0) {
    return { recommendations: [], reason: 'no_similar' };
  }

  // Fetch image details for recommendations
  const recommendations: RecommendedImage[] = [];
  for (const result of similarResults.slice(0, limit)) {
    const image = await imageRepo.findById(result.imageId);
    if (image !== null) {
      recommendations.push({
        id: image.id,
        filename: image.filename,
        thumbnailPath: image.thumbnailPath,
        // Convert distance to score (lower distance = higher score)
        score: 1 / (1 + result.distance),
      });
    }
  }

  return { recommendations };
}

/**
 * Compute weighted average of embeddings.
 */
function computeWeightedAverage(
  embeddings: Array<{ embedding: Float32Array; weight: number }>,
): Float32Array {
  const result = new Float32Array(EMBEDDING_DIMENSION);
  let totalWeight = 0;

  for (const { embedding, weight } of embeddings) {
    totalWeight += weight;
    for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- index is within bounds
      result[i]! += embedding[i]! * weight;
    }
  }

  // Normalize by total weight
  if (totalWeight > 0) {
    for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- index is within bounds
      result[i]! /= totalWeight;
    }
  }

  // Normalize to unit vector for better similarity search
  const magnitude = Math.sqrt(result.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- index is within bounds
      result[i]! /= magnitude;
    }
  }

  return result;
}

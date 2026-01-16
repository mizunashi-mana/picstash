/**
 * Use case for suggesting attributes for an image based on CLIP similarity.
 */

import { EMBEDDING_DIMENSION } from '@/application/ports/embedding-repository.js';
import type { EmbeddingRepository } from '@/application/ports/embedding-repository.js';
import type { ImageAttributeRepository } from '@/application/ports/image-attribute-repository.js';
import type { ImageRepository } from '@/application/ports/image-repository.js';
import type { LabelRepository } from '@/application/ports/label-repository.js';

/** Suggested keyword with frequency count */
export interface SuggestedKeyword {
  keyword: string;
  /** Number of similar images that have this keyword */
  count: number;
}

export interface AttributeSuggestion {
  labelId: string;
  labelName: string;
  score: number;
  /** Keywords suggested from similar images */
  suggestedKeywords: SuggestedKeyword[];
}

export interface SuggestAttributesInput {
  imageId: string;
  /** Minimum similarity score threshold (0-1, default: 0.2) */
  threshold?: number;
  /** Maximum number of suggestions to return (default: 10) */
  limit?: number;
}

export interface SuggestAttributesResult {
  imageId: string;
  suggestions: AttributeSuggestion[];
}

export type SuggestAttributesError
  = | 'IMAGE_NOT_FOUND'
    | 'IMAGE_NOT_EMBEDDED'
    | 'NO_LABELS_WITH_EMBEDDING';

export interface SuggestAttributesDeps {
  imageRepository: ImageRepository;
  labelRepository: LabelRepository;
  embeddingRepository: EmbeddingRepository;
  imageAttributeRepository: ImageAttributeRepository;
}

/**
 * Suggest attributes for an image based on CLIP embedding similarity.
 *
 * @param input - Image ID and optional parameters
 * @param deps - Dependencies
 * @returns Suggestions sorted by similarity score (descending)
 */
export async function suggestAttributes(
  input: SuggestAttributesInput,
  deps: SuggestAttributesDeps,
): Promise<SuggestAttributesResult | SuggestAttributesError> {
  const { imageId, threshold = 0.2, limit = 10 } = input;
  const { imageRepository, labelRepository, embeddingRepository, imageAttributeRepository } = deps;

  // Get image with embedding using a targeted query
  const image = await imageRepository.findByIdWithEmbedding(imageId);

  if (image === null) {
    return 'IMAGE_NOT_FOUND';
  }

  if (image.embedding === null) {
    return 'IMAGE_NOT_EMBEDDED';
  }

  // Validate that the embedding has the expected size in bytes
  if (image.embedding.byteLength !== EMBEDDING_DIMENSION * 4) {
    return 'IMAGE_NOT_EMBEDDED';
  }

  // Convert image embedding to Float32Array
  const imageEmbedding = new Float32Array(
    image.embedding.buffer,
    image.embedding.byteOffset,
    EMBEDDING_DIMENSION,
  );

  // Get all labels with embeddings
  const labels = await labelRepository.findAllWithEmbedding();

  if (labels.length === 0) {
    return 'NO_LABELS_WITH_EMBEDDING';
  }

  // Find similar images for keyword suggestions
  const similarImages = embeddingRepository.findSimilar(imageEmbedding, 10, [imageId]);

  // Get attributes from similar images
  const similarImageAttributes = await Promise.all(
    similarImages.map(async sim => await imageAttributeRepository.findByImageId(sim.imageId)),
  );

  // Build keyword map per label: { labelId -> { keyword -> count } }
  const keywordsByLabel = buildKeywordsByLabel(similarImageAttributes);

  // Calculate similarity scores
  const suggestions: AttributeSuggestion[] = [];

  for (const label of labels) {
    if (label.embedding === null) {
      continue;
    }

    // Convert label embedding to Float32Array
    const labelEmbedding = new Float32Array(
      label.embedding.buffer,
      label.embedding.byteOffset,
      label.embedding.byteLength / 4,
    );

    if (labelEmbedding.length !== EMBEDDING_DIMENSION) {
      continue;
    }

    // Calculate cosine similarity (embeddings are already normalized)
    const score = cosineSimilarity(imageEmbedding, labelEmbedding);

    if (score >= threshold) {
      // Get suggested keywords for this label from similar images
      const labelKeywords = keywordsByLabel.get(label.id);
      const suggestedKeywords: SuggestedKeyword[] = [];

      if (labelKeywords !== undefined) {
        for (const [keyword, count] of labelKeywords) {
          suggestedKeywords.push({ keyword, count });
        }
        // Sort by count descending
        suggestedKeywords.sort((a, b) => b.count - a.count);
      }

      suggestions.push({
        labelId: label.id,
        labelName: label.name,
        score,
        suggestedKeywords: suggestedKeywords.slice(0, 5), // Top 5 keywords
      });
    }
  }

  // Sort by score descending and limit
  suggestions.sort((a, b) => b.score - a.score);
  const limitedSuggestions = suggestions.slice(0, limit);

  return {
    imageId,
    suggestions: limitedSuggestions,
  };
}

/**
 * Calculate cosine similarity between two normalized vectors.
 * Since vectors are already L2-normalized, this is just the dot product.
 */
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- loop bounds ensure valid index
    dot += a[i]! * b[i]!;
  }
  return dot;
}

interface ImageAttributeWithKeywords {
  labelId: string;
  keywords: string | null;
}

/**
 * Build a map of keywords by label from similar images' attributes.
 */
function buildKeywordsByLabel(
  similarImageAttributes: ImageAttributeWithKeywords[][],
): Map<string, Map<string, number>> {
  const keywordsByLabel = new Map<string, Map<string, number>>();

  for (const attributes of similarImageAttributes) {
    for (const attr of attributes) {
      if (attr.keywords === null || attr.keywords === '') {
        continue;
      }

      if (!keywordsByLabel.has(attr.labelId)) {
        keywordsByLabel.set(attr.labelId, new Map());
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- just set above if not exists
      const keywordMap = keywordsByLabel.get(attr.labelId)!;
      const keywords = attr.keywords.split(',').map(k => k.trim()).filter(k => k !== '');

      for (const keyword of keywords) {
        keywordMap.set(keyword, (keywordMap.get(keyword) ?? 0) + 1);
      }
    }
  }

  return keywordsByLabel;
}

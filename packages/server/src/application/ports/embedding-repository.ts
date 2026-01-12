/**
 * Port for embedding storage and retrieval.
 * This interface abstracts the vector database operations.
 */

/** Result from similarity search */
export interface SimilarityResult {
  imageId: string;
  distance: number;
}

/** Embedding dimension constant (512 for CLIP ViT-B/16) */
export const EMBEDDING_DIMENSION = 512;

/**
 * Repository for storing and querying image embeddings.
 */
export interface EmbeddingRepository {
  /**
   * Store or update an embedding for an image.
   * @param imageId - The image ID
   * @param embedding - The embedding vector (Float32Array of EMBEDDING_DIMENSION)
   */
  upsert(imageId: string, embedding: Float32Array): void;

  /**
   * Remove an embedding for an image.
   * @param imageId - The image ID
   */
  remove(imageId: string): void;

  /**
   * Find images similar to a query embedding.
   * @param queryEmbedding - The query embedding vector
   * @param limit - Maximum number of results (default: 10)
   * @param excludeImageIds - Image IDs to exclude from results
   * @returns Array of similarity results sorted by distance (ascending)
   */
  findSimilar(
    queryEmbedding: Float32Array,
    limit?: number,
    excludeImageIds?: string[],
  ): SimilarityResult[];

  /**
   * Get the number of stored embeddings.
   */
  count(): number;

  /**
   * Close the repository and release resources.
   */
  close(): void;
}

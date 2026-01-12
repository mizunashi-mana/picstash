/**
 * sqlite-vec based implementation of EmbeddingRepository.
 */

import { injectable } from 'inversify';
import { EMBEDDING_DIMENSION } from '@/application/ports/embedding-repository.js';
import {
  upsertEmbedding,
  deleteEmbedding,
  findSimilarImages,
  getEmbeddingCount,
  closeVectorDb,
} from '@/infra/database/sqlite-vec.js';
import type { EmbeddingRepository, SimilarityResult } from '@/application/ports/embedding-repository.js';

@injectable()
export class SqliteVecEmbeddingRepository implements EmbeddingRepository {
  upsert(imageId: string, embedding: Float32Array): void {
    if (embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `Embedding dimension mismatch: expected ${EMBEDDING_DIMENSION}, got ${embedding.length}`,
      );
    }
    upsertEmbedding(imageId, embedding);
  }

  remove(imageId: string): void {
    deleteEmbedding(imageId);
  }

  findSimilar(
    queryEmbedding: Float32Array,
    limit = 10,
    excludeImageIds: string[] = [],
  ): SimilarityResult[] {
    return findSimilarImages(queryEmbedding, limit, excludeImageIds);
  }

  count(): number {
    return getEmbeddingCount();
  }

  close(): void {
    closeVectorDb();
  }
}

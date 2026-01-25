// Re-export from core
export { prisma, connectDatabase, disconnectDatabase } from '@picstash/core';
export {
  getVectorDb,
  upsertEmbedding,
  deleteEmbedding,
  findSimilarImages,
  closeVectorDb,
  getEmbeddingCount,
  hasEmbedding,
  getAllImageIds,
  EMBEDDING_DIMENSION,
} from '@picstash/core';
export type { SimilarityResult } from '@picstash/core';

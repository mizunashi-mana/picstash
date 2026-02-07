import type {
  LabelEntity,
  CreateLabelInput,
  UpdateLabelInput,
} from '@/domain/label/index.js';

// Re-export domain types for convenience
export type { LabelEntity, CreateLabelInput, UpdateLabelInput };

/** Label with embedding data for similarity calculation */
export interface LabelWithEmbedding {
  id: string;
  name: string;
  embedding: Uint8Array | null;
}

/** Input for updating label embedding */
export interface UpdateLabelEmbeddingInput {
  embedding: Uint8Array;
  embeddedAt: Date;
}

export interface LabelRepository {
  // Command operations → return LabelEntity
  create: (input: CreateLabelInput) => Promise<LabelEntity>;
  updateById: (id: string, input: UpdateLabelInput) => Promise<LabelEntity>;
  deleteById: (id: string) => Promise<LabelEntity>;

  // Query operations → return LabelEntity (simple value object)
  findById: (id: string) => Promise<LabelEntity | null>;
  findByName: (name: string) => Promise<LabelEntity | null>;
  findAll: () => Promise<LabelEntity[]>;

  // Embedding-related methods
  /** Find labels with embeddings for similarity calculation */
  findAllWithEmbedding: () => Promise<LabelWithEmbedding[]>;
  /** Find IDs of labels without embedding */
  findIdsWithoutEmbedding: () => Promise<Array<{ id: string; name: string }>>;
  /** Update embedding for a label */
  updateEmbedding: (id: string, input: UpdateLabelEmbeddingInput) => Promise<void>;
  /** Clear all embeddings (for regeneration) */
  clearAllEmbeddings: () => Promise<void>;
  /** Count labels with embedding */
  countWithEmbedding: () => Promise<number>;
}

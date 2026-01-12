import type {
  Label,
  CreateLabelInput,
  UpdateLabelInput,
} from '@/domain/label/index.js';

// Re-export domain types for backward compatibility
export type { Label, CreateLabelInput, UpdateLabelInput };

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
  create(input: CreateLabelInput): Promise<Label>;
  findById(id: string): Promise<Label | null>;
  findByName(name: string): Promise<Label | null>;
  findAll(): Promise<Label[]>;
  updateById(id: string, input: UpdateLabelInput): Promise<Label>;
  deleteById(id: string): Promise<Label>;

  // Embedding-related methods
  /** Find labels with embeddings for similarity calculation */
  findAllWithEmbedding(): Promise<LabelWithEmbedding[]>;
  /** Find IDs of labels without embedding */
  findIdsWithoutEmbedding(): Promise<Array<{ id: string; name: string }>>;
  /** Update embedding for a label */
  updateEmbedding(id: string, input: UpdateLabelEmbeddingInput): Promise<void>;
  /** Clear all embeddings (for regeneration) */
  clearAllEmbeddings(): Promise<void>;
  /** Count labels with embedding */
  countWithEmbedding(): Promise<number>;
}

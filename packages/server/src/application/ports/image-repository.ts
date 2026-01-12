import type {
  Image,
  CreateImageInput,
  UpdateImageInput,
} from '@/domain/image/index.js';

// Re-export domain types for backward compatibility
export type { Image, CreateImageInput, UpdateImageInput };

/** Image with embedding data */
export interface ImageWithEmbedding {
  id: string;
  path: string;
  embedding: Uint8Array | null;
}

/** Input for updating image embedding */
export interface UpdateEmbeddingInput {
  embedding: Uint8Array;
  embeddedAt: Date;
}

export interface ImageRepository {
  create(input: CreateImageInput): Promise<Image>;
  findById(id: string): Promise<Image | null>;
  findAll(): Promise<Image[]>;
  search(query: string): Promise<Image[]>;
  updateById(id: string, input: UpdateImageInput): Promise<Image>;
  deleteById(id: string): Promise<Image>;

  // Embedding-related methods
  /** Find IDs of images without embedding */
  findIdsWithoutEmbedding(): Promise<Array<{ id: string }>>;
  /** Find images with embeddings (for sync) */
  findWithEmbedding(): Promise<ImageWithEmbedding[]>;
  /** Update embedding for an image */
  updateEmbedding(id: string, input: UpdateEmbeddingInput): Promise<void>;
  /** Clear all embeddings (for regeneration) */
  clearAllEmbeddings(): Promise<void>;
  /** Count total images */
  count(): Promise<number>;
  /** Count images with embedding */
  countWithEmbedding(): Promise<number>;
}

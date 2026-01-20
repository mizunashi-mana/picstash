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

/** Pagination options */
export interface PaginationOptions {
  limit: number;
  offset: number;
}

/** Paginated result */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ImageRepository {
  create: (input: CreateImageInput) => Promise<Image>;
  findById: (id: string) => Promise<Image | null>;
  /** Find multiple images by IDs */
  findByIds: (ids: string[]) => Promise<Image[]>;
  findAll: () => Promise<Image[]>;
  /** Find all images with pagination */
  findAllPaginated: (options: PaginationOptions) => Promise<PaginatedResult<Image>>;
  search: (query: string) => Promise<Image[]>;
  /** Search images with pagination */
  searchPaginated: (query: string, options: PaginationOptions) => Promise<PaginatedResult<Image>>;
  updateById: (id: string, input: UpdateImageInput) => Promise<Image>;
  deleteById: (id: string) => Promise<Image>;

  // Embedding-related methods
  /** Find IDs of images without embedding */
  findIdsWithoutEmbedding: () => Promise<Array<{ id: string }>>;
  /** Find a specific image with its embedding */
  findByIdWithEmbedding: (id: string) => Promise<ImageWithEmbedding | null>;
  /** Find images with embeddings (for sync) */
  findWithEmbedding: () => Promise<ImageWithEmbedding[]>;
  /** Update embedding for an image */
  updateEmbedding: (id: string, input: UpdateEmbeddingInput) => Promise<void>;
  /** Clear all embeddings (for regeneration) */
  clearAllEmbeddings: () => Promise<void>;
  /** Count total images */
  count: () => Promise<number>;
  /** Count images with embedding */
  countWithEmbedding: () => Promise<number>;
}

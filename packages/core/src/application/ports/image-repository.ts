import type {
  ImageEntity,
  ImageListItem,
  ImageDetail,
  CreateImageInput,
  UpdateImageInput,
} from '@/domain/image/index.js';

// Re-export domain types for convenience
export type {
  ImageEntity,
  ImageListItem,
  ImageDetail,
  CreateImageInput,
  UpdateImageInput,
};

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
  // Command operations → return ImageEntity
  create: (input: CreateImageInput) => Promise<ImageEntity>;
  updateById: (id: string, input: UpdateImageInput) => Promise<ImageEntity>;
  deleteById: (id: string) => Promise<ImageEntity>;

  // Query operations for detail → return ImageDetail
  findById: (id: string) => Promise<ImageDetail | null>;

  // Query operations for list → return ImageListItem
  findByIds: (ids: string[]) => Promise<ImageListItem[]>;
  findAll: () => Promise<ImageListItem[]>;
  findAllPaginated: (options: PaginationOptions) => Promise<PaginatedResult<ImageListItem>>;
  search: (query: string) => Promise<ImageListItem[]>;
  searchPaginated: (query: string, options: PaginationOptions) => Promise<PaginatedResult<ImageListItem>>;

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

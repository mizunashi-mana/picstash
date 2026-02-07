import type {
  CollectionEntity,
  CollectionImage,
  CollectionListItem,
  CollectionDetail,
  CreateCollectionInput,
  UpdateCollectionInput,
  AddImageToCollectionInput,
  UpdateImageOrderInput,
} from '@/domain/collection/index.js';

// Re-export domain types for convenience
export type {
  CollectionEntity,
  CollectionImage,
  CollectionListItem,
  CollectionDetail,
  CreateCollectionInput,
  UpdateCollectionInput,
  AddImageToCollectionInput,
  UpdateImageOrderInput,
};
export type { CollectionImageInfo } from '@/domain/collection/index.js';

export interface CollectionRepository {
  // Command operations → return CollectionEntity
  create: (input: CreateCollectionInput) => Promise<CollectionEntity>;
  updateById: (id: string, input: UpdateCollectionInput) => Promise<CollectionEntity>;
  deleteById: (id: string) => Promise<CollectionEntity>;

  // Query operations for detail → return CollectionDetail
  findById: (id: string) => Promise<CollectionEntity | null>;
  findByIdWithImages: (id: string) => Promise<CollectionDetail | null>;

  // Query operations for list → return CollectionListItem
  findAll: () => Promise<CollectionListItem[]>;

  // Collection image management → return CollectionImage (junction entity)
  addImage: (collectionId: string, input: AddImageToCollectionInput) => Promise<CollectionImage>;
  removeImage: (collectionId: string, imageId: string) => Promise<void>;
  updateImageOrder: (collectionId: string, orders: UpdateImageOrderInput[]) => Promise<void>;

  // Query helpers → return CollectionEntity (for command operations context)
  findCollectionsByImageId: (imageId: string) => Promise<CollectionEntity[]>;
}

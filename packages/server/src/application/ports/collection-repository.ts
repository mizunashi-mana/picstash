import type {
  Collection,
  CollectionWithCount,
  CollectionImage,
  CreateCollectionInput,
  UpdateCollectionInput,
  AddImageToCollectionInput,
  UpdateImageOrderInput,
} from '@/domain/collection/index.js';

// Re-export domain types for convenience
export type {
  Collection,
  CollectionWithCount,
  CollectionImage,
  CreateCollectionInput,
  UpdateCollectionInput,
  AddImageToCollectionInput,
  UpdateImageOrderInput,
};

/** Image info for collection display */
export interface CollectionImageInfo {
  id: string;
  imageId: string;
  order: number;
  filename: string;
  thumbnailPath: string | null;
}

/** Collection with its images */
export interface CollectionWithImages extends Collection {
  images: CollectionImageInfo[];
}

export interface CollectionRepository {
  // Collection CRUD
  create: (input: CreateCollectionInput) => Promise<Collection>;
  findById: (id: string) => Promise<Collection | null>;
  findByIdWithImages: (id: string) => Promise<CollectionWithImages | null>;
  findAll: () => Promise<CollectionWithCount[]>;
  updateById: (id: string, input: UpdateCollectionInput) => Promise<Collection>;
  deleteById: (id: string) => Promise<Collection>;

  // Collection image management
  addImage: (collectionId: string, input: AddImageToCollectionInput) => Promise<CollectionImage>;
  removeImage: (collectionId: string, imageId: string) => Promise<void>;
  updateImageOrder: (collectionId: string, orders: UpdateImageOrderInput[]) => Promise<void>;

  // Query helpers
  findCollectionsByImageId: (imageId: string) => Promise<Collection[]>;
}

/**
 * Collection entity
 */
export interface Collection {
  id: string;
  name: string;
  description: string | null;
  coverImageId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Collection with image count for list display
 */
export interface CollectionWithCount extends Collection {
  imageCount: number;
}

/**
 * Collection image entity (junction table)
 */
export interface CollectionImage {
  id: string;
  collectionId: string;
  imageId: string;
  order: number;
  createdAt: Date;
}

/**
 * Input for creating a new collection
 */
export interface CreateCollectionInput {
  name: string;
  description?: string;
  coverImageId?: string;
}

/**
 * Input for updating a collection
 */
export interface UpdateCollectionInput {
  name?: string;
  description?: string | null;
  coverImageId?: string | null;
}

/**
 * Input for adding an image to a collection
 */
export interface AddImageToCollectionInput {
  imageId: string;
  order?: number;
}

/**
 * Input for updating image order in a collection
 */
export interface UpdateImageOrderInput {
  imageId: string;
  order: number;
}

/**
 * Image info for collection detail display
 */
export interface CollectionImageInfo {
  id: string;
  imageId: string;
  order: number;
  title: string;
  thumbnailPath: string | null;
}

/**
 * Collection read model for detail page display
 *
 * Includes full collection data with associated images.
 * Used for collection detail view and editing.
 */
export interface CollectionDetail {
  id: string;
  name: string;
  description: string | null;
  coverImageId: string | null;
  createdAt: Date;
  updatedAt: Date;
  images: CollectionImageInfo[];
}

/**
 * Collection read model for list display
 *
 * Includes basic collection info with image count.
 * Used in collection gallery and selection lists.
 */
export interface CollectionListItem {
  id: string;
  name: string;
  description: string | null;
  coverImageId: string | null;
  imageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

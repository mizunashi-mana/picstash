/**
 * Image read model for detail page display
 *
 * Includes all image data including description and path.
 * Related data (attributes, collections) are fetched separately.
 */
export interface ImageDetail {
  id: string;
  path: string;
  thumbnailPath: string | null;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

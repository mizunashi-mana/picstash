/**
 * Image read model for list/gallery display
 *
 * Optimized for displaying images in a grid or list view.
 * Includes description for tooltips and context display.
 * Does not include path (only needed for file operations).
 */
export interface ImageListItem {
  id: string;
  title: string;
  description: string | null;
  thumbnailPath: string | null;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Image entity
 */
export interface Image {
  id: string;
  filename: string;
  path: string;
  thumbnailPath: string | null;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new image
 */
export interface CreateImageInput {
  filename: string;
  path: string;
  thumbnailPath?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
}

/**
 * Input for updating an image
 */
export interface UpdateImageInput {
  description?: string | null;
}

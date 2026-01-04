export interface ImageMetadata {
  width: number;
  height: number;
}

export interface ThumbnailResult {
  filename: string;
  path: string;
}

export interface ImageProcessor {
  getMetadata(buffer: Buffer): Promise<ImageMetadata>;
  generateThumbnail(buffer: Buffer, filename: string): Promise<ThumbnailResult>;
}

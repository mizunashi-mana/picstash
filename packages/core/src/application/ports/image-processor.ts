export interface ImageMetadata {
  width: number;
  height: number;
}

export interface ImageProcessor {
  getMetadata: (imageData: Buffer) => Promise<ImageMetadata>;
  generateThumbnail: (imageData: Buffer) => Promise<Buffer>;
}

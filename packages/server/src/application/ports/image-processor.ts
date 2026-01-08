export interface ImageMetadata {
  width: number;
  height: number;
}

export interface ThumbnailResult {
  filename: string;
  path: string;
}

export interface ImageProcessor {
  getMetadata(filePath: string): Promise<ImageMetadata>;
  generateThumbnail(
    inputFilePath: string,
    outputFilename: string,
  ): Promise<ThumbnailResult>;
  /** Generate a thumbnail from an in-memory buffer, returns JPEG buffer */
  generateThumbnailFromBuffer(imageBuffer: Buffer): Promise<Buffer>;
}

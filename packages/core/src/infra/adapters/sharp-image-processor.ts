import 'reflect-metadata';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { inject, injectable } from 'inversify';
import sharp from 'sharp';
import { TYPES } from '@/infra/di/types.js';
import type {
  ImageMetadata,
  ImageProcessor,
  ThumbnailResult,
} from '@/application/ports/image-processor.js';
import type { CoreConfig } from '@/config.js';

const THUMBNAIL_SIZE = 300;

@injectable()
export class SharpImageProcessor implements ImageProcessor {
  private readonly storagePath: string;

  constructor(@inject(TYPES.Config) config: CoreConfig) {
    // storage.path must be an absolute path (resolved by server package)
    this.storagePath = config.storage.path;
  }

  private getThumbnailsPath(): string {
    return join(this.storagePath, 'thumbnails');
  }

  private async ensureDirectory(dir: string): Promise<void> {
    await mkdir(dir, { recursive: true });
  }

  async getMetadata(filePath: string): Promise<ImageMetadata> {
    const metadata = await sharp(filePath).metadata();
    const { width, height } = metadata;

    // Runtime check: width/height can be undefined for corrupted images
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Sharp returns undefined for corrupted files
    if (width === undefined || height === undefined) {
      throw new Error('Unable to determine image dimensions from file');
    }

    return { width, height };
  }

  async generateThumbnail(
    inputFilePath: string,
    outputFilename: string,
  ): Promise<ThumbnailResult> {
    await this.ensureDirectory(this.getThumbnailsPath());

    let thumbnailFilename = outputFilename.replace(/\.[^.]+$/, '.jpg');
    if (thumbnailFilename === outputFilename) {
      thumbnailFilename = `${outputFilename}.jpg`;
    }
    const thumbnailFilePath = join(this.getThumbnailsPath(), thumbnailFilename);

    await sharp(inputFilePath)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailFilePath);

    return {
      filename: thumbnailFilename,
      path: `thumbnails/${thumbnailFilename}`,
    };
  }

  async generateThumbnailFromBuffer(imageBuffer: Buffer): Promise<Buffer> {
    return await sharp(imageBuffer)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  }
}

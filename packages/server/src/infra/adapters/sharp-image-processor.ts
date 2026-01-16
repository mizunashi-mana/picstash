import 'reflect-metadata';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { injectable } from 'inversify';
import sharp from 'sharp';
import { config } from '@/config.js';
import type {
  ImageMetadata,
  ImageProcessor,
  ThumbnailResult,
} from '@/application/ports/image-processor.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const storagePath = resolve(currentDir, '../../..', config.storage.path);
const thumbnailsPath = join(storagePath, 'thumbnails');

const THUMBNAIL_SIZE = 300;

@injectable()
export class SharpImageProcessor implements ImageProcessor {
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
    await this.ensureDirectory(thumbnailsPath);

    let thumbnailFilename = outputFilename.replace(/\.[^.]+$/, '.jpg');
    if (thumbnailFilename === outputFilename) {
      thumbnailFilename = `${outputFilename}.jpg`;
    }
    const thumbnailFilePath = join(thumbnailsPath, thumbnailFilename);

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

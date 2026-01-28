import 'reflect-metadata';
import { injectable } from 'inversify';
import sharp from 'sharp';
import type {
  ImageMetadata,
  ImageProcessor,
} from '@/application/ports/image-processor.js';

const THUMBNAIL_SIZE = 300;

@injectable()
export class SharpImageProcessor implements ImageProcessor {
  async getMetadata(imageData: Buffer): Promise<ImageMetadata> {
    const metadata = await sharp(imageData).metadata();
    const { width, height } = metadata;

    // Runtime check: width/height can be undefined for corrupted images
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Sharp returns undefined for corrupted files
    if (width === undefined || height === undefined) {
      throw new Error('Unable to determine image dimensions from file');
    }

    return { width, height };
  }

  async generateThumbnail(imageData: Buffer): Promise<Buffer> {
    return await sharp(imageData)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  }
}

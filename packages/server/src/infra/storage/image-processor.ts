import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { config } from '@/config.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const storagePath = resolve(currentDir, '../../..', config.storage.path);
const thumbnailsPath = join(storagePath, 'thumbnails');

const THUMBNAIL_SIZE = 300;

export interface ImageMetadata {
  width: number;
  height: number;
}

export interface ThumbnailResult {
  filename: string;
  path: string;
}

async function ensureDirectory(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

/**
 * Get image metadata (width, height)
 */
export async function getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  const metadata = await sharp(buffer).metadata();
  const { width, height } = metadata;

  // Runtime check: width/height can be undefined for corrupted images
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Sharp returns undefined for corrupted files
  if (width === undefined || height === undefined) {
    throw new Error('Unable to determine image dimensions from buffer');
  }

  return { width, height };
}

/**
 * Generate a thumbnail from an image buffer
 */
export async function generateThumbnail(
  buffer: Buffer,
  filename: string,
): Promise<ThumbnailResult> {
  await ensureDirectory(thumbnailsPath);

  const thumbnailBuffer = await sharp(buffer)
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 80 })
    .toBuffer();

  let thumbnailFilename = filename.replace(/\.[^.]+$/, '.jpg');
  if (thumbnailFilename === filename) {
    thumbnailFilename = `${filename}.jpg`;
  }
  const thumbnailFilePath = join(thumbnailsPath, thumbnailFilename);

  await writeFile(thumbnailFilePath, thumbnailBuffer);

  return {
    filename: thumbnailFilename,
    path: `thumbnails/${thumbnailFilename}`,
  };
}

import { stat } from 'node:fs/promises';
import type { FileStorage } from '@/application/ports/file-storage.js';
import type { ImageProcessor } from '@/application/ports/image-processor.js';
import type { Image, ImageRepository } from '@/application/ports/image-repository.js';
import type { Readable } from 'node:stream';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

export interface UploadImageInput {
  filename: string;
  mimetype: string;
  stream: Readable;
}

export type UploadImageResult
  = | { success: true; image: Image }
    | { success: false; error: 'INVALID_MIME_TYPE'; message: string };

export interface UploadImageDeps {
  imageRepository: ImageRepository;
  fileStorage: FileStorage;
  imageProcessor: ImageProcessor;
}

export async function uploadImage(
  input: UploadImageInput,
  deps: UploadImageDeps,
): Promise<UploadImageResult> {
  const { filename, mimetype, stream } = input;
  const { imageRepository, fileStorage, imageProcessor } = deps;

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
    return {
      success: false,
      error: 'INVALID_MIME_TYPE',
      message: `Invalid file type: ${mimetype}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  // Get file extension
  const extFromFilename = filename.includes('.')
    ? filename.slice(filename.lastIndexOf('.'))
    : '';
  const extFromMime = mimetype.split('/')[1] ?? '';
  const extension = extFromFilename !== '' ? extFromFilename : `.${extFromMime}`;

  // Save file from stream to storage
  const saved = await fileStorage.saveOriginalFromStream(stream, extension);
  const absolutePath = fileStorage.getAbsolutePath(saved.path);

  // Get file size from saved file
  const fileStat = await stat(absolutePath);
  const fileSize = fileStat.size;

  // Get image metadata and generate thumbnail from saved file
  let metadata;
  let thumbnail;
  try {
    metadata = await imageProcessor.getMetadata(absolutePath);
    thumbnail = await imageProcessor.generateThumbnail(
      absolutePath,
      saved.filename,
    );
  }
  catch (error) {
    // Clean up the saved file if metadata/thumbnail generation fails
    await fileStorage.deleteFile(saved.path).catch(() => {
      // Ignore cleanup errors
    });
    throw error;
  }

  // Create database record
  const image = await imageRepository.create({
    filename: saved.filename,
    path: saved.path,
    thumbnailPath: thumbnail.path,
    mimeType: mimetype,
    size: fileSize,
    width: metadata.width,
    height: metadata.height,
  });

  return { success: true, image };
}

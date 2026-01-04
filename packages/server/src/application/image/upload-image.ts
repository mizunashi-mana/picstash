import type { FileStorage } from '@/application/ports/file-storage.js';
import type { ImageProcessor } from '@/application/ports/image-processor.js';
import type { Image, ImageRepository } from '@/application/ports/image-repository.js';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export interface UploadImageInput {
  filename: string;
  mimetype: string;
  buffer: Buffer;
}

export type UploadImageResult
  = | { success: true; image: Image }
    | { success: false; error: 'INVALID_MIME_TYPE'; message: string }
    | { success: false; error: 'FILE_TOO_LARGE'; message: string };

export interface UploadImageDeps {
  imageRepository: ImageRepository;
  fileStorage: FileStorage;
  imageProcessor: ImageProcessor;
}

export async function uploadImage(
  input: UploadImageInput,
  deps: UploadImageDeps,
): Promise<UploadImageResult> {
  const { filename, mimetype, buffer } = input;
  const { imageRepository, fileStorage, imageProcessor } = deps;

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
    return {
      success: false,
      error: 'INVALID_MIME_TYPE',
      message: `Invalid file type: ${mimetype}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  // Validate file size
  if (buffer.length > MAX_FILE_SIZE) {
    return {
      success: false,
      error: 'FILE_TOO_LARGE',
      message: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Get file extension
  const extFromFilename = filename.includes('.')
    ? filename.slice(filename.lastIndexOf('.'))
    : '';
  const extFromMime = mimetype.split('/')[1] ?? '';
  const extension = extFromFilename !== '' ? extFromFilename : `.${extFromMime}`;

  // Save file to storage
  const saved = await fileStorage.saveOriginal(buffer, extension);

  // Get image metadata and generate thumbnail
  let metadata;
  let thumbnail;
  try {
    metadata = await imageProcessor.getMetadata(buffer);
    thumbnail = await imageProcessor.generateThumbnail(buffer, saved.filename);
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
    size: buffer.length,
    width: metadata.width,
    height: metadata.height,
  });

  return { success: true, image };
}

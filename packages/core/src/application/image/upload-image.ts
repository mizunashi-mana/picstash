import { generateEmbedding, type GenerateEmbeddingDeps } from '@/application/embedding/generate-embedding.js';
import { ImageMimeType, ALLOWED_IMAGE_MIME_TYPES, generateTitle } from '@/domain/image/index.js';
import type { EmbeddingRepository } from '@/application/ports/embedding-repository.js';
import type { EmbeddingService } from '@/application/ports/embedding-service.js';
import type { FileStorage } from '@/application/ports/file-storage.js';
import type { ImageProcessor } from '@/application/ports/image-processor.js';
import type { ImageEntity, ImageRepository } from '@/application/ports/image-repository.js';
import type { Readable } from 'node:stream';

export interface UploadImageInput {
  filename: string;
  mimetype: string;
  stream: Readable;
}

export type UploadImageResult
  = | { success: true; image: ImageEntity }
    | { success: false; error: 'INVALID_MIME_TYPE'; message: string };

export interface UploadImageDeps {
  imageRepository: ImageRepository;
  fileStorage: FileStorage;
  imageProcessor: ImageProcessor;
  embeddingService: EmbeddingService;
  embeddingRepository: EmbeddingRepository;
}

export async function uploadImage(
  input: UploadImageInput,
  deps: UploadImageDeps,
): Promise<UploadImageResult> {
  const { filename, mimetype, stream } = input;
  const { imageRepository, fileStorage, imageProcessor, embeddingService, embeddingRepository } = deps;

  // Validate MIME type using domain value object
  if (!ImageMimeType.isValid(mimetype)) {
    return {
      success: false,
      error: 'INVALID_MIME_TYPE',
      message: `Invalid file type: ${mimetype}. Allowed types: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`,
    };
  }

  // Get file extension
  const extFromFilename = filename.includes('.')
    ? filename.slice(filename.lastIndexOf('.'))
    : '';
  // Map MIME subtype to common file extension (e.g., jpeg -> jpg)
  const mimeSubtype = mimetype.split('/')[1] ?? '';
  const mimeExtensionMap: Record<string, string> = { jpeg: 'jpg' };
  const extFromMime = mimeExtensionMap[mimeSubtype] ?? mimeSubtype;
  const extension = extFromFilename !== '' ? extFromFilename : `.${extFromMime}`;

  // Save file from stream to storage
  const saved = await fileStorage.saveFile(stream, { category: 'originals', extension });

  // Get file size and read image data for processing
  // If these fail, clean up the saved file
  let fileSize: number;
  let imageData: Buffer;
  try {
    fileSize = await fileStorage.getFileSize(saved.path);
    imageData = await fileStorage.readFile(saved.path);
  }
  catch (error) {
    await fileStorage.deleteFile(saved.path).catch(() => {});
    throw error;
  }

  // Get image metadata and generate thumbnail from saved file
  let metadata;
  let thumbnailSaved;
  try {
    metadata = await imageProcessor.getMetadata(imageData);
    const thumbnailBuffer = await imageProcessor.generateThumbnail(imageData);
    const thumbnailFilename = saved.filename.replace(/\.[^.]+$/, '.jpg');
    thumbnailSaved = await fileStorage.saveFileFromBuffer(thumbnailBuffer, {
      category: 'thumbnails',
      extension: '.jpg',
      filename: thumbnailFilename,
    });
  }
  catch (error) {
    // Clean up the saved file if metadata/thumbnail generation fails
    await fileStorage.deleteFile(saved.path).catch(() => {
      // Ignore cleanup errors
    });
    throw error;
  }

  // Create database record with auto-generated title
  let image;
  try {
    const createdAt = new Date();
    const title = generateTitle(null, createdAt);
    image = await imageRepository.create({
      path: saved.path,
      thumbnailPath: thumbnailSaved.path,
      mimeType: mimetype,
      size: fileSize,
      width: metadata.width,
      height: metadata.height,
      title,
      createdAt,
    });
  }
  catch (error) {
    // Clean up saved file and thumbnail if database creation fails
    await fileStorage.deleteFile(saved.path).catch(() => {});
    await fileStorage.deleteFile(thumbnailSaved.path).catch(() => {});
    throw error;
  }

  // Generate embedding in background (non-blocking)
  // This allows the upload to complete quickly while embedding is generated async
  const embeddingDeps: GenerateEmbeddingDeps = {
    imageRepository,
    fileStorage,
    embeddingService,
    embeddingRepository,
  };
  generateEmbedding({ imageId: image.id }, embeddingDeps).catch((error: unknown) => {
    // eslint-disable-next-line no-console -- Background task error logging
    console.error(`Background embedding generation failed for ${image.id}:`, error);
  });

  return { success: true, image };
}

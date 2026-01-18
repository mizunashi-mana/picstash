import { stat } from 'node:fs/promises';
import { generateEmbedding, type GenerateEmbeddingDeps } from '@/application/embedding/generate-embedding.js';
import { ImageMimeType, ALLOWED_IMAGE_MIME_TYPES, generateTitle } from '@/domain/image/index.js';
import type { EmbeddingRepository } from '@/application/ports/embedding-repository.js';
import type { EmbeddingService } from '@/application/ports/embedding-service.js';
import type { FileStorage } from '@/application/ports/file-storage.js';
import type { ImageProcessor } from '@/application/ports/image-processor.js';
import type { Image, ImageRepository } from '@/application/ports/image-repository.js';
import type { Readable } from 'node:stream';

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

  // Create database record with auto-generated title
  const createdAt = new Date();
  const title = generateTitle(null, createdAt);
  const image = await imageRepository.create({
    path: saved.path,
    thumbnailPath: thumbnail.path,
    mimeType: mimetype,
    size: fileSize,
    width: metadata.width,
    height: metadata.height,
    title,
    createdAt,
  });

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

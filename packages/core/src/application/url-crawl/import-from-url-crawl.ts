import { Readable } from 'node:stream';
import { generateTitle } from '@/domain/image/index.js';
import type { FileStorage } from '@/application/ports/file-storage.js';
import type { ImageProcessor } from '@/application/ports/image-processor.js';
import type { Image, ImageRepository } from '@/application/ports/image-repository.js';
import type { UrlCrawlSessionManager } from '@/application/ports/url-crawl-session-manager.js';

export interface ImportFromUrlCrawlInput {
  sessionId: string;
  indices: number[];
}

export interface ImportResult {
  index: number;
  success: boolean;
  image?: Image;
  error?: string;
}

export interface ImportFromUrlCrawlResult {
  totalRequested: number;
  successCount: number;
  failedCount: number;
  results: ImportResult[];
}

export interface ImportFromUrlCrawlDeps {
  urlCrawlSessionManager: UrlCrawlSessionManager;
  imageRepository: ImageRepository;
  fileStorage: FileStorage;
  imageProcessor: ImageProcessor;
}

/**
 * Get file extension from content type
 */
function getExtensionFromContentType(contentType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/bmp': '.bmp',
  };

  // Handle content type with charset (e.g., "image/jpeg; charset=utf-8")
  const mimeType = contentType.split(';')[0]?.trim().toLowerCase();
  return mimeToExt[mimeType ?? ''] ?? '.jpg';
}

export async function importFromUrlCrawl(
  input: ImportFromUrlCrawlInput,
  deps: ImportFromUrlCrawlDeps,
): Promise<ImportFromUrlCrawlResult> {
  const { sessionId, indices } = input;
  const { urlCrawlSessionManager, imageRepository, fileStorage, imageProcessor } = deps;

  const session = urlCrawlSessionManager.getSession(sessionId);
  if (session === undefined) {
    return {
      totalRequested: indices.length,
      successCount: 0,
      failedCount: indices.length,
      results: indices.map(index => ({
        index,
        success: false,
        error: 'Session not found',
      })),
    };
  }

  const results: ImportResult[] = [];
  let successCount = 0;
  let failedCount = 0;

  for (const index of indices) {
    const entry = session.imageEntries.find(e => e.index === index);
    if (entry === undefined) {
      results.push({
        index,
        success: false,
        error: `Image ${index} not found in session`,
      });
      failedCount++;
      continue;
    }

    try {
      // Fetch image from URL
      const { data: imageBuffer, contentType } = await urlCrawlSessionManager.fetchImage(
        sessionId,
        index,
      );

      // Get extension from content type
      const extension = getExtensionFromContentType(contentType);
      const mimeType = contentType.split(';')[0]?.trim() ?? 'application/octet-stream';

      // Convert buffer to stream and save to storage
      const stream = Readable.from(imageBuffer);
      const saved = await fileStorage.saveFile(stream, { category: 'originals', extension });

      // Get file size
      const fileSize = await fileStorage.getFileSize(saved.path);

      // Read image data for processing
      const imageData = await fileStorage.readFile(saved.path);

      // Get metadata and generate thumbnail
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
        // Clean up saved file if metadata/thumbnail fails
        await fileStorage.deleteFile(saved.path).catch(() => {});
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
          mimeType,
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

      results.push({
        index,
        success: true,
        image,
      });
      successCount++;
    }
    catch (error) {
      results.push({
        index,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      failedCount++;
    }
  }

  return {
    totalRequested: indices.length,
    successCount,
    failedCount,
    results,
  };
}

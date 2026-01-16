import { stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { Readable } from 'node:stream';
import { getMimeTypeFromExtension } from '@/domain/archive/index.js';
import type { ArchiveSessionManager } from '@/application/ports/archive-session-manager.js';
import type { FileStorage } from '@/application/ports/file-storage.js';
import type { ImageProcessor } from '@/application/ports/image-processor.js';
import type { Image, ImageRepository } from '@/application/ports/image-repository.js';

export interface ImportFromArchiveInput {
  sessionId: string;
  indices: number[];
}

export interface ImportResult {
  index: number;
  success: boolean;
  image?: Image;
  error?: string;
}

export interface ImportFromArchiveResult {
  totalRequested: number;
  successCount: number;
  failedCount: number;
  results: ImportResult[];
}

export interface ImportFromArchiveDeps {
  archiveSessionManager: ArchiveSessionManager;
  imageRepository: ImageRepository;
  fileStorage: FileStorage;
  imageProcessor: ImageProcessor;
}

export async function importFromArchive(
  input: ImportFromArchiveInput,
  deps: ImportFromArchiveDeps,
): Promise<ImportFromArchiveResult> {
  const { sessionId, indices } = input;
  const { archiveSessionManager, imageRepository, fileStorage, imageProcessor } = deps;

  const session = archiveSessionManager.getSession(sessionId);
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
        error: `Entry ${index} not found in archive`,
      });
      failedCount++;
      continue;
    }

    try {
      // Extract image from archive
      const imageBuffer = await archiveSessionManager.extractImage(sessionId, index);

      // Get extension and MIME type using domain function
      const extension = extname(entry.filename).toLowerCase();
      const mimeType = getMimeTypeFromExtension(extension);

      // Convert buffer to stream and save to storage
      const stream = Readable.from(imageBuffer);
      const saved = await fileStorage.saveOriginalFromStream(stream, extension);
      const absolutePath = fileStorage.getAbsolutePath(saved.path);

      // Get file size
      const fileStat = await stat(absolutePath);
      const fileSize = fileStat.size;

      // Get metadata and generate thumbnail
      let metadata;
      let thumbnail;
      try {
        metadata = await imageProcessor.getMetadata(absolutePath);
        thumbnail = await imageProcessor.generateThumbnail(absolutePath, saved.filename);
      }
      catch (error) {
        // Clean up saved file if metadata/thumbnail fails
        await fileStorage.deleteFile(saved.path).catch(() => {});
        throw error;
      }

      // Create database record
      let image;
      try {
        image = await imageRepository.create({
          filename: saved.filename,
          path: saved.path,
          thumbnailPath: thumbnail.path,
          mimeType,
          size: fileSize,
          width: metadata.width,
          height: metadata.height,
        });
      }
      catch (error) {
        // Clean up saved file and thumbnail if database creation fails
        await fileStorage.deleteFile(saved.path).catch(() => {});
        await fileStorage.deleteFile(thumbnail.path).catch(() => {});
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

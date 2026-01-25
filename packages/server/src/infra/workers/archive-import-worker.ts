import { stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { Readable } from 'node:stream';
import { getMimeTypeFromExtension } from '@/domain/archive/index.js';
import { generateTitle } from '@/domain/image/index.js';
import type { ArchiveSessionManager } from '@/application/ports/archive-session-manager.js';
import type { FileStorage } from '@/application/ports/file-storage.js';
import type { ImageProcessor } from '@/application/ports/image-processor.js';
import type { ImageRepository } from '@/application/ports/image-repository.js';
import type { Job } from '@/application/ports/job-queue.js';
import type { JobHandler } from '@/infra/queue/job-worker.js';

/** アーカイブインポートジョブのタイプ名 */
export const ARCHIVE_IMPORT_JOB_TYPE = 'archive-import';

/** アーカイブインポートジョブのペイロード */
export interface ArchiveImportJobPayload {
  sessionId: string;
  indices: number[];
}

/** 個別の画像インポート結果 */
export interface ArchiveImportImageResult {
  index: number;
  success: boolean;
  imageId?: string;
  error?: string;
}

/** アーカイブインポートジョブの結果 */
export interface ArchiveImportJobResult {
  totalRequested: number;
  successCount: number;
  failedCount: number;
  results: ArchiveImportImageResult[];
}

/**
 * アーカイブインポートワーカーを作成
 */
export function createArchiveImportJobHandler(deps: {
  archiveSessionManager: ArchiveSessionManager;
  imageRepository: ImageRepository;
  fileStorage: FileStorage;
  imageProcessor: ImageProcessor;
}): JobHandler<ArchiveImportJobPayload, ArchiveImportJobResult> {
  const { archiveSessionManager, imageRepository, fileStorage, imageProcessor } = deps;

  return async (
    job: Job<ArchiveImportJobPayload>,
    updateProgress: (progress: number) => Promise<void>,
  ): Promise<ArchiveImportJobResult> => {
    const { sessionId, indices } = job.payload;

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

    const results: ArchiveImportImageResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    let processedCount = 0;
    for (const index of indices) {
      // 進捗を更新（0-100%）
      const progress = Math.round(((processedCount + 0.5) / indices.length) * 100);
      await updateProgress(progress);

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
          /* v8 ignore next */
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
            thumbnailPath: thumbnail.path,
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
          /* v8 ignore start */
          await fileStorage.deleteFile(saved.path).catch(() => {});
          await fileStorage.deleteFile(thumbnail.path).catch(() => {});
          /* v8 ignore stop */
          throw error;
        }

        results.push({
          index,
          success: true,
          imageId: image.id,
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
      processedCount++;
    }

    // 完了
    await updateProgress(100);

    return {
      totalRequested: indices.length,
      successCount,
      failedCount,
      results,
    };
  };
}

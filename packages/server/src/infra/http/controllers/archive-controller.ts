import { inject, injectable } from 'inversify';
import { TYPES } from '@/infra/di/types.js';
import { ARCHIVE_IMPORT_JOB_TYPE } from '@/infra/workers/index.js';
import type { ArchiveSessionManager } from '@/application/ports/archive-session-manager.js';
import type { ImageProcessor } from '@/application/ports/image-processor.js';
import type { JobQueue, JobStatus } from '@/application/ports/job-queue.js';
import type { ArchiveImportJobPayload, ArchiveImportJobResult } from '@/infra/workers/index.js';
import type { FastifyInstance } from 'fastify';

function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
  };
  return mimeTypes[ext ?? ''] ?? 'application/octet-stream';
}

@injectable()
export class ArchiveController {
  constructor(
    @inject(TYPES.ArchiveSessionManager) private readonly sessionManager: ArchiveSessionManager,
    @inject(TYPES.ImageProcessor) private readonly imageProcessor: ImageProcessor,
    @inject(TYPES.JobQueue) private readonly jobQueue: JobQueue,
  ) {}

  registerRoutes(app: FastifyInstance): void {
    // Upload archive and create session
    app.post('/api/archives', async (request, reply) => {
      const file = await request.file();

      if (file === undefined) {
        return await reply.status(400).send({
          error: 'Bad Request',
          message: 'No file uploaded',
        });
      }

      const result = await this.sessionManager.createSession({
        filename: file.filename,
        mimeType: file.mimetype,
        stream: file.file,
      });

      if (!result.success) {
        let statusCode: number;
        let errorType: string;
        switch (result.error) {
          case 'EMPTY_ARCHIVE':
            statusCode = 400;
            errorType = 'Bad Request';
            break;
          case 'FILE_TOO_LARGE':
            statusCode = 413;
            errorType = 'Payload Too Large';
            break;
          case 'UNSUPPORTED_FORMAT':
            statusCode = 415;
            errorType = 'Unsupported Media Type';
            break;
        }
        return await reply.status(statusCode).send({
          error: errorType,
          message: result.message,
        });
      }

      return await reply.status(201).send({
        sessionId: result.session.id,
        filename: result.session.filename,
        archiveType: result.session.archiveType,
        imageCount: result.session.imageEntries.length,
      });
    });

    // Get session info and image entries
    app.get<{ Params: { sessionId: string } }>(
      '/api/archives/:sessionId',
      async (request, reply) => {
        const { sessionId } = request.params;
        const session = this.sessionManager.getSession(sessionId);

        if (session === undefined) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Archive session not found',
          });
        }

        return await reply.send({
          sessionId: session.id,
          filename: session.filename,
          archiveType: session.archiveType,
          imageCount: session.imageEntries.length,
          images: session.imageEntries.map(entry => ({
            index: entry.index,
            filename: entry.filename,
            path: entry.path,
            size: entry.size,
          })),
        });
      },
    );

    // Get thumbnail for an image in the archive
    app.get<{ Params: { sessionId: string; fileIndex: string } }>(
      '/api/archives/:sessionId/files/:fileIndex/thumbnail',
      async (request, reply) => {
        const { sessionId, fileIndex } = request.params;
        const entryIndex = parseInt(fileIndex, 10);

        if (Number.isNaN(entryIndex)) {
          return await reply.status(400).send({
            error: 'Bad Request',
            message: 'Invalid file index',
          });
        }

        const session = this.sessionManager.getSession(sessionId);
        if (session === undefined) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Archive session not found',
          });
        }

        const entry = session.imageEntries.find(e => e.index === entryIndex);
        if (entry === undefined) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Image not found in archive',
          });
        }

        try {
          const imageBuffer = await this.sessionManager.extractImage(
            sessionId,
            entryIndex,
          );

          const thumbnail = await this.imageProcessor.generateThumbnailFromBuffer(
            imageBuffer,
          );

          return await reply
            .header('Content-Type', 'image/jpeg')
            .header('Cache-Control', 'private, max-age=3600')
            .send(thumbnail);
        }
        catch (error) {
          request.log.error(error, 'Failed to extract thumbnail');
          return await reply.status(500).send({
            error: 'Internal Server Error',
            message: 'Failed to extract image from archive',
          });
        }
      },
    );

    // Get full-size image from the archive
    app.get<{ Params: { sessionId: string; fileIndex: string } }>(
      '/api/archives/:sessionId/files/:fileIndex/file',
      async (request, reply) => {
        const { sessionId, fileIndex } = request.params;
        const entryIndex = parseInt(fileIndex, 10);

        if (Number.isNaN(entryIndex)) {
          return await reply.status(400).send({
            error: 'Bad Request',
            message: 'Invalid file index',
          });
        }

        const session = this.sessionManager.getSession(sessionId);
        if (session === undefined) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Archive session not found',
          });
        }

        const entry = session.imageEntries.find(e => e.index === entryIndex);
        if (entry === undefined) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Image not found in archive',
          });
        }

        try {
          const imageBuffer = await this.sessionManager.extractImage(
            sessionId,
            entryIndex,
          );

          const mimeType = getMimeType(entry.filename);

          return await reply
            .header('Content-Type', mimeType)
            .header('Cache-Control', 'private, max-age=3600')
            .send(imageBuffer);
        }
        catch (error) {
          request.log.error(error, 'Failed to extract image');
          return await reply.status(500).send({
            error: 'Internal Server Error',
            message: 'Failed to extract image from archive',
          });
        }
      },
    );

    // Import selected images from archive to library (async)
    app.post<{
      Params: { sessionId: string };
      Body: { indices: number[] };
    }>(
      '/api/archives/:sessionId/import',
      async (request, reply) => {
        const { sessionId } = request.params;
        const { indices } = request.body;

        if (!Array.isArray(indices) || indices.length === 0) {
          return await reply.status(400).send({
            error: 'Bad Request',
            message: 'indices must be a non-empty array of numbers',
          });
        }

        // Validate all indices are non-negative integers
        if (!indices.every(i => typeof i === 'number' && Number.isInteger(i) && i >= 0)) {
          return await reply.status(400).send({
            error: 'Bad Request',
            message: 'All indices must be non-negative integers',
          });
        }

        const session = this.sessionManager.getSession(sessionId);
        if (session === undefined) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Archive session not found',
          });
        }

        try {
          // ジョブをキューに追加して即座にレスポンスを返す
          const payload: ArchiveImportJobPayload = { sessionId, indices };
          const job = await this.jobQueue.add(ARCHIVE_IMPORT_JOB_TYPE, payload);

          return await reply.status(202).send({
            jobId: job.id,
            status: job.status,
            totalRequested: indices.length,
            message: 'Import job queued successfully',
          });
        }
        catch (error) {
          request.log.error(error, 'Failed to queue archive import job');
          return await reply.status(500).send({
            error: 'Internal Server Error',
            message: 'Failed to queue archive import job',
          });
        }
      },
    );

    // Get import job status
    app.get<{ Params: { jobId: string } }>(
      '/api/import-jobs/:jobId',
      async (request, reply) => {
        const { jobId } = request.params;

        const job = await this.jobQueue.getJob<ArchiveImportJobPayload, ArchiveImportJobResult>(jobId);
        if (job === null) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Import job not found',
          });
        }

        // ジョブタイプを確認
        if (job.type !== ARCHIVE_IMPORT_JOB_TYPE) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Import job not found',
          });
        }

        const response: {
          jobId: string;
          status: JobStatus;
          progress: number;
          totalRequested: number;
          successCount?: number;
          failedCount?: number;
          results?: Array<{
            index: number;
            success: boolean;
            imageId?: string;
            error?: string;
          }>;
          error?: string;
        } = {
          jobId: job.id,
          status: job.status,
          progress: job.progress,
          totalRequested: job.payload.indices.length,
        };

        if (job.status === 'completed' && job.result !== undefined) {
          response.successCount = job.result.successCount;
          response.failedCount = job.result.failedCount;
          response.results = job.result.results;
        }

        if (job.status === 'failed' && job.error !== undefined) {
          response.error = job.error;
        }

        return await reply.send(response);
      },
    );

    // Delete session
    app.delete<{ Params: { sessionId: string } }>(
      '/api/archives/:sessionId',
      async (request, reply) => {
        const { sessionId } = request.params;

        await this.sessionManager.deleteSession(sessionId);

        return await reply.status(204).send();
      },
    );
  }
}

import { importFromArchive } from '@/application/archive/index.js';
import { container, TYPES } from '@/infra/di/index.js';
import type { ArchiveSessionManager } from '@/application/ports/archive-session-manager.js';
import type { FileStorage } from '@/application/ports/file-storage.js';
import type { ImageProcessor } from '@/application/ports/image-processor.js';
import type { ImageRepository } from '@/application/ports/image-repository.js';
import type { FastifyInstance } from 'fastify';

export function archiveRoutes(app: FastifyInstance): void {
  const sessionManager = container.get<ArchiveSessionManager>(
    TYPES.ArchiveSessionManager,
  );
  const imageProcessor = container.get<ImageProcessor>(TYPES.ImageProcessor);
  const imageRepository = container.get<ImageRepository>(TYPES.ImageRepository);
  const fileStorage = container.get<FileStorage>(TYPES.FileStorage);

  // Upload archive and create session
  app.post('/api/archives', async (request, reply) => {
    const file = await request.file();

    if (file == null) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'No file uploaded',
      });
    }

    const result = await sessionManager.createSession({
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
      return reply.status(statusCode).send({
        error: errorType,
        message: result.message,
      });
    }

    return reply.status(201).send({
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
      const session = sessionManager.getSession(sessionId);

      if (session == null) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Archive session not found',
        });
      }

      return reply.send({
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
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid file index',
        });
      }

      const session = sessionManager.getSession(sessionId);
      if (session == null) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Archive session not found',
        });
      }

      const entry = session.imageEntries.find(e => e.index === entryIndex);
      if (entry == null) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Image not found in archive',
        });
      }

      try {
        const imageBuffer = await sessionManager.extractImage(
          sessionId,
          entryIndex,
        );

        const thumbnail = await imageProcessor.generateThumbnailFromBuffer(
          imageBuffer,
        );

        return reply
          .header('Content-Type', 'image/jpeg')
          .header('Cache-Control', 'private, max-age=3600')
          .send(thumbnail);
      }
      catch (error) {
        request.log.error(error, 'Failed to extract thumbnail');
        return reply.status(500).send({
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
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid file index',
        });
      }

      const session = sessionManager.getSession(sessionId);
      if (session == null) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Archive session not found',
        });
      }

      const entry = session.imageEntries.find(e => e.index === entryIndex);
      if (entry == null) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Image not found in archive',
        });
      }

      try {
        const imageBuffer = await sessionManager.extractImage(
          sessionId,
          entryIndex,
        );

        const mimeType = getMimeType(entry.filename);

        return reply
          .header('Content-Type', mimeType)
          .header('Cache-Control', 'private, max-age=3600')
          .send(imageBuffer);
      }
      catch (error) {
        request.log.error(error, 'Failed to extract image');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to extract image from archive',
        });
      }
    },
  );

  // Import selected images from archive to library
  app.post<{
    Params: { sessionId: string };
    Body: { indices: number[] };
  }>(
    '/api/archives/:sessionId/import',
    async (request, reply) => {
      const { sessionId } = request.params;
      const { indices } = request.body;

      if (!Array.isArray(indices) || indices.length === 0) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'indices must be a non-empty array of numbers',
        });
      }

      // Validate all indices are numbers
      if (!indices.every(i => typeof i === 'number' && Number.isInteger(i))) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'All indices must be integers',
        });
      }

      const session = sessionManager.getSession(sessionId);
      if (session == null) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Archive session not found',
        });
      }

      try {
        const result = await importFromArchive(
          { sessionId, indices },
          {
            archiveSessionManager: sessionManager,
            imageRepository,
            fileStorage,
            imageProcessor,
          },
        );

        return reply.send({
          totalRequested: result.totalRequested,
          successCount: result.successCount,
          failedCount: result.failedCount,
          results: result.results.map(r => ({
            index: r.index,
            success: r.success,
            imageId: r.image?.id,
            error: r.error,
          })),
        });
      }
      catch (error) {
        request.log.error(error, 'Failed to import images from archive');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to import images from archive',
        });
      }
    },
  );

  // Delete session
  app.delete<{ Params: { sessionId: string } }>(
    '/api/archives/:sessionId',
    async (request, reply) => {
      const { sessionId } = request.params;

      await sessionManager.deleteSession(sessionId);

      return reply.status(204).send();
    },
  );
}

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

import {
  deleteImage,
  uploadImage,
  generateTitle,
  type EmbeddingRepository,
  type EmbeddingService,
  type FileStorage,
  type ImageProcessor,
  type ImageRepository,
} from '@picstash/core';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/infra/di/types.js';
import type { FastifyInstance } from 'fastify';

@injectable()
export class ImageController {
  // eslint-disable-next-line @typescript-eslint/max-params -- ImageController handles core image CRUD requiring multiple dependencies
  constructor(
    @inject(TYPES.ImageRepository) private readonly imageRepository: ImageRepository,
    @inject(TYPES.FileStorage) private readonly fileStorage: FileStorage,
    @inject(TYPES.ImageProcessor) private readonly imageProcessor: ImageProcessor,
    @inject(TYPES.EmbeddingService) private readonly embeddingService: EmbeddingService,
    @inject(TYPES.EmbeddingRepository) private readonly embeddingRepository: EmbeddingRepository,
  ) {}

  registerRoutes(app: FastifyInstance): void {
    // Upload image
    app.post('/api/images', async (request, reply) => {
      const file = await request.file();

      if (file === undefined) {
        return await reply.status(400).send({
          error: 'Bad Request',
          message: 'No file uploaded',
        });
      }

      const result = await uploadImage(
        {
          filename: file.filename,
          mimetype: file.mimetype,
          stream: file.file,
        },
        {
          imageRepository: this.imageRepository,
          fileStorage: this.fileStorage,
          imageProcessor: this.imageProcessor,
          embeddingService: this.embeddingService,
          embeddingRepository: this.embeddingRepository,
        },
      );

      // Check if file was truncated due to size limit
      if (file.file.truncated) {
        // Clean up the partially saved file
        if (result.success) {
          await this.fileStorage.deleteFile(result.image.path).catch(() => {
            // Ignore cleanup errors
          });
        }
        return await reply.status(413).send({
          error: 'Payload Too Large',
          message: 'File too large. Maximum size: 50MB',
        });
      }

      if (!result.success) {
        return await reply.status(400).send({
          error: 'Bad Request',
          message: result.message,
        });
      }

      return await reply.status(201).send(result.image);
    });

    // List/search images with optional pagination
    app.get<{ Querystring: { q?: string; limit?: string; offset?: string } }>(
      '/api/images',
      async (request, reply) => {
        const { q, limit: limitStr, offset: offsetStr } = request.query;
        const query = q?.trim() ?? '';

        // If pagination params are provided, use paginated response
        if (limitStr !== undefined || offsetStr !== undefined) {
          const defaultLimit = 50;
          const maxLimit = 100;

          const parsedLimit = limitStr !== undefined ? Number.parseInt(limitStr, 10) : Number.NaN;
          const limit = Number.isNaN(parsedLimit)
            ? defaultLimit
            : Math.min(Math.max(1, parsedLimit), maxLimit);
          const parsedOffset = offsetStr !== undefined ? Number.parseInt(offsetStr, 10) : Number.NaN;
          const offset = Number.isNaN(parsedOffset) ? 0 : Math.max(0, parsedOffset);

          const result = query !== ''
            ? await this.imageRepository.searchPaginated(query, { limit, offset })
            : await this.imageRepository.findAllPaginated({ limit, offset });

          return await reply.send(result);
        }

        // Legacy: return all images as array (for backward compatibility)
        const images = query !== ''
          ? await this.imageRepository.search(query)
          : await this.imageRepository.findAll();
        return await reply.send(images);
      },
    );

    // Get single image metadata
    app.get<{ Params: { id: string } }>(
      '/api/images/:id',
      async (request, reply) => {
        const { id } = request.params;
        const image = await this.imageRepository.findById(id);

        if (image === null) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Image not found',
          });
        }

        return await reply.send(image);
      },
    );

    // Get image file
    app.get<{ Params: { id: string } }>(
      '/api/images/:id/file',
      async (request, reply) => {
        const { id } = request.params;
        const image = await this.imageRepository.findById(id);

        if (image === null) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Image not found',
          });
        }

        if (!(await this.fileStorage.fileExists(image.path))) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Image file not found on disk',
          });
        }

        const stream = await this.fileStorage.readFileAsStream(image.path);
        return await reply
          .header('Content-Type', image.mimeType)
          .header('Cache-Control', 'public, max-age=31536000, immutable')
          .send(stream);
      },
    );

    // Get thumbnail file
    app.get<{ Params: { id: string } }>(
      '/api/images/:id/thumbnail',
      async (request, reply) => {
        const { id } = request.params;
        const image = await this.imageRepository.findById(id);

        if (image === null) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Image not found',
          });
        }

        const filePath = image.thumbnailPath ?? image.path;
        const contentType
          = image.thumbnailPath !== null ? 'image/jpeg' : image.mimeType;

        if (!(await this.fileStorage.fileExists(filePath))) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Thumbnail file not found on disk',
          });
        }

        const stream = await this.fileStorage.readFileAsStream(filePath);
        return await reply
          .header('Content-Type', contentType)
          .header('Cache-Control', 'public, max-age=31536000, immutable')
          .send(stream);
      },
    );

    // Update image
    app.patch<{
      Params: { id: string };
      Body: { description?: string | null };
    }>(
      '/api/images/:id',
      async (request, reply) => {
        const { id } = request.params;
        const { description } = request.body;

        const existing = await this.imageRepository.findById(id);
        if (existing === null) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Image not found',
          });
        }

        // Auto-generate title from new description
        const title = generateTitle(description ?? null, existing.createdAt);
        const updated = await this.imageRepository.updateById(id, { description, title });
        return await reply.send(updated);
      },
    );

    // Delete image
    app.delete<{ Params: { id: string } }>(
      '/api/images/:id',
      async (request, reply) => {
        const { id } = request.params;
        const result = await deleteImage(id, {
          imageRepository: this.imageRepository,
          fileStorage: this.fileStorage,
          embeddingRepository: this.embeddingRepository,
        });

        if (!result.success) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Image not found',
          });
        }

        return await reply.status(204).send();
      },
    );
  }
}

import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import { inject, injectable } from 'inversify';
import { suggestAttributes } from '@/application/attribute-suggestion/suggest-attributes.js';
import { findDuplicates, DEFAULT_DUPLICATE_THRESHOLD } from '@/application/duplicate-detection/index.js';
import { deleteImage, uploadImage } from '@/application/image/index.js';
import { EMBEDDING_DIMENSION } from '@/application/ports/embedding-repository.js';
import { generateTitle } from '@/domain/image/index.js';
import { TYPES } from '@/infra/di/types.js';
import { CAPTION_JOB_TYPE } from '@/infra/workers/index.js';
import type { EmbeddingRepository } from '@/application/ports/embedding-repository.js';
import type { EmbeddingService } from '@/application/ports/embedding-service.js';
import type { FileStorage } from '@/application/ports/file-storage.js';
import type { ImageAttributeRepository } from '@/application/ports/image-attribute-repository.js';
import type { ImageProcessor } from '@/application/ports/image-processor.js';
import type { ImageRepository } from '@/application/ports/image-repository.js';
import type { JobQueue } from '@/application/ports/job-queue.js';
import type { LabelRepository } from '@/application/ports/label-repository.js';
import type { CaptionJobPayload } from '@/infra/workers/index.js';
import type { FastifyInstance } from 'fastify';

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  }
  catch {
    return false;
  }
}

@injectable()
export class ImageController {
  // eslint-disable-next-line @typescript-eslint/max-params -- ImageController handles many image-related features requiring multiple dependencies
  constructor(
    @inject(TYPES.ImageRepository) private readonly imageRepository: ImageRepository,
    @inject(TYPES.LabelRepository) private readonly labelRepository: LabelRepository,
    @inject(TYPES.ImageAttributeRepository) private readonly imageAttributeRepository: ImageAttributeRepository,
    @inject(TYPES.FileStorage) private readonly fileStorage: FileStorage,
    @inject(TYPES.ImageProcessor) private readonly imageProcessor: ImageProcessor,
    @inject(TYPES.EmbeddingService) private readonly embeddingService: EmbeddingService,
    @inject(TYPES.EmbeddingRepository) private readonly embeddingRepository: EmbeddingRepository,
    @inject(TYPES.JobQueue) private readonly jobQueue: JobQueue,
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

        const absolutePath = this.fileStorage.getAbsolutePath(image.path);
        if (!(await fileExists(absolutePath))) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Image file not found on disk',
          });
        }

        const stream = createReadStream(absolutePath);
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
        const absolutePath = this.fileStorage.getAbsolutePath(filePath);

        if (!(await fileExists(absolutePath))) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Thumbnail file not found on disk',
          });
        }

        const stream = createReadStream(absolutePath);
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

    // Get suggested attributes for image
    app.get<{
      Params: { id: string };
      Querystring: { threshold?: string; limit?: string };
    }>(
      '/api/images/:id/suggested-attributes',
      async (request, reply) => {
        const { id } = request.params;
        const { threshold, limit } = request.query;

        const input = {
          imageId: id,
          threshold: threshold !== undefined ? Number.parseFloat(threshold) : undefined,
          limit: limit !== undefined ? Number.parseInt(limit, 10) : undefined,
        };

        const result = await suggestAttributes(input, {
          imageRepository: this.imageRepository,
          labelRepository: this.labelRepository,
          embeddingRepository: this.embeddingRepository,
          imageAttributeRepository: this.imageAttributeRepository,
        });

        if (result === 'IMAGE_NOT_FOUND') {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Image not found',
          });
        }

        if (result === 'IMAGE_NOT_EMBEDDED') {
          return await reply.status(400).send({
            error: 'Bad Request',
            message: 'Image does not have an embedding. Please wait for embedding generation.',
          });
        }

        if (result === 'NO_LABELS_WITH_EMBEDDING') {
          return await reply.status(400).send({
            error: 'Bad Request',
            message: 'No labels have embeddings. Please generate label embeddings first.',
          });
        }

        return await reply.send(result);
      },
    );

    // Generate description for image using AI (async job)
    app.post<{ Params: { id: string } }>(
      '/api/images/:id/generate-description',
      async (request, reply) => {
        const { id } = request.params;

        const image = await this.imageRepository.findById(id);
        if (image === null) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Image not found',
          });
        }

        const absolutePath = this.fileStorage.getAbsolutePath(image.path);
        if (!(await fileExists(absolutePath))) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Image file not found on disk',
          });
        }

        // Create a job for caption generation
        const payload: CaptionJobPayload = { imageId: id };
        const job = await this.jobQueue.add(CAPTION_JOB_TYPE, payload);

        return await reply.status(202).send({
          jobId: job.id,
          status: 'queued',
          message: 'Caption generation job has been queued',
        });
      },
    );

    // Get duplicate image groups
    app.get<{
      Querystring: { threshold?: string };
    }>(
      '/api/images/duplicates',
      async (request, reply) => {
        const { threshold: thresholdStr } = request.query;

        // Validate threshold parameter
        let threshold: number;
        if (thresholdStr === undefined) {
          threshold = DEFAULT_DUPLICATE_THRESHOLD;
        }
        else {
          const parsedThreshold = Number.parseFloat(thresholdStr);
          if (Number.isNaN(parsedThreshold) || parsedThreshold <= 0 || parsedThreshold > 1) {
            return await reply.status(400).send({
              error: 'Bad Request',
              message: '"threshold" must be a number greater than 0 and at most 1.',
            });
          }
          threshold = parsedThreshold;
        }

        const result = await findDuplicates(
          { threshold },
          { imageRepository: this.imageRepository, embeddingRepository: this.embeddingRepository },
        );

        return await reply.send(result);
      },
    );

    // Get similar images
    app.get<{
      Params: { id: string };
      Querystring: { limit?: string };
    }>(
      '/api/images/:id/similar',
      async (request, reply) => {
        const { id } = request.params;
        const { limit: limitStr } = request.query;

        // Validate limit parameter
        const defaultLimit = 10;
        const maxLimit = 100;
        let limit: number;
        if (limitStr === undefined) {
          limit = defaultLimit;
        }
        else {
          const parsedLimit = Number.parseInt(limitStr, 10);
          if (Number.isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > maxLimit) {
            return await reply.status(400).send({
              error: 'Bad Request',
              message: `"limit" must be an integer between 1 and ${maxLimit}.`,
            });
          }
          limit = parsedLimit;
        }

        // Get the image with its embedding
        const imageWithEmbedding = await this.imageRepository.findByIdWithEmbedding(id);
        if (imageWithEmbedding === null) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Image not found',
          });
        }

        if (imageWithEmbedding.embedding === null) {
          return await reply.status(400).send({
            error: 'Bad Request',
            message: 'Image does not have an embedding. Please wait for embedding generation.',
          });
        }

        // Validate embedding dimension
        const expectedByteLength = EMBEDDING_DIMENSION * 4;
        if (imageWithEmbedding.embedding.byteLength !== expectedByteLength) {
          request.log.error(
            `Embedding dimension mismatch for image ${id}: expected ${expectedByteLength} bytes, got ${imageWithEmbedding.embedding.byteLength}`,
          );
          return await reply.status(500).send({
            error: 'Internal Server Error',
            message: 'Corrupted embedding data',
          });
        }

        // Convert Uint8Array to Float32Array for similarity search
        // The embedding is stored as bytes (Uint8Array), which is the raw buffer of Float32Array
        const embedding = new Float32Array(
          imageWithEmbedding.embedding.buffer,
          imageWithEmbedding.embedding.byteOffset,
          imageWithEmbedding.embedding.byteLength / 4,
        );

        // Find similar images, excluding the current image
        const similarResults = this.embeddingRepository.findSimilar(embedding, limit, [id]);

        // Get image details for each similar image
        const similarImages = await Promise.all(
          similarResults.map(async (result) => {
            const image = await this.imageRepository.findById(result.imageId);
            if (image === null) {
              return null;
            }
            return {
              id: image.id,
              title: image.title,
              thumbnailPath: image.thumbnailPath,
              distance: result.distance,
            };
          }),
        );

        // Filter out null values (images that were deleted)
        const validSimilarImages = similarImages.filter(img => img !== null);

        return await reply.send({
          imageId: id,
          similarImages: validSimilarImages,
        });
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

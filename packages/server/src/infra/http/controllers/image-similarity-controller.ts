import {
  findDuplicates,
  DEFAULT_DUPLICATE_THRESHOLD,
  EMBEDDING_DIMENSION,
  type EmbeddingRepository,
  type ImageRepository,
} from '@picstash/core';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/infra/di/types.js';
import type { FastifyInstance } from 'fastify';

@injectable()
export class ImageSimilarityController {
  constructor(
    @inject(TYPES.ImageRepository) private readonly imageRepository: ImageRepository,
    @inject(TYPES.EmbeddingRepository) private readonly embeddingRepository: EmbeddingRepository,
  ) {}

  registerRoutes(app: FastifyInstance): void {
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
  }
}

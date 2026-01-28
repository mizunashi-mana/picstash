import {
  CAPTION_JOB_TYPE,
  suggestAttributes,
  type CaptionJobPayload,
  type EmbeddingRepository,
  type FileStorage,
  type ImageAttributeRepository,
  type ImageRepository,
  type JobQueue,
  type LabelRepository,
} from '@picstash/core';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/infra/di/types.js';
import type { FastifyInstance } from 'fastify';

@injectable()
export class ImageSuggestionController {
  // eslint-disable-next-line @typescript-eslint/max-params -- Handles AI suggestion features requiring multiple dependencies
  constructor(
    @inject(TYPES.ImageRepository) private readonly imageRepository: ImageRepository,
    @inject(TYPES.LabelRepository) private readonly labelRepository: LabelRepository,
    @inject(TYPES.ImageAttributeRepository) private readonly imageAttributeRepository: ImageAttributeRepository,
    @inject(TYPES.EmbeddingRepository) private readonly embeddingRepository: EmbeddingRepository,
    @inject(TYPES.FileStorage) private readonly fileStorage: FileStorage,
    @inject(TYPES.JobQueue) private readonly jobQueue: JobQueue,
  ) {}

  registerRoutes(app: FastifyInstance): void {
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

        if (!(await this.fileStorage.fileExists(image.path))) {
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
  }
}

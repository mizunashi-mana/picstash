import { access } from 'node:fs/promises';
import { inject, injectable } from 'inversify';
import { suggestAttributes } from '@/application/attribute-suggestion/suggest-attributes.js';
import { TYPES } from '@/infra/di/types.js';
import { CAPTION_JOB_TYPE } from '@/infra/workers/index.js';
import type { EmbeddingRepository } from '@/application/ports/embedding-repository.js';
import type { FileStorage } from '@/application/ports/file-storage.js';
import type { ImageAttributeRepository } from '@/application/ports/image-attribute-repository.js';
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
  }
}

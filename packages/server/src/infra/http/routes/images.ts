import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import { suggestAttributes } from '@/application/attribute-suggestion/suggest-attributes.js';
import { findDuplicates, DEFAULT_DUPLICATE_THRESHOLD } from '@/application/duplicate-detection/index.js';
import { deleteImage, uploadImage } from '@/application/image/index.js';
import { EMBEDDING_DIMENSION } from '@/application/ports/embedding-repository.js';
import type { AppContainer } from '@/infra/di/index.js';
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

export function imageRoutes(app: FastifyInstance, container: AppContainer): void {
  const imageRepository = container.getImageRepository();
  const labelRepository = container.getLabelRepository();
  const imageAttributeRepository = container.getImageAttributeRepository();
  const fileStorage = container.getFileStorage();
  const imageProcessor = container.getImageProcessor();
  const embeddingService = container.getEmbeddingService();
  const embeddingRepository = container.getEmbeddingRepository();
  const captionService = container.getCaptionService();

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
      { imageRepository, fileStorage, imageProcessor, embeddingService, embeddingRepository },
    );

    // Check if file was truncated due to size limit
    if (file.file.truncated) {
      // Clean up the partially saved file
      if (result.success) {
        await fileStorage.deleteFile(result.image.path).catch(() => {
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

  // List/search images
  app.get<{ Querystring: { q?: string } }>(
    '/api/images',
    async (request, reply) => {
      const { q } = request.query;
      const images = q !== undefined && q.trim() !== ''
        ? await imageRepository.search(q.trim())
        : await imageRepository.findAll();
      return await reply.send(images);
    },
  );

  // Get single image metadata
  app.get<{ Params: { id: string } }>(
    '/api/images/:id',
    async (request, reply) => {
      const { id } = request.params;
      const image = await imageRepository.findById(id);

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
      const image = await imageRepository.findById(id);

      if (image === null) {
        return await reply.status(404).send({
          error: 'Not Found',
          message: 'Image not found',
        });
      }

      const absolutePath = fileStorage.getAbsolutePath(image.path);
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
      const image = await imageRepository.findById(id);

      if (image === null) {
        return await reply.status(404).send({
          error: 'Not Found',
          message: 'Image not found',
        });
      }

      const filePath = image.thumbnailPath ?? image.path;
      const contentType
        = image.thumbnailPath !== null ? 'image/jpeg' : image.mimeType;
      const absolutePath = fileStorage.getAbsolutePath(filePath);

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

      const existing = await imageRepository.findById(id);
      if (existing === null) {
        return await reply.status(404).send({
          error: 'Not Found',
          message: 'Image not found',
        });
      }

      const updated = await imageRepository.updateById(id, { description });
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
        imageRepository,
        labelRepository,
        embeddingRepository,
        imageAttributeRepository,
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

  // Generate description for image using AI
  app.post<{ Params: { id: string } }>(
    '/api/images/:id/generate-description',
    async (request, reply) => {
      const { id } = request.params;

      const image = await imageRepository.findById(id);
      if (image === null) {
        return await reply.status(404).send({
          error: 'Not Found',
          message: 'Image not found',
        });
      }

      const absolutePath = fileStorage.getAbsolutePath(image.path);
      if (!(await fileExists(absolutePath))) {
        return await reply.status(404).send({
          error: 'Not Found',
          message: 'Image file not found on disk',
        });
      }

      try {
        const result = await captionService.generateFromFile(absolutePath);
        return await reply.send({
          imageId: id,
          description: result.caption,
          model: result.model,
        });
      }
      catch (error) {
        request.log.error(error, 'Failed to generate description');
        return await reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to generate description',
        });
      }
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
        { imageRepository, embeddingRepository },
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
      const imageWithEmbedding = await imageRepository.findByIdWithEmbedding(id);
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
      const similarResults = embeddingRepository.findSimilar(embedding, limit, [id]);

      // Get image details for each similar image
      const similarImages = await Promise.all(
        similarResults.map(async (result) => {
          const image = await imageRepository.findById(result.imageId);
          if (image === null) {
            return null;
          }
          return {
            id: image.id,
            filename: image.filename,
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
      const result = await deleteImage(id, { imageRepository, fileStorage, embeddingRepository });

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

import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import { deleteImage, uploadImage } from '@/application/image/index.js';
import { container, TYPES } from '@/infra/di/index.js';
import type { FileStorage } from '@/application/ports/file-storage.js';
import type { ImageProcessor } from '@/application/ports/image-processor.js';
import type { ImageRepository } from '@/application/ports/image-repository.js';
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

export function imageRoutes(app: FastifyInstance): void {
  const imageRepository = container.get<ImageRepository>(TYPES.ImageRepository);
  const fileStorage = container.get<FileStorage>(TYPES.FileStorage);
  const imageProcessor = container.get<ImageProcessor>(TYPES.ImageProcessor);

  // Upload image
  app.post('/api/images', async (request, reply) => {
    const file = await request.file();

    if (file == null) {
      return reply.status(400).send({
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
      { imageRepository, fileStorage, imageProcessor },
    );

    if (!result.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: result.message,
      });
    }

    return reply.status(201).send(result.image);
  });

  // List all images
  app.get('/api/images', async (_request, reply) => {
    const images = await imageRepository.findAll();
    return reply.send(images);
  });

  // Get single image metadata
  app.get<{ Params: { id: string } }>(
    '/api/images/:id',
    async (request, reply) => {
      const { id } = request.params;
      const image = await imageRepository.findById(id);

      if (image == null) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Image not found',
        });
      }

      return reply.send(image);
    },
  );

  // Get image file
  app.get<{ Params: { id: string } }>(
    '/api/images/:id/file',
    async (request, reply) => {
      const { id } = request.params;
      const image = await imageRepository.findById(id);

      if (image == null) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Image not found',
        });
      }

      const absolutePath = fileStorage.getAbsolutePath(image.path);
      if (!(await fileExists(absolutePath))) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Image file not found on disk',
        });
      }

      const stream = createReadStream(absolutePath);
      return reply
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

      if (image == null) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Image not found',
        });
      }

      const filePath = image.thumbnailPath ?? image.path;
      const contentType
        = image.thumbnailPath != null ? 'image/jpeg' : image.mimeType;
      const absolutePath = fileStorage.getAbsolutePath(filePath);

      if (!(await fileExists(absolutePath))) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Thumbnail file not found on disk',
        });
      }

      const stream = createReadStream(absolutePath);
      return reply
        .header('Content-Type', contentType)
        .header('Cache-Control', 'public, max-age=31536000, immutable')
        .send(stream);
    },
  );

  // Delete image
  app.delete<{ Params: { id: string } }>(
    '/api/images/:id',
    async (request, reply) => {
      const { id } = request.params;
      const result = await deleteImage(id, { imageRepository, fileStorage });

      if (!result.success) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Image not found',
        });
      }

      return reply.status(204).send();
    },
  );
}

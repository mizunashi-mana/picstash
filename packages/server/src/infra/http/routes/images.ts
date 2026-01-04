import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import { deleteImage, uploadImage } from '@/application/image/index.js';
import {
  findAllImages,
  findImageById,
} from '@/infra/database/image-repository.js';
import { getAbsolutePath } from '@/infra/storage/file-storage.js';
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
  // Upload image
  app.post('/api/images', async (request, reply) => {
    const file = await request.file();

    if (file == null) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'No file uploaded',
      });
    }

    const buffer = await file.toBuffer();
    const result = await uploadImage({
      filename: file.filename,
      mimetype: file.mimetype,
      buffer,
    });

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
    const images = await findAllImages();
    return reply.send(images);
  });

  // Get single image metadata
  app.get<{ Params: { id: string } }>(
    '/api/images/:id',
    async (request, reply) => {
      const { id } = request.params;
      const image = await findImageById(id);

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
      const image = await findImageById(id);

      if (image == null) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Image not found',
        });
      }

      const absolutePath = getAbsolutePath(image.path);
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
      const image = await findImageById(id);

      if (image == null) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Image not found',
        });
      }

      const filePath = image.thumbnailPath ?? image.path;
      const contentType = image.thumbnailPath != null ? 'image/jpeg' : image.mimeType;
      const absolutePath = getAbsolutePath(filePath);

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
      const result = await deleteImage(id);

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

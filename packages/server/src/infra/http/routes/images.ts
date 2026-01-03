import { createReadStream } from 'node:fs';
import { extname } from 'node:path';
import {
  createImage,
  findAllImages,
  findImageById,
} from '@/infra/database/image-repository.js';
import {
  getAbsolutePath,
  saveOriginal,
} from '@/infra/storage/file-storage.js';
import type { FastifyInstance } from 'fastify';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function imageRoutes(app: FastifyInstance): void {
  // Upload image
  app.post('/api/images', async (request, reply) => {
    const file = await request.file();

    if (!file) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'No file uploaded',
      });
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: `Invalid file type: ${file.mimetype}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      });
    }

    // Read file buffer
    const buffer = await file.toBuffer();

    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      });
    }

    // Get file extension
    const extFromFilename = extname(file.filename);
    const extFromMime = file.mimetype.split('/')[1] ?? '';
    const extension = extFromFilename !== '' ? extFromFilename : `.${extFromMime}`;

    // Save file to storage
    const { filename, path } = await saveOriginal(buffer, extension);

    // Create database record
    const image = await createImage({
      filename,
      path,
      mimeType: file.mimetype,
      size: buffer.length,
    });

    return reply.status(201).send(image);
  });

  // List all images
  app.get('/api/images', async (_request, reply) => {
    const images = await findAllImages();
    return reply.send(images);
  });

  // Get image file
  app.get<{ Params: { id: string } }>(
    '/api/images/:id/file',
    async (request, reply) => {
      const { id } = request.params;

      const image = await findImageById(id);
      if (!image) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Image not found',
        });
      }

      const absolutePath = getAbsolutePath(image.path);
      const stream = createReadStream(absolutePath);

      return reply
        .header('Content-Type', image.mimeType)
        .header('Cache-Control', 'public, max-age=31536000, immutable')
        .send(stream);
    },
  );
}

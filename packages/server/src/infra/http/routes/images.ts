import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import { extname } from 'node:path';
import {
  createImage,
  findAllImages,
  findImageById,
} from '@/infra/database/image-repository.js';
import {
  deleteFile,
  getAbsolutePath,
  saveOriginal,
} from '@/infra/storage/file-storage.js';
import {
  generateThumbnail,
  getImageMetadata,
} from '@/infra/storage/image-processor.js';
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

    // Get image metadata and generate thumbnail
    let metadata;
    let thumbnail;
    try {
      metadata = await getImageMetadata(buffer);
      thumbnail = await generateThumbnail(buffer, filename);
    }
    catch (error) {
      // Clean up the saved file if metadata/thumbnail generation fails
      await deleteFile(path).catch(() => {
        // Ignore cleanup errors
      });
      throw error;
    }

    // Create database record
    const image = await createImage({
      filename,
      path,
      thumbnailPath: thumbnail.path,
      mimeType: file.mimetype,
      size: buffer.length,
      width: metadata.width,
      height: metadata.height,
    });

    return reply.status(201).send(image);
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
      if (!image) {
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
      if (!image) {
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
      if (!image) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Image not found',
        });
      }

      // If no thumbnail, return original (for backwards compatibility)
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
}

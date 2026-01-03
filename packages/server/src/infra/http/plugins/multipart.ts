import multipart from '@fastify/multipart';
import type { FastifyInstance } from 'fastify';

export async function registerMultipart(app: FastifyInstance): Promise<void> {
  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  });
}

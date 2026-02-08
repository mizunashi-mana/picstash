/* v8 ignore start -- Fastify plugin registration */
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  await app.register(rateLimit, {
    max: 1000,
    timeWindow: '1 minute',
  });
}
/* v8 ignore stop */

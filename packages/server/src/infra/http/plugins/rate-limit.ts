import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  const max = process.env.RATE_LIMIT_MAX !== undefined
    ? Number.parseInt(process.env.RATE_LIMIT_MAX, 10)
    : 100;

  await app.register(rateLimit, {
    max,
    timeWindow: '1 minute',
  });
}

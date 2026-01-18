import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  // Disable rate limit for E2E tests (set DISABLE_RATE_LIMIT=true)
  if (process.env.DISABLE_RATE_LIMIT === 'true') {
    return;
  }

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });
}

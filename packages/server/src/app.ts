import Fastify, { type FastifyInstance } from 'fastify';
import { registerCors } from '@/infra/http/plugins/cors.js';
import { registerMultipart } from '@/infra/http/plugins/multipart.js';
import { registerRateLimit } from '@/infra/http/plugins/rate-limit.js';
import { registerRoutes } from '@/infra/http/routes/index.js';
import { buildLoggerOptions } from '@/infra/logging/index.js';
import type { Config } from '@/config.js';
import type { AppContainer } from '@/infra/di/index.js';

export async function buildApp(
  container: AppContainer,
  config: Config,
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: buildLoggerOptions(config),
  });

  // Register plugins
  await registerCors(app);
  await registerMultipart(app);
  await registerRateLimit(app);

  // Register routes
  registerRoutes(app, container);

  return await app;
}

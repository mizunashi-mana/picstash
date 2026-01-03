import Fastify, { type FastifyInstance } from 'fastify';
import { registerCors } from '@/infra/http/plugins/cors.js';
import { registerRoutes } from '@/infra/http/routes/index.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // Register plugins
  await registerCors(app);

  // Register routes
  registerRoutes(app);

  return app;
}

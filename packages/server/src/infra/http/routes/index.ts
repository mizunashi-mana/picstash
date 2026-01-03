import { healthRoutes } from '@/infra/http/routes/health.js';
import type { FastifyInstance } from 'fastify';

export function registerRoutes(app: FastifyInstance): void {
  // Health check (no prefix)
  app.register(healthRoutes);

  // API v1 routes will be registered here with prefix
  // app.register(imageRoutes, { prefix: '/api/v1/images' });
}

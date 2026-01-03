import { healthRoutes } from '@/infra/http/routes/health.js';
import { imageRoutes } from '@/infra/http/routes/images.js';
import type { FastifyInstance } from 'fastify';

export function registerRoutes(app: FastifyInstance): void {
  // Health check (no prefix)
  app.register(healthRoutes);

  // Image routes
  app.register(imageRoutes);
}

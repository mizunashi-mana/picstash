import { healthRoutes } from '@/infra/http/routes/health.js';
import { imageAttributeRoutes } from '@/infra/http/routes/image-attributes.js';
import { imageRoutes } from '@/infra/http/routes/images.js';
import { labelRoutes } from '@/infra/http/routes/labels.js';
import type { FastifyInstance } from 'fastify';

export function registerRoutes(app: FastifyInstance): void {
  // Health check (no prefix)
  app.register(healthRoutes);

  // Image routes
  app.register(imageRoutes);

  // Image attribute routes
  app.register(imageAttributeRoutes);

  // Label routes
  app.register(labelRoutes);
}

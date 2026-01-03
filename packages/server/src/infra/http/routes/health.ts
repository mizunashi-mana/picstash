import { prisma } from '@/infra/database/prisma.js';
import type { FastifyInstance } from 'fastify';

export function healthRoutes(app: FastifyInstance): void {
  app.get('/health', async (_request, reply) => {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;

      return reply.send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      });
    }
    catch (error) {
      return reply.status(503).send({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

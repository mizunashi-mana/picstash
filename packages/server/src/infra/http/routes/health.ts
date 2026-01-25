import type { PrismaService } from '@picstash/core';
import type { FastifyInstance } from 'fastify';

export function healthRoutes(app: FastifyInstance, prismaService: PrismaService): void {
  app.get('/health', async (_request, reply) => {
    try {
      // Check database connection
      await prismaService.getClient().$queryRaw`SELECT 1`;

      return await reply.send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      });
    }
    catch (error) {
      return await reply.status(503).send({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

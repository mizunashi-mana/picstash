import type { PrismaService } from '@/infra/database/prisma-service.js';
import type { FastifyInstance } from 'fastify';

export function healthRoutes(app: FastifyInstance, databaseService: PrismaService): void {
  app.get('/health', async (_request, reply) => {
    try {
      // Check database connection
      const client = databaseService.getClient();
      await client.$queryRaw`SELECT 1`;

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

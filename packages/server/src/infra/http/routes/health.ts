import type { DatabaseService } from '@picstash/core';
import type { PrismaClient } from '@~generated/prisma/client.js';
import type { FastifyInstance } from 'fastify';

export function healthRoutes(app: FastifyInstance, databaseService: DatabaseService): void {
  app.get('/health', async (_request, reply) => {
    try {
      // Check database connection
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- DatabaseService.getClient() returns PrismaClient
      const client = databaseService.getClient() as PrismaClient;
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

import { Prisma } from '@~generated/prisma/client.js';
import type { AppContainer } from '@/infra/di/index.js';
import type { FastifyInstance } from 'fastify';

interface CreateViewHistoryBody {
  imageId: string;
}

interface UpdateViewHistoryBody {
  duration: number;
}

interface ListViewHistoryQuery {
  limit?: string;
  offset?: string;
}

export function viewHistoryRoutes(app: FastifyInstance, container: AppContainer): void {
  const viewHistoryRepository = container.getViewHistoryRepository();

  // Record view start
  app.post<{ Body: CreateViewHistoryBody }>('/api/view-history', async (request, reply) => {
    const { imageId } = request.body;

    if (imageId.trim() === '') {
      return await reply.status(400).send({
        error: 'Bad Request',
        message: 'Image ID is required',
      });
    }

    try {
      const viewHistory = await viewHistoryRepository.create({
        imageId: imageId.trim(),
      });
      return await reply.status(201).send(viewHistory);
    }
    catch (error) {
      // Handle image not found (P2003: Foreign key constraint violation)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        return await reply.status(404).send({
          error: 'Not Found',
          message: 'Image not found',
        });
      }
      throw error;
    }
  });

  // Update view duration (record view end)
  app.patch<{ Params: { id: string }; Body: UpdateViewHistoryBody }>(
    '/api/view-history/:id',
    async (request, reply) => {
      const { id } = request.params;
      const { duration } = request.body;

      if (typeof duration !== 'number' || duration < 0) {
        return await reply.status(400).send({
          error: 'Bad Request',
          message: 'Duration must be a non-negative number',
        });
      }

      const existing = await viewHistoryRepository.findById(id);
      if (existing === null) {
        return await reply.status(404).send({
          error: 'Not Found',
          message: 'View history record not found',
        });
      }

      const viewHistory = await viewHistoryRepository.updateDuration(id, { duration });
      return await reply.send(viewHistory);
    },
  );

  // Get recent view history
  app.get<{ Querystring: ListViewHistoryQuery }>('/api/view-history', async (request, reply) => {
    const limit = request.query.limit !== undefined && request.query.limit !== ''
      ? parseInt(request.query.limit, 10)
      : undefined;
    const offset = request.query.offset !== undefined && request.query.offset !== ''
      ? parseInt(request.query.offset, 10)
      : undefined;

    // Validate parsed values
    if (limit !== undefined && (isNaN(limit) || limit < 1)) {
      return await reply.status(400).send({
        error: 'Bad Request',
        message: 'Limit must be a positive number',
      });
    }

    if (offset !== undefined && (isNaN(offset) || offset < 0)) {
      return await reply.status(400).send({
        error: 'Bad Request',
        message: 'Offset must be a non-negative number',
      });
    }

    const viewHistory = await viewHistoryRepository.findRecentWithImages({ limit, offset });
    return await reply.send(viewHistory);
  });

  // Get view statistics for an image
  app.get<{ Params: { id: string } }>('/api/images/:id/view-stats', async (request, reply) => {
    const { id } = request.params;
    const stats = await viewHistoryRepository.getImageStats(id);
    return await reply.send(stats);
  });
}

import type { AppContainer } from '@/infra/di/index.js';
import type { FastifyInstance } from 'fastify';

interface CreateCollectionBody {
  name: string;
  description?: string;
  coverImageId?: string;
}

interface UpdateCollectionBody {
  name?: string;
  description?: string | null;
  coverImageId?: string | null;
}

interface AddImageBody {
  imageId: string;
  order?: number;
}

interface UpdateOrderBody {
  orders: Array<{
    imageId: string;
    order: number;
  }>;
}

export function collectionRoutes(app: FastifyInstance, container: AppContainer): void {
  const collectionRepository = container.getCollectionRepository();

  // List all collections
  app.get('/api/collections', async (_request, reply) => {
    const collections = await collectionRepository.findAll();
    return await reply.send(collections);
  });

  // Create collection
  app.post<{ Body: CreateCollectionBody }>('/api/collections', async (request, reply) => {
    const { name, description, coverImageId } = request.body;

    if (name.trim() === '') {
      return await reply.status(400).send({
        error: 'Bad Request',
        message: 'Collection name is required',
      });
    }

    const collection = await collectionRepository.create({
      name: name.trim(),
      description,
      coverImageId,
    });

    return await reply.status(201).send(collection);
  });

  // Get single collection with images
  app.get<{ Params: { id: string } }>(
    '/api/collections/:id',
    async (request, reply) => {
      const { id } = request.params;
      const collection = await collectionRepository.findByIdWithImages(id);

      if (collection === null) {
        return await reply.status(404).send({
          error: 'Not Found',
          message: 'Collection not found',
        });
      }

      return await reply.send(collection);
    },
  );

  // Update collection
  app.put<{ Params: { id: string }; Body: UpdateCollectionBody }>(
    '/api/collections/:id',
    async (request, reply) => {
      const { id } = request.params;
      const { name, description, coverImageId } = request.body;

      const existing = await collectionRepository.findById(id);
      if (existing === null) {
        return await reply.status(404).send({
          error: 'Not Found',
          message: 'Collection not found',
        });
      }

      if (name?.trim() === '') {
        return await reply.status(400).send({
          error: 'Bad Request',
          message: 'Collection name cannot be empty',
        });
      }

      const collection = await collectionRepository.updateById(id, {
        name: name !== undefined ? name.trim() : undefined,
        description,
        coverImageId,
      });

      return await reply.send(collection);
    },
  );

  // Delete collection
  app.delete<{ Params: { id: string } }>(
    '/api/collections/:id',
    async (request, reply) => {
      const { id } = request.params;
      const collection = await collectionRepository.findById(id);

      if (collection === null) {
        return await reply.status(404).send({
          error: 'Not Found',
          message: 'Collection not found',
        });
      }

      await collectionRepository.deleteById(id);
      return await reply.status(204).send();
    },
  );

  // Add image to collection
  app.post<{ Params: { id: string }; Body: AddImageBody }>(
    '/api/collections/:id/images',
    async (request, reply) => {
      const { id } = request.params;
      const { imageId, order } = request.body;

      const collection = await collectionRepository.findById(id);
      if (collection === null) {
        return await reply.status(404).send({
          error: 'Not Found',
          message: 'Collection not found',
        });
      }

      if (imageId.trim() === '') {
        return await reply.status(400).send({
          error: 'Bad Request',
          message: 'Image ID is required',
        });
      }

      try {
        const collectionImage = await collectionRepository.addImage(id, {
          imageId: imageId.trim(),
          order,
        });
        return await reply.status(201).send(collectionImage);
      }
      catch (error) {
        // Handle duplicate image in collection
        if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
          return await reply.status(409).send({
            error: 'Conflict',
            message: 'Image is already in this collection',
          });
        }
        throw error;
      }
    },
  );

  // Remove image from collection
  app.delete<{ Params: { id: string; imageId: string } }>(
    '/api/collections/:id/images/:imageId',
    async (request, reply) => {
      const { id, imageId } = request.params;

      const collection = await collectionRepository.findById(id);
      if (collection === null) {
        return await reply.status(404).send({
          error: 'Not Found',
          message: 'Collection not found',
        });
      }

      try {
        await collectionRepository.removeImage(id, imageId);
        return await reply.status(204).send();
      }
      catch (error) {
        // Handle image not found in collection
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Image not found in collection',
          });
        }
        throw error;
      }
    },
  );

  // Update image order in collection
  app.put<{ Params: { id: string }; Body: UpdateOrderBody }>(
    '/api/collections/:id/images/order',
    async (request, reply) => {
      const { id } = request.params;
      const { orders } = request.body;

      const collection = await collectionRepository.findById(id);
      if (collection === null) {
        return await reply.status(404).send({
          error: 'Not Found',
          message: 'Collection not found',
        });
      }

      if (!Array.isArray(orders) || orders.length === 0) {
        return await reply.status(400).send({
          error: 'Bad Request',
          message: 'Orders array is required',
        });
      }

      await collectionRepository.updateImageOrder(id, orders);
      return await reply.status(204).send();
    },
  );

  // Get collections for an image
  app.get<{ Params: { imageId: string } }>(
    '/api/images/:imageId/collections',
    async (request, reply) => {
      const { imageId } = request.params;
      const collections = await collectionRepository.findCollectionsByImageId(imageId);
      return await reply.send(collections);
    },
  );
}

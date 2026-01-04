import {
  addAttribute,
  deleteAttribute,
  updateAttribute,
} from '@/application/image-attribute/index.js';
import { findAttributesByImageId } from '@/infra/database/image-attribute-repository.js';
import { findImageById } from '@/infra/database/image-repository.js';
import type { FastifyInstance } from 'fastify';

interface CreateAttributeBody {
  labelId: string;
  keywords?: string;
}

interface UpdateAttributeBody {
  keywords?: string;
}

export function imageAttributeRoutes(app: FastifyInstance): void {
  // Get all attributes for an image
  app.get<{ Params: { imageId: string } }>(
    '/api/images/:imageId/attributes',
    async (request, reply) => {
      const { imageId } = request.params;

      const image = await findImageById(imageId);
      if (image === null) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Image not found',
        });
      }

      const attributes = await findAttributesByImageId(imageId);
      return reply.send(attributes);
    },
  );

  // Add attribute to image
  app.post<{ Params: { imageId: string }; Body: CreateAttributeBody }>(
    '/api/images/:imageId/attributes',
    async (request, reply) => {
      const { imageId } = request.params;
      const { labelId, keywords } = request.body;

      const result = await addAttribute({ imageId, labelId, keywords });

      if (!result.success) {
        switch (result.error) {
          case 'INVALID_LABEL_ID':
            return reply.status(400).send({
              error: 'Bad Request',
              message: 'labelId is required and must be a non-empty string',
            });
          case 'IMAGE_NOT_FOUND':
            return reply.status(404).send({
              error: 'Not Found',
              message: 'Image not found',
            });
          case 'LABEL_NOT_FOUND':
            return reply.status(404).send({
              error: 'Not Found',
              message: 'Label not found',
            });
          case 'ALREADY_EXISTS':
            return reply.status(409).send({
              error: 'Conflict',
              message: 'This label is already assigned to the image',
            });
        }
      }

      return reply.status(201).send(result.attribute);
    },
  );

  // Update attribute (keywords)
  app.put<{
    Params: { imageId: string; attributeId: string };
    Body: UpdateAttributeBody;
  }>(
    '/api/images/:imageId/attributes/:attributeId',
    async (request, reply) => {
      const { imageId, attributeId } = request.params;
      const { keywords } = request.body;

      const result = await updateAttribute({ imageId, attributeId, keywords });

      if (!result.success) {
        switch (result.error) {
          case 'IMAGE_NOT_FOUND':
            return reply.status(404).send({
              error: 'Not Found',
              message: 'Image not found',
            });
          case 'ATTRIBUTE_NOT_FOUND':
            return reply.status(404).send({
              error: 'Not Found',
              message: 'Attribute not found',
            });
          case 'ATTRIBUTE_MISMATCH':
            return reply.status(404).send({
              error: 'Not Found',
              message: 'Attribute does not belong to this image',
            });
        }
      }

      return reply.send(result.attribute);
    },
  );

  // Delete attribute
  app.delete<{ Params: { imageId: string; attributeId: string } }>(
    '/api/images/:imageId/attributes/:attributeId',
    async (request, reply) => {
      const { imageId, attributeId } = request.params;

      const result = await deleteAttribute({ imageId, attributeId });

      if (!result.success) {
        switch (result.error) {
          case 'IMAGE_NOT_FOUND':
            return reply.status(404).send({
              error: 'Not Found',
              message: 'Image not found',
            });
          case 'ATTRIBUTE_NOT_FOUND':
            return reply.status(404).send({
              error: 'Not Found',
              message: 'Attribute not found',
            });
          case 'ATTRIBUTE_MISMATCH':
            return reply.status(404).send({
              error: 'Not Found',
              message: 'Attribute does not belong to this image',
            });
        }
      }

      return reply.status(204).send();
    },
  );
}

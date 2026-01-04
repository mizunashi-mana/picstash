import {
  addAttribute,
  deleteAttribute,
  updateAttribute,
} from '@/application/image-attribute/index.js';
import { container, TYPES } from '@/infra/di/index.js';
import type { ImageAttributeRepository } from '@/application/ports/image-attribute-repository.js';
import type { ImageRepository } from '@/application/ports/image-repository.js';
import type { LabelRepository } from '@/application/ports/label-repository.js';
import type { FastifyInstance } from 'fastify';

interface CreateAttributeBody {
  labelId: string;
  keywords?: string;
}

interface UpdateAttributeBody {
  keywords?: string;
}

export function imageAttributeRoutes(app: FastifyInstance): void {
  const imageRepository = container.get<ImageRepository>(TYPES.ImageRepository);
  const labelRepository = container.get<LabelRepository>(TYPES.LabelRepository);
  const imageAttributeRepository = container.get<ImageAttributeRepository>(
    TYPES.ImageAttributeRepository,
  );

  // Get all attributes for an image
  app.get<{ Params: { imageId: string } }>(
    '/api/images/:imageId/attributes',
    async (request, reply) => {
      const { imageId } = request.params;

      const image = await imageRepository.findById(imageId);
      if (image === null) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Image not found',
        });
      }

      const attributes = await imageAttributeRepository.findByImageId(imageId);
      return reply.send(attributes);
    },
  );

  // Add attribute to image
  app.post<{ Params: { imageId: string }; Body: CreateAttributeBody }>(
    '/api/images/:imageId/attributes',
    async (request, reply) => {
      const { imageId } = request.params;
      const { labelId, keywords } = request.body;

      const result = await addAttribute(
        { imageId, labelId, keywords },
        { imageRepository, labelRepository, imageAttributeRepository },
      );

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
          default: {
            const _exhaustive: never = result;
            return _exhaustive;
          }
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

      const result = await updateAttribute(
        { imageId, attributeId, keywords },
        { imageAttributeRepository },
      );

      if (!result.success) {
        switch (result.error) {
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
          default: {
            const _exhaustive: never = result;
            return _exhaustive;
          }
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

      const result = await deleteAttribute(
        { imageId, attributeId },
        { imageAttributeRepository },
      );

      if (!result.success) {
        switch (result.error) {
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
          default: {
            const _exhaustive: never = result;
            return _exhaustive;
          }
        }
      }

      return reply.status(204).send();
    },
  );
}

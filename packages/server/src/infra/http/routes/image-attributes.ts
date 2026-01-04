import {
  createImageAttribute,
  deleteImageAttributeById,
  findAttributesByImageId,
  findImageAttributeById,
  findImageAttributeByImageAndLabel,
  updateImageAttributeById,
} from '@/infra/database/image-attribute-repository.js';
import { findImageById } from '@/infra/database/image-repository.js';
import { findLabelById } from '@/infra/database/label-repository.js';
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

      // Validate labelId is present and a non-empty string
      if (typeof labelId !== 'string' || labelId.trim().length === 0) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'labelId is required and must be a non-empty string',
        });
      }

      // Validate image exists
      const image = await findImageById(imageId);
      if (image === null) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Image not found',
        });
      }

      // Validate label exists
      const label = await findLabelById(labelId);
      if (label === null) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Label not found',
        });
      }

      // Check if attribute already exists
      const existing = await findImageAttributeByImageAndLabel(imageId, labelId);
      if (existing !== null) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'This label is already assigned to the image',
        });
      }

      // Normalize keywords: trim each keyword and convert empty to undefined
      let normalizedKeywords: string | undefined;
      if (keywords !== undefined) {
        const trimmed = keywords
          .split(',')
          .map(k => k.trim())
          .filter(k => k.length > 0)
          .join(',');
        normalizedKeywords = trimmed.length > 0 ? trimmed : undefined;
      }

      const attribute = await createImageAttribute({
        imageId,
        labelId,
        keywords: normalizedKeywords,
      });

      return reply.status(201).send(attribute);
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

      // Validate image exists
      const image = await findImageById(imageId);
      if (image === null) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Image not found',
        });
      }

      // Validate attribute exists
      const attribute = await findImageAttributeById(attributeId);
      if (attribute === null) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Attribute not found',
        });
      }

      // Validate attribute belongs to this image
      if (attribute.imageId !== imageId) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Attribute does not belong to this image',
        });
      }

      // Normalize keywords: trim each keyword and convert empty to undefined
      let normalizedKeywords: string | undefined;
      if (keywords !== undefined) {
        const trimmed = keywords
          .split(',')
          .map(k => k.trim())
          .filter(k => k.length > 0)
          .join(',');
        normalizedKeywords = trimmed.length > 0 ? trimmed : undefined;
      }

      const updatedAttribute = await updateImageAttributeById(attributeId, {
        keywords: normalizedKeywords,
      });

      return reply.send(updatedAttribute);
    },
  );

  // Delete attribute
  app.delete<{ Params: { imageId: string; attributeId: string } }>(
    '/api/images/:imageId/attributes/:attributeId',
    async (request, reply) => {
      const { imageId, attributeId } = request.params;

      // Validate image exists
      const image = await findImageById(imageId);
      if (image === null) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Image not found',
        });
      }

      // Validate attribute exists
      const attribute = await findImageAttributeById(attributeId);
      if (attribute === null) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Attribute not found',
        });
      }

      // Validate attribute belongs to this image
      if (attribute.imageId !== imageId) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Attribute does not belong to this image',
        });
      }

      await deleteImageAttributeById(attributeId);

      return reply.status(204).send();
    },
  );
}

import {
  createLabel,
  deleteLabelById,
  findAllLabels,
  findLabelById,
  findLabelByName,
  updateLabelById,
} from '@/infra/database/label-repository.js';
import type { FastifyInstance } from 'fastify';

interface CreateLabelBody {
  name: string;
  color?: string;
}

interface UpdateLabelBody {
  name?: string;
  color?: string;
}

export function labelRoutes(app: FastifyInstance): void {
  // List all labels
  app.get('/api/labels', async (_request, reply) => {
    const labels = await findAllLabels();
    return reply.send(labels);
  });

  // Create label
  app.post<{ Body: CreateLabelBody }>('/api/labels', async (request, reply) => {
    const { name, color } = request.body;

    if (name.trim() === '') {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Label name is required',
      });
    }

    const trimmedName = name.trim();

    // Check if label with same name already exists
    const existing = await findLabelByName(trimmedName);
    if (existing) {
      return reply.status(409).send({
        error: 'Conflict',
        message: `Label with name "${trimmedName}" already exists`,
      });
    }

    const label = await createLabel({
      name: trimmedName,
      color,
    });

    return reply.status(201).send(label);
  });

  // Get single label
  app.get<{ Params: { id: string } }>(
    '/api/labels/:id',
    async (request, reply) => {
      const { id } = request.params;

      const label = await findLabelById(id);
      if (!label) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Label not found',
        });
      }

      return reply.send(label);
    },
  );

  // Update label
  app.put<{ Params: { id: string }; Body: UpdateLabelBody }>(
    '/api/labels/:id',
    async (request, reply) => {
      const { id } = request.params;
      const { name, color } = request.body;

      const existingLabel = await findLabelById(id);
      if (!existingLabel) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Label not found',
        });
      }

      // Check if new name conflicts with another label
      if (name != null && name.trim() !== '') {
        const trimmedName = name.trim();
        if (trimmedName !== existingLabel.name) {
          const conflicting = await findLabelByName(trimmedName);
          if (conflicting) {
            return reply.status(409).send({
              error: 'Conflict',
              message: `Label with name "${trimmedName}" already exists`,
            });
          }
        }
      }

      const updatedLabel = await updateLabelById(id, {
        name: name?.trim(),
        color,
      });

      return reply.send(updatedLabel);
    },
  );

  // Delete label
  app.delete<{ Params: { id: string } }>(
    '/api/labels/:id',
    async (request, reply) => {
      const { id } = request.params;

      const label = await findLabelById(id);
      if (!label) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Label not found',
        });
      }

      await deleteLabelById(id);

      return reply.status(204).send();
    },
  );
}

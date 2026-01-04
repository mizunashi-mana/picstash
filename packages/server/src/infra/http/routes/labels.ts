import { createLabel, updateLabel } from '@/application/label/index.js';
import { container, TYPES } from '@/infra/di/index.js';
import type { LabelRepository } from '@/application/ports/label-repository.js';
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
  const labelRepository = container.get<LabelRepository>(TYPES.LabelRepository);

  // List all labels
  app.get('/api/labels', async (_request, reply) => {
    const labels = await labelRepository.findAll();
    return reply.send(labels);
  });

  // Create label
  app.post<{ Body: CreateLabelBody }>('/api/labels', async (request, reply) => {
    const result = await createLabel(request.body, { labelRepository });

    if (!result.success) {
      switch (result.error) {
        case 'EMPTY_NAME':
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Label name is required',
          });
        case 'DUPLICATE_NAME':
          return reply.status(409).send({
            error: 'Conflict',
            message: `Label with name "${result.name}" already exists`,
          });
      }
    }

    return reply.status(201).send(result.label);
  });

  // Get single label
  app.get<{ Params: { id: string } }>(
    '/api/labels/:id',
    async (request, reply) => {
      const { id } = request.params;
      const label = await labelRepository.findById(id);

      if (label == null) {
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
      const result = await updateLabel(id, request.body, { labelRepository });

      if (!result.success) {
        switch (result.error) {
          case 'NOT_FOUND':
            return reply.status(404).send({
              error: 'Not Found',
              message: 'Label not found',
            });
          case 'EMPTY_NAME':
            return reply.status(400).send({
              error: 'Bad Request',
              message: 'Label name cannot be empty',
            });
          case 'DUPLICATE_NAME':
            return reply.status(409).send({
              error: 'Conflict',
              message: `Label with name "${result.name}" already exists`,
            });
        }
      }

      return reply.send(result.label);
    },
  );

  // Delete label
  app.delete<{ Params: { id: string } }>(
    '/api/labels/:id',
    async (request, reply) => {
      const { id } = request.params;
      const label = await labelRepository.findById(id);

      if (label == null) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Label not found',
        });
      }

      await labelRepository.deleteById(id);
      return reply.status(204).send();
    },
  );
}

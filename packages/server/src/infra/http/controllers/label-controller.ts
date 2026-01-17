import { inject, injectable } from 'inversify';
import { createLabel, updateLabel } from '@/application/label/index.js';
import { TYPES } from '@/infra/di/types.js';
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

@injectable()
export class LabelController {
  constructor(
    @inject(TYPES.LabelRepository) private readonly labelRepository: LabelRepository,
  ) {}

  registerRoutes(app: FastifyInstance): void {
    // List all labels
    app.get('/api/labels', async (_request, reply) => {
      const labels = await this.labelRepository.findAll();
      return await reply.send(labels);
    });

    // Create label
    app.post<{ Body: CreateLabelBody }>('/api/labels', async (request, reply) => {
      const result = await createLabel(request.body, { labelRepository: this.labelRepository });

      if (!result.success) {
        switch (result.error) {
          case 'EMPTY_NAME':
            return await reply.status(400).send({
              error: 'Bad Request',
              message: 'Label name is required',
            });
          case 'NAME_TOO_LONG':
            return await reply.status(400).send({
              error: 'Bad Request',
              message: `Label name must be ${result.maxLength} characters or less`,
            });
          case 'DUPLICATE_NAME':
            return await reply.status(409).send({
              error: 'Conflict',
              message: `Label with name "${result.name}" already exists`,
            });
        }
      }

      return await reply.status(201).send(result.label);
    });

    // Get single label
    app.get<{ Params: { id: string } }>(
      '/api/labels/:id',
      async (request, reply) => {
        const { id } = request.params;
        const label = await this.labelRepository.findById(id);

        if (label === null) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Label not found',
          });
        }

        return await reply.send(label);
      },
    );

    // Update label
    app.put<{ Params: { id: string }; Body: UpdateLabelBody }>(
      '/api/labels/:id',
      async (request, reply) => {
        const { id } = request.params;
        const result = await updateLabel(id, request.body, { labelRepository: this.labelRepository });

        if (!result.success) {
          switch (result.error) {
            case 'NOT_FOUND':
              return await reply.status(404).send({
                error: 'Not Found',
                message: 'Label not found',
              });
            case 'EMPTY_NAME':
              return await reply.status(400).send({
                error: 'Bad Request',
                message: 'Label name cannot be empty',
              });
            case 'NAME_TOO_LONG':
              return await reply.status(400).send({
                error: 'Bad Request',
                message: `Label name must be ${result.maxLength} characters or less`,
              });
            case 'DUPLICATE_NAME':
              return await reply.status(409).send({
                error: 'Conflict',
                message: `Label with name "${result.name}" already exists`,
              });
          }
        }

        return await reply.send(result.label);
      },
    );

    // Delete label
    app.delete<{ Params: { id: string } }>(
      '/api/labels/:id',
      async (request, reply) => {
        const { id } = request.params;
        const label = await this.labelRepository.findById(id);

        if (label === null) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Label not found',
          });
        }

        await this.labelRepository.deleteById(id);
        return await reply.status(204).send();
      },
    );
  }
}

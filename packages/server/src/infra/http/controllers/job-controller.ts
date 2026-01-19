import { inject, injectable } from 'inversify';
import { TYPES } from '@/infra/di/types.js';
import type { JobQueue } from '@/application/ports/job-queue.js';
import type { FastifyInstance } from 'fastify';

@injectable()
export class JobController {
  constructor(
    @inject(TYPES.JobQueue) private readonly jobQueue: JobQueue,
  ) {}

  registerRoutes(app: FastifyInstance): void {
    // Get job status
    app.get<{ Params: { id: string } }>(
      '/api/jobs/:id',
      async (request, reply) => {
        const { id } = request.params;

        const job = await this.jobQueue.getJob(id);
        if (job === null) {
          return await reply.status(404).send({
            error: 'Not Found',
            message: 'Job not found',
          });
        }

        return await reply.send({
          id: job.id,
          type: job.type,
          status: job.status,
          progress: job.progress,
          result: job.result,
          error: job.error,
          attempts: job.attempts,
          maxAttempts: job.maxAttempts,
          createdAt: job.createdAt.toISOString(),
          updatedAt: job.updatedAt.toISOString(),
          startedAt: job.startedAt?.toISOString() ?? null,
          completedAt: job.completedAt?.toISOString() ?? null,
        });
      },
    );
  }
}

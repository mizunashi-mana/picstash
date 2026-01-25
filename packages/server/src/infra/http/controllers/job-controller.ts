import { inject, injectable } from 'inversify';
import { TYPES } from '@/infra/di/types.js';
import type { JobQueue, JobStatus } from '@picstash/core';
import type { FastifyInstance } from 'fastify';

@injectable()
export class JobController {
  constructor(
    @inject(TYPES.JobQueue) private readonly jobQueue: JobQueue,
  ) {}

  registerRoutes(app: FastifyInstance): void {
    // List jobs
    app.get<{
      Querystring: {
        status?: string;
        type?: string;
        limit?: string;
        offset?: string;
      };
    }>('/api/jobs', async (request, reply) => {
      const { status, type, limit, offset } = request.query;

      // ステータスのパース（カンマ区切りで複数指定可能）
      const statusFilter = status !== undefined
        ? status.split(',').filter((s): s is JobStatus =>
            ['waiting', 'active', 'completed', 'failed'].includes(s),
          )
        : undefined;

      const result = await this.jobQueue.listJobs({
        status: statusFilter !== undefined && statusFilter.length > 0
          ? statusFilter.length === 1
            ? statusFilter[0]
            : statusFilter
          : undefined,
        type,
        limit: (() => {
          if (limit === undefined) {
            return undefined;
          }

          const parsed = parseInt(limit, 10);
          return Number.isNaN(parsed) || parsed < 0 ? undefined : parsed;
        })(),
        offset: (() => {
          if (offset === undefined) {
            return undefined;
          }

          const parsed = parseInt(offset, 10);
          return Number.isNaN(parsed) || parsed < 0 ? undefined : parsed;
        })(),
      });

      return await reply.send({
        jobs: result.jobs.map(job => ({
          id: job.id,
          type: job.type,
          status: job.status,
          progress: job.progress,
          result: job.result,
          error: job.error,
          payload: job.payload,
          attempts: job.attempts,
          maxAttempts: job.maxAttempts,
          createdAt: job.createdAt.toISOString(),
          updatedAt: job.updatedAt.toISOString(),
          startedAt: job.startedAt?.toISOString() ?? null,
          completedAt: job.completedAt?.toISOString() ?? null,
        })),
        total: result.total,
      });
    });

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

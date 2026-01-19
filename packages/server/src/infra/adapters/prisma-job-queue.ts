import 'reflect-metadata';
import { injectable } from 'inversify';
import { prisma } from '@/infra/database/prisma.js';
import type {
  AddJobOptions,
  Job,
  JobQueue,
  JobStatus,
} from '@/application/ports/job-queue.js';

/**
 * SQLite/Prisma ベースのジョブキュー実装
 * 将来的に Redis (BullMQ) にも切り替え可能
 */
@injectable()
export class PrismaJobQueue implements JobQueue {
  async add<T>(
    type: string,
    payload: T,
    options?: AddJobOptions,
  ): Promise<Job<T>> {
    const job = await prisma.job.create({
      data: {
        type,
        payload: JSON.stringify(payload),
        maxAttempts: options?.maxAttempts ?? 3,
      },
    });

    return this.mapToJob<T>(job);
  }

  async getJob<TPayload = unknown, TResult = unknown>(
    id: string,
  ): Promise<Job<TPayload, TResult> | null> {
    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return null;
    }

    return this.mapToJob<TPayload, TResult>(job);
  }

  async acquireJob<TPayload = unknown>(
    type: string,
  ): Promise<Job<TPayload> | null> {
    // SQLite では SKIP LOCKED がないため、トランザクションで処理
    // 同時実行性は低いが、単一プロセスでの使用を想定
    return await prisma.$transaction(async (tx) => {
      const job = await tx.job.findFirst({
        where: {
          type,
          status: 'waiting',
        },
        orderBy: { createdAt: 'asc' },
      });

      if (!job) {
        return null;
      }

      const updated = await tx.job.update({
        where: { id: job.id },
        data: {
          status: 'active',
          startedAt: new Date(),
          attempts: { increment: 1 },
        },
      });

      return this.mapToJob<TPayload>(updated);
    });
  }

  async completeJob<T>(id: string, result: T): Promise<void> {
    await prisma.job.update({
      where: { id },
      data: {
        status: 'completed',
        result: JSON.stringify(result),
        completedAt: new Date(),
        progress: 100,
      },
    });
  }

  async failJob(id: string, error: string): Promise<boolean> {
    const job = await prisma.job.findUnique({
      where: { id },
      select: { attempts: true, maxAttempts: true },
    });

    if (!job) {
      return false;
    }

    const shouldRetry = job.attempts < job.maxAttempts;

    await prisma.job.update({
      where: { id },
      data: {
        status: shouldRetry ? 'waiting' : 'failed',
        error,
        startedAt: null,
      },
    });

    return shouldRetry;
  }

  async updateProgress(id: string, progress: number): Promise<void> {
    await prisma.job.update({
      where: { id },
      data: { progress: Math.min(100, Math.max(0, progress)) },
    });
  }

  private mapToJob<TPayload = unknown, TResult = unknown>(
    job: {
      id: string;
      type: string;
      status: string;
      payload: string;
      result: string | null;
      error: string | null;
      progress: number;
      attempts: number;
      maxAttempts: number;
      createdAt: Date;
      updatedAt: Date;
      startedAt: Date | null;
      completedAt: Date | null;
    },
  ): Job<TPayload, TResult> {
    const safeParse = <T>(value: string): T | undefined => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON.parse result is cast to expected type
        return JSON.parse(value) as T;
      }
      catch {
        return undefined;
      }
    };

    return {
      id: job.id,
      type: job.type,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- status is validated by database constraint
      status: job.status as JobStatus,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- payload is JSON serialized by add()
      payload: safeParse<TPayload>(job.payload) ?? ({} as unknown as TPayload),
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- result is JSON serialized by completeJob()
      result: job.result ? safeParse<TResult>(job.result) : undefined,
      error: job.error ?? undefined,
      progress: job.progress,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      startedAt: job.startedAt ?? undefined,
      completedAt: job.completedAt ?? undefined,
    };
  }
}

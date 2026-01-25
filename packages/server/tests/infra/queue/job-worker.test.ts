import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JobWorker } from '@/infra/queue/job-worker.js';
import type { Job, JobQueue } from '@/application/ports/job-queue.js';

function createMockJobQueue(): JobQueue {
  return {
    add: vi.fn(),
    acquireJob: vi.fn(),
    completeJob: vi.fn(),
    failJob: vi.fn(),
    updateProgress: vi.fn(),
    getJob: vi.fn(),
    listJobs: vi.fn(),
  };
}

function createMockJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'test-job-id',
    type: 'test-job',
    status: 'active',
    payload: { data: 'test' },
    progress: 0,
    attempts: 1,
    maxAttempts: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('JobWorker', () => {
  let mockJobQueue: JobQueue;
  let worker: JobWorker;

  beforeEach(() => {
    vi.useFakeTimers();
    mockJobQueue = createMockJobQueue();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('start and stop', () => {
    it('should start polling and stop when stop is called', async () => {
      worker = new JobWorker(mockJobQueue, { pollingInterval: 1000 });
      worker.registerHandler('test-job', async () => 'result');

      vi.mocked(mockJobQueue.acquireJob).mockResolvedValue(null);

      worker.start();

      // 最初のポーリングが実行される
      await vi.advanceTimersByTimeAsync(0);
      expect(mockJobQueue.acquireJob).toHaveBeenCalledWith('test-job');

      // stop を呼び出す
      const stopPromise = worker.stop();
      await stopPromise;

      // タイマーを進めてもポーリングが実行されない
      vi.mocked(mockJobQueue.acquireJob).mockClear();
      await vi.advanceTimersByTimeAsync(2000);
      expect(mockJobQueue.acquireJob).not.toHaveBeenCalled();
    });
  });

  describe('graceful shutdown', () => {
    it('should wait for current job to complete on stop', async () => {
      worker = new JobWorker(mockJobQueue, {
        pollingInterval: 1000,
        gracefulShutdownTimeout: 5000,
      });

      let jobCompleted = false;
      const jobCompletionPromise = new Promise<void>((resolve) => {
        worker.registerHandler('test-job', async () => {
          // ジョブが 100ms かかるシミュレーション
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });
          jobCompleted = true;
          resolve();
          return 'result';
        });
      });

      const mockJob = createMockJob();
      vi.mocked(mockJobQueue.acquireJob)
        .mockResolvedValueOnce(mockJob)
        .mockResolvedValue(null);
      vi.mocked(mockJobQueue.completeJob).mockResolvedValue();

      worker.start();

      // ジョブ取得を待つ
      await vi.advanceTimersByTimeAsync(0);

      // ジョブ処理中に stop を呼び出す
      const stopPromise = worker.stop();

      // ジョブが完了するまで待つ
      await vi.advanceTimersByTimeAsync(100);
      await jobCompletionPromise;
      await stopPromise;

      expect(jobCompleted).toBe(true);
      expect(mockJobQueue.completeJob).toHaveBeenCalledWith('test-job-id', 'result');
    });

    it('should not acquire new jobs when shutting down', async () => {
      worker = new JobWorker(mockJobQueue, {
        pollingInterval: 1000,
        gracefulShutdownTimeout: 5000,
      });

      worker.registerHandler('test-job', async () => 'result');

      vi.mocked(mockJobQueue.acquireJob).mockResolvedValue(null);

      worker.start();

      // 最初のポーリング
      await vi.advanceTimersByTimeAsync(0);
      expect(mockJobQueue.acquireJob).toHaveBeenCalledTimes(1);

      // stop を呼び出す
      await worker.stop();

      expect(worker.getIsShuttingDown()).toBe(false); // シャットダウン完了後はリセット

      // stop 後はタイマーを進めても acquireJob が呼ばれない
      vi.mocked(mockJobQueue.acquireJob).mockClear();
      await vi.advanceTimersByTimeAsync(2000);
      expect(mockJobQueue.acquireJob).not.toHaveBeenCalled();
    });

    it('should return timedOut: true when graceful shutdown times out', async () => {
      worker = new JobWorker(mockJobQueue, {
        pollingInterval: 1000,
        gracefulShutdownTimeout: 100, // 100ms タイムアウト
      });

      let jobStarted = false;
      worker.registerHandler('test-job', async () => {
        jobStarted = true;
        // ジョブがタイムアウトより長くかかる
        await new Promise((resolve) => {
          setTimeout(resolve, 500);
        });
        return 'result';
      });

      const mockJob = createMockJob();
      vi.mocked(mockJobQueue.acquireJob)
        .mockResolvedValueOnce(mockJob)
        .mockResolvedValue(null);
      vi.mocked(mockJobQueue.completeJob).mockResolvedValue();

      worker.start();

      // ジョブ取得を待つ
      await vi.advanceTimersByTimeAsync(0);

      // ジョブが開始されるまで少し待つ
      await vi.advanceTimersByTimeAsync(10);
      expect(jobStarted).toBe(true);

      // stop を呼び出す
      const stopPromise = worker.stop();

      // タイムアウトまで進める
      await vi.advanceTimersByTimeAsync(100);

      // stop はタイムアウト後に完了し、timedOut: true を返す
      const result = await stopPromise;
      expect(result.timedOut).toBe(true);

      // ワーカーは停止している
      expect(worker.getIsShuttingDown()).toBe(false);
    });

    it('should return timedOut: false when job completes before timeout', async () => {
      worker = new JobWorker(mockJobQueue, {
        pollingInterval: 1000,
        gracefulShutdownTimeout: 5000,
      });

      worker.registerHandler('test-job', async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 50);
        });
        return 'result';
      });

      const mockJob = createMockJob();
      vi.mocked(mockJobQueue.acquireJob)
        .mockResolvedValueOnce(mockJob)
        .mockResolvedValue(null);
      vi.mocked(mockJobQueue.completeJob).mockResolvedValue();

      worker.start();
      await vi.advanceTimersByTimeAsync(0);

      const stopPromise = worker.stop();
      await vi.advanceTimersByTimeAsync(50);

      const result = await stopPromise;
      expect(result.timedOut).toBe(false);
    });

    it('should return immediately if worker is not running', async () => {
      worker = new JobWorker(mockJobQueue);

      // start を呼ばずに stop を呼ぶ
      await worker.stop();

      // エラーなく完了する
      expect(true).toBe(true);
    });
  });

  describe('getIsShuttingDown', () => {
    it('should return false when not shutting down', () => {
      worker = new JobWorker(mockJobQueue);
      expect(worker.getIsShuttingDown()).toBe(false);
    });
  });

  describe('job processing', () => {
    it('should process jobs and call completeJob on success', async () => {
      worker = new JobWorker(mockJobQueue, { pollingInterval: 1000 });
      worker.registerHandler('test-job', async () => 'success-result');

      const mockJob = createMockJob();
      vi.mocked(mockJobQueue.acquireJob)
        .mockResolvedValueOnce(mockJob)
        .mockResolvedValue(null);
      vi.mocked(mockJobQueue.completeJob).mockResolvedValue();

      worker.start();
      await vi.advanceTimersByTimeAsync(0);

      // ジョブ処理完了を待つ
      await vi.advanceTimersByTimeAsync(0);

      expect(mockJobQueue.completeJob).toHaveBeenCalledWith('test-job-id', 'success-result');

      await worker.stop();
    });

    it('should call failJob when handler throws error', async () => {
      worker = new JobWorker(mockJobQueue, { pollingInterval: 1000 });
      worker.registerHandler('test-job', async () => {
        throw new Error('Handler error');
      });

      const mockJob = createMockJob();
      vi.mocked(mockJobQueue.acquireJob)
        .mockResolvedValueOnce(mockJob)
        .mockResolvedValue(null);
      vi.mocked(mockJobQueue.failJob).mockResolvedValue(false);

      worker.start();
      await vi.advanceTimersByTimeAsync(0);

      // ジョブ処理完了を待つ
      await vi.advanceTimersByTimeAsync(0);

      expect(mockJobQueue.failJob).toHaveBeenCalledWith('test-job-id', 'Handler error');

      await worker.stop();
    });

    it('should update progress when handler calls updateProgress', async () => {
      worker = new JobWorker(mockJobQueue, { pollingInterval: 1000 });
      worker.registerHandler('test-job', async (_job, updateProgress) => {
        await updateProgress(50);
        return 'result';
      });

      const mockJob = createMockJob();
      vi.mocked(mockJobQueue.acquireJob)
        .mockResolvedValueOnce(mockJob)
        .mockResolvedValue(null);
      vi.mocked(mockJobQueue.completeJob).mockResolvedValue();
      vi.mocked(mockJobQueue.updateProgress).mockResolvedValue();

      worker.start();
      await vi.advanceTimersByTimeAsync(0);

      // ジョブ処理完了を待つ
      await vi.advanceTimersByTimeAsync(0);

      expect(mockJobQueue.updateProgress).toHaveBeenCalledWith('test-job-id', 50);

      await worker.stop();
    });

    it('should timeout job if it takes too long', async () => {
      worker = new JobWorker(mockJobQueue, {
        pollingInterval: 1000,
        jobTimeout: 100, // 100ms タイムアウト
      });

      worker.registerHandler('test-job', async () => {
        // ジョブがタイムアウトより長くかかる
        await new Promise((resolve) => {
          setTimeout(resolve, 500);
        });
        return 'result';
      });

      const mockJob = createMockJob();
      vi.mocked(mockJobQueue.acquireJob)
        .mockResolvedValueOnce(mockJob)
        .mockResolvedValue(null);
      vi.mocked(mockJobQueue.failJob).mockResolvedValue(false);

      worker.start();
      await vi.advanceTimersByTimeAsync(0);

      // タイムアウトまで進める
      await vi.advanceTimersByTimeAsync(100);

      expect(mockJobQueue.failJob).toHaveBeenCalledWith(
        'test-job-id',
        'Job test-job-id timed out after 100ms',
      );

      await worker.stop();
    });
  });
});

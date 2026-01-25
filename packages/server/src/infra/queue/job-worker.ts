import type { Job, JobQueue } from '@/application/ports/job-queue.js';

/** ジョブハンドラーの型定義 */
export type JobHandler<TPayload, TResult> = (
  job: Job<TPayload>,
  updateProgress: (progress: number) => Promise<void>,
) => Promise<TResult>;

/** ワーカー設定 */
export interface JobWorkerConfig {
  /** ポーリング間隔（ミリ秒） */
  pollingInterval?: number;
  /** ジョブ処理のタイムアウト（ミリ秒） */
  jobTimeout?: number;
  /** グレースフルシャットダウンのタイムアウト（ミリ秒） */
  gracefulShutdownTimeout?: number;
}

const DEFAULT_POLLING_INTERVAL = 3000;
const DEFAULT_JOB_TIMEOUT = 300000; // 5 minutes
const DEFAULT_GRACEFUL_SHUTDOWN_TIMEOUT = 30000; // 30 seconds

/** stop() の戻り値 */
export interface StopResult {
  /** タイムアウトしたかどうか */
  timedOut: boolean;
}

/**
 * ジョブワーカー基盤クラス
 * ジョブキューからジョブを取得し、登録されたハンドラーで処理する
 */
export class JobWorker {
  private readonly handlers = new Map<string, JobHandler<unknown, unknown>>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private isProcessing = false;
  private isShuttingDown = false;
  private currentPollPromise: Promise<void> | null = null;
  private readonly pollingInterval: number;
  private readonly jobTimeout: number;
  private readonly gracefulShutdownTimeout: number;

  constructor(
    private readonly jobQueue: JobQueue,
    config?: JobWorkerConfig,
  ) {
    this.pollingInterval = config?.pollingInterval ?? DEFAULT_POLLING_INTERVAL;
    this.jobTimeout = config?.jobTimeout ?? DEFAULT_JOB_TIMEOUT;
    this.gracefulShutdownTimeout = config?.gracefulShutdownTimeout ?? DEFAULT_GRACEFUL_SHUTDOWN_TIMEOUT;
  }

  /**
   * ジョブハンドラーを登録
   */
  registerHandler<TPayload, TResult>(
    type: string,
    handler: JobHandler<TPayload, TResult>,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Handler types are checked at registration time
    this.handlers.set(type, handler as JobHandler<unknown, unknown>);
  }

  /**
   * ワーカーを開始
   */
  start(): void {
    if (this.timer !== null) {
      return;
    }

    // eslint-disable-next-line no-console -- Worker status logging
    console.log('[JobWorker] Starting worker...');

    // 即座に最初のポーリングを実行
    void this.poll();

    // 定期的にポーリング
    this.timer = setInterval(() => {
      void this.poll();
    }, this.pollingInterval);
  }

  /**
   * ワーカーを停止（グレースフルシャットダウン）
   * 実行中のジョブが完了するまで待機し、タイムアウト後は呼び出し元に通知
   * @returns タイムアウトしたかどうかを含む結果
   */
  async stop(): Promise<StopResult> {
    if (this.timer === null && !this.isProcessing) {
      return { timedOut: false };
    }

    // eslint-disable-next-line no-console -- Worker status logging
    console.log('[JobWorker] Initiating graceful shutdown...');
    this.isShuttingDown = true;

    // ポーリングタイマーを停止
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }

    let timedOut = false;

    try {
      // 実行中の poll がある場合は完了を待機
      if (this.currentPollPromise !== null) {
        // eslint-disable-next-line no-console -- Worker status logging
        console.log('[JobWorker] Waiting for current job to complete...');

        const { promise: timeoutPromise, clear: clearTimeoutTimer } = this.createShutdownTimeout();

        const result = await Promise.race([
          this.currentPollPromise.then(() => 'completed' as const).catch(() => 'completed' as const),
          timeoutPromise,
        ]);

        // タイマーをクリア（イベントループを保持しないように）
        clearTimeoutTimer();

        if (result === 'timeout') {
          timedOut = true;
          // eslint-disable-next-line no-console -- Worker status logging
          console.log(`[JobWorker] Graceful shutdown timed out after ${this.gracefulShutdownTimeout}ms`);
        }
        else {
          // eslint-disable-next-line no-console -- Worker status logging
          console.log('[JobWorker] Current job completed successfully');
        }
      }
    }
    finally {
      this.isShuttingDown = false;
      // eslint-disable-next-line no-console -- Worker status logging
      console.log('[JobWorker] Stopped worker');
    }

    return { timedOut };
  }

  /**
   * 登録済みのジョブタイプを取得
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * シャットダウン中かどうかを取得
   */
  getIsShuttingDown(): boolean {
    return this.isShuttingDown;
  }

  private async poll(): Promise<void> {
    // シャットダウン中または既に処理中の場合はスキップ
    if (this.isShuttingDown || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    // poll 全体を追跡（stop() で待機できるように）
    const pollPromise = this.doPoll();
    this.currentPollPromise = pollPromise;

    try {
      await pollPromise;
    }
    finally {
      this.currentPollPromise = null;
      this.isProcessing = false;
    }
  }

  private async doPoll(): Promise<void> {
    // 登録されている各ジョブタイプに対してポーリング
    for (const type of this.handlers.keys()) {
      // シャットダウン中は新規ジョブを取得しない
      // (stop() が async 処理中に呼ばれる可能性があるため再チェック)

      if (this.isShuttingDown) {
        break;
      }

      const job = await this.jobQueue.acquireJob(type);
      if (job !== null) {
        // acquireJob 待ちの間にシャットダウンが開始された場合は、このジョブは処理しない
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- flag can change during async operations
        if (this.isShuttingDown) {
          break;
        }

        await this.processJob(job);
      }
    }
  }

  private createShutdownTimeout(): { promise: Promise<'timeout'>; clear: () => void } {
    let timeoutId: ReturnType<typeof setTimeout>;
    const promise = new Promise<'timeout'>((resolve) => {
      timeoutId = setTimeout(() => {
        resolve('timeout');
      }, this.gracefulShutdownTimeout);
    });
    return {
      promise,
      clear: () => {
        clearTimeout(timeoutId);
      },
    };
  }

  private async processJob(job: Job<unknown>): Promise<void> {
    const handler = this.handlers.get(job.type);
    if (handler === undefined) {
      // eslint-disable-next-line no-console -- Worker error logging
      console.error(`[JobWorker] No handler for job type: ${job.type}`);
      await this.jobQueue.failJob(job.id, `No handler for job type: ${job.type}`);
      return;
    }

    // eslint-disable-next-line no-console -- Worker status logging
    console.log(`[JobWorker] Processing job ${job.id} (type: ${job.type}, attempt: ${job.attempts}/${job.maxAttempts})`);

    const startTime = Date.now();

    try {
      // タイムアウト付きでジョブを実行
      const result = await Promise.race([
        handler(job, async (progress) => { await this.jobQueue.updateProgress(job.id, progress); }),
        this.createTimeout(job.id),
      ]);

      const elapsed = Date.now() - startTime;
      // eslint-disable-next-line no-console -- Worker status logging
      console.log(`[JobWorker] Job ${job.id} completed in ${elapsed}ms`);

      await this.jobQueue.completeJob(job.id, result);
    }
    catch (error) {
      const elapsed = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // eslint-disable-next-line no-console -- Worker error logging
      console.error(`[JobWorker] Job ${job.id} failed after ${elapsed}ms:`, errorMessage);

      const willRetry = await this.jobQueue.failJob(job.id, errorMessage);
      if (willRetry) {
        // eslint-disable-next-line no-console -- Worker status logging
        console.log(`[JobWorker] Job ${job.id} will be retried`);
      }
    }
  }

  private async createTimeout(jobId: string): Promise<never> {
    return await new Promise((_resolve, reject) => {
      setTimeout(() => {
        reject(new Error(`Job ${jobId} timed out after ${this.jobTimeout}ms`));
      }, this.jobTimeout);
    });
  }
}

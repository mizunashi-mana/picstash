// @picstash/server
// API サーバーのエントリポイント

import { buildApp } from '@/app.js';
import { initConfig, parseConfigArg } from '@/config.js';
import { connectDatabase, disconnectDatabase } from '@/infra/database/index.js';
import { buildAppContainer } from '@/infra/di/index.js';
import { JobWorker } from '@/infra/queue/index.js';
import {
  createCaptionJobHandler,
  CAPTION_JOB_TYPE,
  createArchiveImportJobHandler,
  ARCHIVE_IMPORT_JOB_TYPE,
} from '@/infra/workers/index.js';

async function main(): Promise<void> {
  // Parse --config argument and initialize configuration
  const configPath = parseConfigArg(process.argv);
  const config = initConfig(configPath);

  const container = buildAppContainer(config);
  const app = await buildApp(container, config);

  // Connect to database
  await connectDatabase();
  app.log.info('Database connected');

  // Start job worker
  // archive-import は大量画像で時間がかかるため、タイムアウトを15分に設定
  const jobWorker = new JobWorker(container.getJobQueue(), {
    jobTimeout: 900000, // 15 minutes
  });

  // Register caption generation job handler
  const ocrService = container.getOcrService();
  const captionHandler = createCaptionJobHandler({
    imageRepository: container.getImageRepository(),
    fileStorage: container.getFileStorage(),
    captionService: container.getCaptionService(),
    embeddingRepository: container.getEmbeddingRepository(),
    ocrService,
  });
  jobWorker.registerHandler(CAPTION_JOB_TYPE, captionHandler);

  // Register archive import job handler
  const archiveImportHandler = createArchiveImportJobHandler({
    archiveSessionManager: container.getArchiveSessionManager(),
    imageRepository: container.getImageRepository(),
    fileStorage: container.getFileStorage(),
    imageProcessor: container.getImageProcessor(),
  });
  jobWorker.registerHandler(ARCHIVE_IMPORT_JOB_TYPE, archiveImportHandler);

  jobWorker.start();
  app.log.info('Job worker started');

  // Graceful shutdown
  let isShuttingDown = false;
  const shutdown = async (): Promise<void> => {
    // 重複シャットダウンを防止
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;

    app.log.info('Shutting down...');

    // ジョブワーカーの graceful shutdown を待機
    try {
      const result = await jobWorker.stop();
      if (result.timedOut) {
        app.log.warn('Job worker shutdown timed out, some jobs may still be running');
      }
      else {
        app.log.info('Job worker stopped');
      }
    }
    catch (err: unknown) {
      app.log.error({ err }, 'Job worker stop error');
    }

    // OCR ワーカーを終了
    try {
      await ocrService.terminate();
    }
    catch (err: unknown) {
      app.log.error({ err }, 'OCR terminate error');
    }

    // HTTP サーバーを閉じる
    try {
      await app.close();
      app.log.info('HTTP server closed');
    }
    catch (err: unknown) {
      app.log.error({ err }, 'HTTP server close error');
    }

    // データベース接続を閉じる
    try {
      await disconnectDatabase();
      app.log.info('Database disconnected');
    }
    catch (err: unknown) {
      app.log.error({ err }, 'Database disconnect error');
    }
  };

  process.on('SIGINT', () => {
    void shutdown();
  });
  process.on('SIGTERM', () => {
    void shutdown();
  });

  // Start server
  await app.listen({
    port: config.server.port,
    host: config.server.host,
  });
  app.log.info(`Server listening on http://${config.server.host}:${config.server.port}`);
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console -- app not yet initialized
  console.error('Failed to start server:', err);
});

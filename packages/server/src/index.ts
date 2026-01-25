// @picstash/server
// API サーバーのエントリポイント

import { buildApp } from '@/app.js';
import { initConfig, parseConfigArg } from '@/config.js';
import { connectDatabase, disconnectDatabase } from '@/infra/database/prisma.js';
import { buildAppContainer } from '@/infra/di/index.js';
import { JobWorker } from '@/infra/queue/index.js';
import { createCaptionJobHandler, CAPTION_JOB_TYPE } from '@/infra/workers/index.js';

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
  const jobWorker = new JobWorker(container.getJobQueue());

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

    try {
      // ジョブワーカーの graceful shutdown を待機
      await jobWorker.stop();
      app.log.info('Job worker stopped');

      // OCR ワーカーを終了（失敗してもシャットダウンをブロックしない）
      await ocrService.terminate().catch((err: unknown) => {
        app.log.error({ err }, 'OCR terminate error');
      });

      // HTTP サーバーを閉じる
      await app.close();
      app.log.info('HTTP server closed');

      // データベース接続を閉じる
      await disconnectDatabase();
      app.log.info('Database disconnected');
    }
    catch (err: unknown) {
      app.log.error({ err }, 'Error during shutdown');
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

// @picstash/server
// API サーバーのエントリポイント

import { buildApp } from '@/app.js';
import { getConfig, initConfig, parseConfigArg } from '@/config.js';
import { connectDatabase, disconnectDatabase } from '@/infra/database/prisma.js';
import { buildAppContainer } from '@/infra/di/index.js';
import { JobWorker } from '@/infra/queue/index.js';
import { createCaptionJobHandler, CAPTION_JOB_TYPE } from '@/infra/workers/index.js';

async function main(): Promise<void> {
  // Parse --config argument and initialize configuration
  const configPath = parseConfigArg(process.argv);
  initConfig(configPath);
  const config = getConfig();

  const container = buildAppContainer();
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
  const shutdown = () => {
    app.log.info('Shutting down...');
    jobWorker.stop();
    // Terminate OCR worker (don't block shutdown on failure)
    ocrService.terminate().catch((err: unknown) => {
      app.log.error({ err }, 'OCR terminate error');
    });
    app.close()
      .then(async () => { await disconnectDatabase(); })
      .catch((err: unknown) => { app.log.error(err); });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

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

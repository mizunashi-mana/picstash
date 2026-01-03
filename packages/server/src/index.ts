// @picstash/server
// API サーバーのエントリポイント

import { buildApp } from '@/app.js';
import { config } from '@/config.js';
import { connectDatabase, disconnectDatabase } from '@/infra/database/prisma.js';

async function main(): Promise<void> {
  const app = await buildApp();

  // Connect to database
  await connectDatabase();
  app.log.info('Database connected');

  // Graceful shutdown
  const shutdown = () => {
    app.log.info('Shutting down...');
    app.close()
      .then(async () => disconnectDatabase())
      .catch((err: unknown) => app.log.error(err));
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

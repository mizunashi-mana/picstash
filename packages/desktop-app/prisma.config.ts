import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'prisma/config';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Prisma configuration for @picstash/desktop-app package.
 *
 * datasource.url is required for CLI commands like db:push, db:migrate.
 * At runtime, the connection is handled by Driver Adapter pattern.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: `file:${path.join(currentDir, 'prisma', 'data', 'picstash.db')}`,
  },
});

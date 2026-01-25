import { defineConfig } from 'prisma/config';

/**
 * Prisma configuration for @picstash/core package.
 * This config is for `prisma generate` only.
 * For migrations/push, use the server package's prisma.config.ts.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
});

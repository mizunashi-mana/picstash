import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'prisma/config';

const currentDir = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(currentDir, 'prisma/data/picstash.db');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: `file:${dbPath}`,
  },
});

import { defineConfig } from 'prisma/config';
import { initConfig } from './src/config.js';

const config = initConfig();

export default defineConfig({
  // Use schema and migrations from core package
  schema: '../core/prisma/schema.prisma',
  migrations: {
    path: '../core/prisma/migrations',
  },
  datasource: {
    url: `file:${config.database.path}`,
  },
});

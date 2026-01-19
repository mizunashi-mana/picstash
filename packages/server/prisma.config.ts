import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { defineConfig } from 'prisma/config';

const currentDir = dirname(fileURLToPath(import.meta.url));

/**
 * Get database URL from config file or use default.
 * Config path resolution priority:
 * 1. Environment variable PICSTASH_CONFIG
 * 2. Default path (packages/server/config.yaml)
 * 3. Hardcoded default
 */
function getDatabaseUrl(): string {
  const configPath = process.env.PICSTASH_CONFIG ?? resolve(currentDir, 'config.yaml');

  if (existsSync(configPath)) {
    try {
      const configFile = readFileSync(configPath, 'utf8');
      const config: unknown = yaml.load(configFile);
      if (
        typeof config === 'object'
        && config !== null
        && 'database' in config
        && typeof config.database === 'object'
        && config.database !== null
        && 'url' in config.database
        && typeof config.database.url === 'string'
        && config.database.url !== ''
      ) {
        return config.database.url;
      }
    }
    catch {
      // Fall through to default
    }
  }

  // Default fallback
  const dbPath = resolve(currentDir, 'prisma/data/picstash.db');
  return `file:${dbPath}`;
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: getDatabaseUrl(),
  },
});

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
 * 2. Default path (packages/server/config.yaml for development)
 * 3. Hardcoded default
 */
function getDatabaseUrl(): string {
  // Try config path from environment
  const envConfigPath = process.env.PICSTASH_CONFIG;
  if (envConfigPath && existsSync(envConfigPath)) {
    const url = readDatabaseUrlFromConfig(envConfigPath);
    if (url) return url;
  }

  // Try default server config path (for development)
  const serverConfigPath = resolve(currentDir, '../server/config.yaml');
  if (existsSync(serverConfigPath)) {
    const url = readDatabaseUrlFromConfig(serverConfigPath);
    if (url) return url;
  }

  // Default fallback
  const dbPath = resolve(currentDir, 'prisma/data/picstash.db');
  return `file:${dbPath}`;
}

function readDatabaseUrlFromConfig(configPath: string): string | undefined {
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
    // Fall through
  }
  return undefined;
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

import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import yaml from 'js-yaml';
import { defineConfig } from 'prisma/config';

/**
 * Get database URL from config file.
 * Config path resolution priority:
 * 1. Environment variable PICSTASH_CONFIG
 * 2. Default path (config.yaml in cwd)
 */
function getDatabaseUrl(): string {
  // Try config path from environment
  const envConfigPath = process.env.PICSTASH_CONFIG;
  if (envConfigPath !== undefined && envConfigPath !== '' && existsSync(envConfigPath)) {
    const path = readDatabasePathFromConfig(envConfigPath);
    if (path !== undefined) return pathToUrl(path);
  }

  // Try default config.yaml in cwd
  const defaultConfigPath = resolve(process.cwd(), 'config.yaml');
  if (existsSync(defaultConfigPath)) {
    const path = readDatabasePathFromConfig(defaultConfigPath);
    if (path !== undefined) return pathToUrl(path);
  }

  // Default fallback
  const dbPath = resolve(process.cwd(), 'data/picstash.db');
  return `file:${dbPath}`;
}

/**
 * Convert a path to a SQLite URL.
 * If path is relative, resolve it against cwd.
 */
function pathToUrl(path: string): string {
  const absolutePath = isAbsolute(path)
    ? path
    : resolve(process.cwd(), path);
  return `file:${absolutePath}`;
}

function readDatabasePathFromConfig(configPath: string): string | undefined {
  try {
    const configFile = readFileSync(configPath, 'utf8');
    const config: unknown = yaml.load(configFile);
    if (
      typeof config === 'object'
      && config !== null
      && 'database' in config
      && typeof config.database === 'object'
      && config.database !== null
      && 'path' in config.database
      && typeof config.database.path === 'string'
      && config.database.path !== ''
    ) {
      return config.database.path;
    }
  }
  catch {
    // Fall through
  }
  return undefined;
}

export default defineConfig({
  // Use schema and migrations from core package
  schema: '../core/prisma/schema.prisma',
  migrations: {
    path: '../core/prisma/migrations',
  },
  datasource: {
    url: getDatabaseUrl(),
  },
});

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { coreConfigSchema } from '@picstash/core';
import yaml from 'js-yaml';
import { z } from 'zod';

// Re-export utilities from core
export { parseConfigArg, parseCliArgs } from '@picstash/core';

const currentDir = dirname(fileURLToPath(import.meta.url));
const defaultConfigPath = resolve(currentDir, '../config.yaml');

/**
 * Server-specific configuration schema.
 * Extends CoreConfig with HTTP server settings.
 */
const serverConfigSchema = z.object({
  server: z.object({
    port: z.number().int().positive().default(4000),
    host: z.string().default('0.0.0.0'),
  }),
});

/**
 * Full configuration schema for the server.
 * Combines core config with server-specific settings.
 */
const configSchema = coreConfigSchema.extend(serverConfigSchema.shape);

export type Config = z.infer<typeof configSchema>;

/**
 * Load configuration from a YAML file.
 * @param configPath - Path to the config file. If not provided, uses default path.
 */
export function loadConfig(configPath?: string): Config {
  const path = configPath ?? defaultConfigPath;
  const configFile = readFileSync(path, 'utf8');
  const rawConfig = yaml.load(configFile);
  return configSchema.parse(rawConfig);
}

/**
 * Initialize configuration with optional path.
 * Config path resolution priority:
 * 1. Provided configPath argument
 * 2. Environment variable PICSTASH_CONFIG
 * 3. Default path (packages/server/config.yaml)
 */
export function initConfig(configPath?: string): Config {
  const path = configPath ?? process.env.PICSTASH_CONFIG ?? undefined;
  return loadConfig(path);
}

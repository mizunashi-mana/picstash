import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { z } from 'zod';

const currentDir = dirname(fileURLToPath(import.meta.url));
const defaultConfigPath = resolve(currentDir, '../config.yaml');

const configSchema = z.object({
  server: z.object({
    port: z.number().int().positive().default(3000),
    host: z.string().default('0.0.0.0'),
  }),
  database: z.object({
    url: z.string().min(1, 'Database URL is required'),
  }),
  storage: z.object({
    path: z.string().min(1, 'Storage path is required'),
  }),
});

export type Config = z.infer<typeof configSchema>;

let loadedConfig: Config | null = null;

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
  loadedConfig = loadConfig(path);
  return loadedConfig;
}

/**
 * Get the current configuration.
 * If not initialized, loads from default path or PICSTASH_CONFIG env var.
 */
export function getConfig(): Config {
  loadedConfig ??= loadConfig(process.env.PICSTASH_CONFIG ?? undefined);
  return loadedConfig;
}

/**
 * Parse command line arguments for --config option.
 * Supports both --config=path and --config path formats.
 */
export function parseConfigArg(args: string[]): string | undefined {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === undefined) continue;

    // --config=path format
    if (arg.startsWith('--config=')) {
      return arg.slice('--config='.length);
    }

    // --config path format
    if (arg === '--config' && i + 1 < args.length) {
      return args[i + 1];
    }
  }
  return undefined;
}

/**
 * Parse CLI arguments, extracting command and config path.
 * Filters out --config option from args to get the command.
 * @param args - process.argv
 * @param defaultCommand - Default command if none specified (default: 'generate')
 */
export function parseCliArgs(
  args: string[],
  defaultCommand = 'generate',
): { command: string; configPath: string | undefined } {
  const configPath = parseConfigArg(args);
  // Filter out --config and its value from args to get the command
  const filteredArgs = args.slice(2).filter((arg, i, arr) => {
    if (arg === '--config') return false;
    if (i > 0 && arr[i - 1] === '--config') return false;
    if (arg.startsWith('--config=')) return false;
    return true;
  });
  const command = filteredArgs[0] ?? defaultCommand;
  return { command, configPath };
}

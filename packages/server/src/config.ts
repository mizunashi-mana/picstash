import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import yaml from 'js-yaml';
import { z } from 'zod';
import type { CoreConfig } from '@picstash/core';

// =============================================================================
// Zod Schemas
// =============================================================================

const rotationSchema = z
  .object({
    enabled: z.boolean().optional(),
    maxSize: z
      .string()
      .regex(/^\d+[KMGkmg]?$/, 'Invalid size format. Use format like "10M", "1G", or "1024"')
      .optional(),
    maxFiles: z.number().int().positive().optional(),
  })
  .optional()
  .transform(val => ({
    enabled: val?.enabled ?? true,
    maxSize: val?.maxSize ?? '10M',
    maxFiles: val?.maxFiles ?? 5,
  }));

const fileSchema = z
  .object({
    enabled: z.boolean().optional(),
    path: z.string().optional(),
    rotation: rotationSchema,
  })
  .optional()
  .transform(val => ({
    enabled: val?.enabled ?? false,
    path: val?.path ?? './logs/server.log',
    rotation: val?.rotation ?? { enabled: true, maxSize: '10M', maxFiles: 5 },
  }));

const loggingSchema = z
  .object({
    level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
    format: z.enum(['pretty', 'json']).optional(),
    file: fileSchema,
  })
  .optional()
  .transform(val => ({
    level: val?.level ?? 'info',
    format: val?.format ?? 'pretty',
    file: val?.file ?? {
      enabled: false,
      path: './logs/server.log',
      rotation: { enabled: true, maxSize: '10M', maxFiles: 5 },
    },
  }));

/**
 * Raw configuration schema (before path resolution).
 * Paths can be relative or absolute.
 */
const rawConfigSchema = z.object({
  server: z.object({
    port: z.number().int().positive().default(4000),
    host: z.string().default('0.0.0.0'),
  }).optional().transform(val => ({
    port: val?.port ?? 4000,
    host: val?.host ?? '0.0.0.0',
  })),
  database: z.object({
    path: z.string().optional(),
  }).optional().transform(val => ({
    path: val?.path ?? './data/picstash.db',
  })),
  storage: z.object({
    path: z.string().optional(),
  }).optional().transform(val => ({
    path: val?.path ?? './data/storage',
  })),
  logging: loggingSchema,
  ollama: z.object({
    url: z.string().default('http://localhost:11434'),
    model: z.string().default('llama3.2'),
  }).optional(),
});

type RawConfig = z.infer<typeof rawConfigSchema>;

/**
 * Server configuration including HTTP server settings.
 */
export interface Config extends CoreConfig {
  server: {
    port: number;
    host: string;
  };
}

// =============================================================================
// Path Resolution
// =============================================================================

/**
 * Resolve a path to an absolute path.
 * If the path is relative, it is resolved against cwd.
 * @param path - Path to resolve (relative or absolute)
 * @returns Absolute path
 */
function resolvePath(path: string): string {
  if (isAbsolute(path)) {
    return path;
  }
  return resolve(process.cwd(), path);
}

/**
 * Ensure the parent directory exists for the given file path.
 */
function ensureParentDirectory(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Transform raw config (with potentially relative paths) to resolved config (with absolute paths).
 */
function resolveConfig(raw: RawConfig): Config {
  const databasePath = resolvePath(raw.database.path);
  const storagePath = resolvePath(raw.storage.path);
  const logFilePath = resolvePath(raw.logging.file.path);

  // Ensure database directory exists
  ensureParentDirectory(databasePath);

  return {
    server: raw.server,
    database: {
      path: databasePath,
    },
    storage: {
      path: storagePath,
    },
    logging: {
      level: raw.logging.level,
      format: raw.logging.format,
      file: {
        enabled: raw.logging.file.enabled,
        path: logFilePath,
        rotation: raw.logging.file.rotation,
      },
    },
    ollama: raw.ollama,
  };
}

// =============================================================================
// Configuration Loading
// =============================================================================

/**
 * Load configuration from a YAML file.
 * @param configPath - Path to the config file. If not provided, tries to load from default locations.
 */
export function loadConfig(configPath?: string): Config {
  let rawConfig: unknown;

  // Determine the config file path
  let resolvedConfigPath = configPath;
  if (resolvedConfigPath === undefined) {
    // Try default config file at cwd/config.yaml
    const defaultPath = resolve(process.cwd(), 'config.yaml');
    if (existsSync(defaultPath)) {
      resolvedConfigPath = defaultPath;
    }
  }

  if (resolvedConfigPath !== undefined) {
    const configFile = readFileSync(resolvedConfigPath, 'utf8');
    rawConfig = yaml.load(configFile);
  }
  else {
    // Use default values (no config file found)
    rawConfig = {};
  }

  const parsed = rawConfigSchema.parse(rawConfig);
  return resolveConfig(parsed);
}

/**
 * Initialize configuration with optional path.
 * Config path resolution priority:
 * 1. Provided configPath argument
 * 2. Environment variable PICSTASH_CONFIG
 * 3. Default values (paths relative to cwd)
 */
export function initConfig(configPath?: string): Config {
  const path = configPath ?? process.env.PICSTASH_CONFIG ?? undefined;
  return loadConfig(path);
}

// =============================================================================
// CLI Argument Parsing
// =============================================================================

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

import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { z } from 'zod';

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
 * Core configuration schema - contains settings needed by @picstash/core.
 * Server-specific settings (port, host) are defined separately in @picstash/server.
 */
export const coreConfigSchema = z.object({
  database: z.object({
    url: z.string().min(1, 'Database URL is required'),
  }),
  storage: z.object({
    path: z.string().min(1, 'Storage path is required'),
  }),
  logging: loggingSchema,
  ollama: z.object({
    url: z.string().default('http://localhost:11434'),
    model: z.string().default('llama3.2'),
  }).optional(),
});

export type CoreConfig = z.infer<typeof coreConfigSchema>;

/**
 * Load core configuration from a YAML file.
 * @param configPath - Path to the config file.
 */
export function loadCoreConfig(configPath: string): CoreConfig {
  const configFile = readFileSync(configPath, 'utf8');
  const rawConfig = yaml.load(configFile);
  return coreConfigSchema.parse(rawConfig);
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

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Config } from '@/config.js';
import type { FastifyServerOptions } from 'fastify';

// Path from this file (src/infra/logging/) to the server package root (packages/server/)
const SERVER_ROOT_RELATIVE_PATH = '../../../';
const currentDir = fileURLToPath(new URL('.', import.meta.url));

/**
 * Resolve log file path relative to the server package root.
 */
function resolveLogPath(configPath: string): string {
  return resolve(currentDir, SERVER_ROOT_RELATIVE_PATH, configPath);
}

/**
 * Create pino-pretty transport options for console output.
 */
function createPrettyTransport() {
  return {
    target: 'pino-pretty',
    options: {
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  };
}

/**
 * Create pino-roll transport options for file output with rotation.
 */
function createRollTransport(
  logPath: string,
  maxSize: string,
  maxFiles: number,
) {
  return {
    target: 'pino-roll',
    options: {
      file: logPath,
      size: maxSize,
      mkdir: true,
      limit: { count: maxFiles },
    },
  };
}

/**
 * Create pino/file transport options for file output without rotation.
 */
function createFileTransport(destination: string | number) {
  return {
    target: 'pino/file',
    options: { destination },
  };
}

/**
 * Build Fastify logger options from config.
 *
 * Supports the following configurations:
 * - Log level: debug, info, warn, error
 * - Format: pretty (development) or json (production)
 * - File output: optional, with or without rotation
 *
 * @param config - Application configuration
 * @returns Fastify logger options
 */
export function buildLoggerOptions(
  config: Config,
): FastifyServerOptions['logger'] {
  const { logging } = config;
  const baseOptions = { level: logging.level };

  // Console only (no file output)
  if (!logging.file.enabled) {
    if (logging.format === 'pretty') {
      return {
        ...baseOptions,
        transport: createPrettyTransport(),
      };
    }
    // JSON format - use default pino logger (no transport needed)
    return baseOptions;
  }

  // File output enabled
  const logPath = resolveLogPath(logging.file.path);
  const { rotation } = logging.file;

  if (logging.format === 'pretty') {
    // Pretty format with file output
    const fileTransport = rotation.enabled
      ? createRollTransport(logPath, rotation.maxSize, rotation.maxFiles)
      : createFileTransport(logPath);

    return {
      ...baseOptions,
      transport: {
        targets: [createPrettyTransport(), fileTransport],
      },
    };
  }

  // JSON format with file output
  const fileTransport = rotation.enabled
    ? createRollTransport(logPath, rotation.maxSize, rotation.maxFiles)
    : createFileTransport(logPath);

  return {
    ...baseOptions,
    transport: {
      targets: [
        createFileTransport(1), // stdout
        fileTransport,
      ],
    },
  };
}

import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Config } from '@/config.js';
import type { FastifyServerOptions } from 'fastify';

const currentDir = dirname(fileURLToPath(import.meta.url));

/**
 * Parse size string (e.g., '10M', '1G') to bytes
 */
function parseSize(size: string): number {
  const match = /^(\d+)([KMG]?)$/i.exec(size);
  const numStr = match?.[1];
  if (numStr === undefined) {
    throw new Error(`Invalid size format: ${size}`);
  }
  const num = parseInt(numStr, 10);
  const unit = match?.[2]?.toUpperCase() ?? '';

  switch (unit) {
    case 'K':
      return num * 1024;
    case 'M':
      return num * 1024 * 1024;
    case 'G':
      return num * 1024 * 1024 * 1024;
    default:
      return num;
  }
}

/**
 * Build Fastify logger options from config
 */
export function buildLoggerOptions(
  config: Config,
): FastifyServerOptions['logger'] {
  const { logging } = config;

  // Base logger options
  const baseOptions = {
    level: logging.level,
  };

  // Pretty format for development
  if (logging.format === 'pretty') {
    if (logging.file.enabled) {
      // File output with pretty format (using pino-roll)
      const logPath = resolve(currentDir, '../../../', logging.file.path);
      mkdirSync(dirname(logPath), { recursive: true });

      if (logging.file.rotation.enabled) {
        return {
          ...baseOptions,
          transport: {
            targets: [
              // Console output (pretty)
              {
                target: 'pino-pretty',
                options: {
                  translateTime: 'HH:MM:ss Z',
                  ignore: 'pid,hostname',
                },
              },
              // File output with rotation
              {
                target: 'pino-roll',
                options: {
                  file: logPath,
                  size: parseSize(logging.file.rotation.maxSize),
                  limit: { count: logging.file.rotation.maxFiles },
                },
              },
            ],
          },
        };
      }

      // File output without rotation
      return {
        ...baseOptions,
        transport: {
          targets: [
            {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            },
            {
              target: 'pino/file',
              options: { destination: logPath },
            },
          ],
        },
      };
    }

    // Console only (pretty)
    return {
      ...baseOptions,
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    };
  }

  // JSON format for production
  if (logging.file.enabled) {
    const logPath = resolve(currentDir, '../../../', logging.file.path);
    mkdirSync(dirname(logPath), { recursive: true });

    if (logging.file.rotation.enabled) {
      return {
        ...baseOptions,
        transport: {
          targets: [
            // Console output (JSON)
            { target: 'pino/file', options: { destination: 1 } }, // stdout
            // File output with rotation
            {
              target: 'pino-roll',
              options: {
                file: logPath,
                size: parseSize(logging.file.rotation.maxSize),
                limit: { count: logging.file.rotation.maxFiles },
              },
            },
          ],
        },
      };
    }

    // File output without rotation
    return {
      ...baseOptions,
      transport: {
        targets: [
          { target: 'pino/file', options: { destination: 1 } },
          { target: 'pino/file', options: { destination: logPath } },
        ],
      },
    };
  }

  // JSON console only
  return baseOptions;
}

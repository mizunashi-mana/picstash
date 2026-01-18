import { describe, expect, it } from 'vitest';
import { buildLoggerOptions } from '@/infra/logging/logger.js';
import type { Config } from '@/config.js';

function createConfig(
  overrides: Partial<Config['logging']> = {},
): Config {
  return {
    server: { port: 3000, host: '0.0.0.0' },
    database: { url: 'file:./test.db' },
    storage: { path: './storage' },
    logging: {
      level: 'info',
      format: 'pretty',
      file: {
        enabled: false,
        path: './logs/server.log',
        rotation: {
          enabled: true,
          maxSize: '10M',
          maxFiles: 5,
        },
      },
      ...overrides,
    },
  };
}

describe('buildLoggerOptions', () => {
  describe('log level', () => {
    it('should set level from config', () => {
      const options = buildLoggerOptions(createConfig({ level: 'debug' }));
      expect(options).toMatchObject({ level: 'debug' });
    });

    it.each(['debug', 'info', 'warn', 'error'] as const)(
      'should accept %s level',
      (level) => {
        const options = buildLoggerOptions(createConfig({ level }));
        expect(options).toMatchObject({ level });
      },
    );
  });

  describe('console only (file disabled)', () => {
    it('should use pino-pretty transport for pretty format', () => {
      const options = buildLoggerOptions(
        createConfig({ format: 'pretty', file: { enabled: false, path: '', rotation: { enabled: false, maxSize: '10M', maxFiles: 5 } } }),
      );

      expect(options).toMatchObject({
        level: 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      });
    });

    it('should not use transport for json format (default pino)', () => {
      const options = buildLoggerOptions(
        createConfig({ format: 'json', file: { enabled: false, path: '', rotation: { enabled: false, maxSize: '10M', maxFiles: 5 } } }),
      );

      expect(options).toEqual({ level: 'info' });
      expect(options).not.toHaveProperty('transport');
    });
  });

  describe('file output with rotation', () => {
    const fileConfig = {
      enabled: true,
      path: './logs/test.log',
      rotation: {
        enabled: true,
        maxSize: '5M',
        maxFiles: 3,
      },
    };

    it('should use pino-pretty and pino-roll for pretty format', () => {
      const options = buildLoggerOptions(
        createConfig({ format: 'pretty', file: fileConfig }),
      );

      expect(options).toMatchObject({
        level: 'info',
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
              target: 'pino-roll',
              options: {
                size: '5M',
                mkdir: true,
                limit: { count: 3 },
              },
            },
          ],
        },
      });
    });

    it('should use pino/file and pino-roll for json format', () => {
      const options = buildLoggerOptions(
        createConfig({ format: 'json', file: fileConfig }),
      );

      expect(options).toMatchObject({
        level: 'info',
        transport: {
          targets: [
            {
              target: 'pino/file',
              options: { destination: 1 },
            },
            {
              target: 'pino-roll',
              options: {
                size: '5M',
                mkdir: true,
                limit: { count: 3 },
              },
            },
          ],
        },
      });
    });
  });

  describe('file output without rotation', () => {
    const fileConfig = {
      enabled: true,
      path: './logs/test.log',
      rotation: {
        enabled: false,
        maxSize: '10M',
        maxFiles: 5,
      },
    };

    it('should use pino-pretty and pino/file for pretty format', () => {
      const options = buildLoggerOptions(
        createConfig({ format: 'pretty', file: fileConfig }),
      );

      expect(options).toMatchObject({
        level: 'info',
        transport: {
          targets: [
            { target: 'pino-pretty' },
            { target: 'pino/file' },
          ],
        },
      });
    });

    it('should use two pino/file transports for json format', () => {
      const options = buildLoggerOptions(
        createConfig({ format: 'json', file: fileConfig }),
      );

      expect(options).toMatchObject({
        level: 'info',
        transport: {
          targets: [
            {
              target: 'pino/file',
              options: { destination: 1 },
            },
            {
              target: 'pino/file',
            },
          ],
        },
      });
    });
  });

  describe('log path resolution', () => {
    it('should resolve relative path to absolute path', () => {
      const options = buildLoggerOptions(
        createConfig({
          file: {
            enabled: true,
            path: './logs/app.log',
            rotation: { enabled: true, maxSize: '10M', maxFiles: 5 },
          },
        }),
      );

      // Check that transport has targets with pino-roll containing absolute path
      expect(options).toHaveProperty('transport.targets');
      const json = JSON.stringify(options);
      // File path should be absolute (starts with / on Unix or C:\ on Windows)
      expect(json).toMatch(/logs.*app\.log/);
      expect(json).toMatch(/"file":"(\/|[A-Z]:)/);
    });
  });
});

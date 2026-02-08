import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initConfig, loadConfig, parseCliArgs, parseConfigArg } from '@/config.js';

describe('config', () => {
  const testDir = join(__dirname, 'tmp-config-test');
  const originalCwd = process.cwd();

  beforeEach(() => {
    // Create test directory
    mkdirSync(testDir, { recursive: true });
    // Change to test directory
    process.chdir(testDir);
  });

  afterEach(() => {
    // Restore original cwd
    process.chdir(originalCwd);
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    vi.unstubAllEnvs();
  });

  describe('loadConfig', () => {
    it('should load config from specified path', () => {
      const configPath = join(testDir, 'custom-config.yaml');
      writeFileSync(
        configPath,
        `
server:
  port: 5000
  host: "127.0.0.1"
database:
  path: "./custom/db.sqlite"
storage:
  path: "./custom/storage"
logging:
  level: "debug"
  format: "json"
`,
      );

      const config = loadConfig(configPath);

      expect(config.server.port).toBe(5000);
      expect(config.server.host).toBe('127.0.0.1');
      expect(config.database.path).toBe(resolve(testDir, './custom/db.sqlite'));
      expect(config.storage.path).toBe(resolve(testDir, './custom/storage'));
      expect(config.logging.level).toBe('debug');
      expect(config.logging.format).toBe('json');
    });

    it('should load config from default config.yaml in cwd', () => {
      const configPath = join(testDir, 'config.yaml');
      writeFileSync(
        configPath,
        `
server:
  port: 6000
`,
      );

      const config = loadConfig();

      expect(config.server.port).toBe(6000);
    });

    it('should use default values when no config file exists', () => {
      const config = loadConfig();

      expect(config.server.port).toBe(4000);
      expect(config.server.host).toBe('0.0.0.0');
      expect(config.database.path).toBe(resolve(testDir, './data/picstash.db'));
      expect(config.storage.path).toBe(resolve(testDir, './data/storage'));
      expect(config.logging.level).toBe('info');
      expect(config.logging.format).toBe('pretty');
      expect(config.logging.file.enabled).toBe(false);
    });

    it('should resolve relative paths to absolute paths', () => {
      const configPath = join(testDir, 'config.yaml');
      writeFileSync(
        configPath,
        `
database:
  path: "./my-db.sqlite"
storage:
  path: "./my-storage"
`,
      );

      const config = loadConfig(configPath);

      expect(config.database.path).toBe(resolve(testDir, './my-db.sqlite'));
      expect(config.storage.path).toBe(resolve(testDir, './my-storage'));
    });

    it('should preserve absolute paths', () => {
      const configPath = join(testDir, 'config.yaml');
      // Use absolute paths within testDir to avoid permission issues
      const absoluteDbPath = join(testDir, 'absolute-db', 'db.sqlite');
      const absoluteStoragePath = join(testDir, 'absolute-storage');
      writeFileSync(
        configPath,
        `
database:
  path: "${absoluteDbPath}"
storage:
  path: "${absoluteStoragePath}"
`,
      );

      const config = loadConfig(configPath);

      expect(config.database.path).toBe(absoluteDbPath);
      expect(config.storage.path).toBe(absoluteStoragePath);
    });

    it('should create parent directory for database path', () => {
      const configPath = join(testDir, 'config.yaml');
      const dbDir = join(testDir, 'new-data-dir');
      writeFileSync(
        configPath,
        `
database:
  path: "./new-data-dir/db.sqlite"
`,
      );

      expect(existsSync(dbDir)).toBe(false);

      loadConfig(configPath);

      expect(existsSync(dbDir)).toBe(true);
    });

    it('should handle logging file configuration', () => {
      const configPath = join(testDir, 'config.yaml');
      writeFileSync(
        configPath,
        `
logging:
  level: "warn"
  format: "json"
  file:
    enabled: true
    path: "./logs/app.log"
    rotation:
      enabled: true
      maxSize: "20M"
      maxFiles: 10
`,
      );

      const config = loadConfig(configPath);

      expect(config.logging.level).toBe('warn');
      expect(config.logging.format).toBe('json');
      expect(config.logging.file.enabled).toBe(true);
      expect(config.logging.file.path).toBe(resolve(testDir, './logs/app.log'));
      expect(config.logging.file.rotation.enabled).toBe(true);
      expect(config.logging.file.rotation.maxSize).toBe('20M');
      expect(config.logging.file.rotation.maxFiles).toBe(10);
    });

    it('should handle ollama configuration', () => {
      const configPath = join(testDir, 'config.yaml');
      writeFileSync(
        configPath,
        `
ollama:
  url: "http://custom-ollama:11434"
  model: "mistral"
`,
      );

      const config = loadConfig(configPath);

      expect(config.ollama?.url).toBe('http://custom-ollama:11434');
      expect(config.ollama?.model).toBe('mistral');
    });
  });

  describe('initConfig', () => {
    it('should use provided configPath', () => {
      const configPath = join(testDir, 'init-config.yaml');
      writeFileSync(
        configPath,
        `
server:
  port: 7000
`,
      );

      const config = initConfig(configPath);

      expect(config.server.port).toBe(7000);
    });

    it('should use PICSTASH_CONFIG env var when no path provided', () => {
      const configPath = join(testDir, 'env-config.yaml');
      writeFileSync(
        configPath,
        `
server:
  port: 8000
`,
      );

      vi.stubEnv('PICSTASH_CONFIG', configPath);

      const config = initConfig();

      expect(config.server.port).toBe(8000);
    });

    it('should prefer provided path over env var', () => {
      const configPath1 = join(testDir, 'config1.yaml');
      const configPath2 = join(testDir, 'config2.yaml');
      writeFileSync(configPath1, 'server:\n  port: 9000');
      writeFileSync(configPath2, 'server:\n  port: 9001');

      vi.stubEnv('PICSTASH_CONFIG', configPath2);

      const config = initConfig(configPath1);

      expect(config.server.port).toBe(9000);
    });
  });

  describe('parseConfigArg', () => {
    it('should parse --config=path format', () => {
      const args = ['node', 'script.js', '--config=/path/to/config.yaml'];
      expect(parseConfigArg(args)).toBe('/path/to/config.yaml');
    });

    it('should parse --config path format', () => {
      const args = ['node', 'script.js', '--config', '/path/to/config.yaml'];
      expect(parseConfigArg(args)).toBe('/path/to/config.yaml');
    });

    it('should return undefined when no --config option', () => {
      const args = ['node', 'script.js', 'generate'];
      expect(parseConfigArg(args)).toBeUndefined();
    });

    it('should return undefined when --config is last arg without value', () => {
      const args = ['node', 'script.js', '--config'];
      expect(parseConfigArg(args)).toBeUndefined();
    });
  });

  describe('parseCliArgs', () => {
    it('should extract command and configPath', () => {
      const args = ['node', 'script.js', '--config', '/path/config.yaml', 'generate'];
      const result = parseCliArgs(args);

      expect(result.command).toBe('generate');
      expect(result.configPath).toBe('/path/config.yaml');
    });

    it('should handle --config=path format', () => {
      const args = ['node', 'script.js', '--config=/path/config.yaml', 'sync'];
      const result = parseCliArgs(args);

      expect(result.command).toBe('sync');
      expect(result.configPath).toBe('/path/config.yaml');
    });

    it('should use default command when none specified', () => {
      const args = ['node', 'script.js'];
      const result = parseCliArgs(args);

      expect(result.command).toBe('generate');
      expect(result.configPath).toBeUndefined();
    });

    it('should use custom default command', () => {
      const args = ['node', 'script.js'];
      const result = parseCliArgs(args, 'status');

      expect(result.command).toBe('status');
    });

    it('should filter out --config option from command', () => {
      const args = ['node', 'script.js', 'regenerate', '--config', '/path/config.yaml'];
      const result = parseCliArgs(args);

      expect(result.command).toBe('regenerate');
      expect(result.configPath).toBe('/path/config.yaml');
    });
  });
});

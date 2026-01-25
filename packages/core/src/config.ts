/**
 * Core configuration types for @picstash/core.
 *
 * IMPORTANT: All paths must be absolute. The core package does NOT resolve paths.
 * Path resolution is the responsibility of the server/application layer.
 */

/**
 * Log rotation settings.
 */
export interface LogRotationConfig {
  /** Whether to enable log rotation */
  enabled: boolean;
  /** Maximum file size before rotation (e.g., "10M", "1G") */
  maxSize: string;
  /** Maximum number of rotated files to keep */
  maxFiles: number;
}

/**
 * File logging settings.
 */
export interface LogFileConfig {
  /** Whether to enable file logging */
  enabled: boolean;
  /** Absolute path to the log file */
  path: string;
  /** Log rotation settings */
  rotation: LogRotationConfig;
}

/**
 * Logging configuration.
 */
export interface LoggingConfig {
  /** Log level: 'debug' | 'info' | 'warn' | 'error' */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Log format: 'pretty' | 'json' */
  format: 'pretty' | 'json';
  /** File output settings */
  file: LogFileConfig;
}

/**
 * Ollama LLM configuration.
 */
export interface OllamaConfig {
  /** Ollama server URL */
  url: string;
  /** Model name to use */
  model: string;
}

/**
 * Core configuration - contains settings needed by @picstash/core.
 * Server-specific settings (port, host) are defined separately in @picstash/server.
 */
export interface CoreConfig {
  database: {
    /** Absolute path to the SQLite database file */
    path: string;
  };
  storage: {
    /** Absolute path to the storage directory */
    path: string;
  };
  logging: LoggingConfig;
  ollama?: OllamaConfig;
}

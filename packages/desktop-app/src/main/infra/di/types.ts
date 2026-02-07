import { TYPES as CORE_TYPES } from '@picstash/core';

// Re-export core types
export { TYPES as CORE_TYPES } from '@picstash/core';

// Desktop-app-specific database service type (not part of core)
export const DB_TYPES = {
  PrismaService: Symbol.for('PrismaService'),
} as const;

// Combined types for convenience
export const TYPES = {
  ...CORE_TYPES,
  ...DB_TYPES,
} as const;

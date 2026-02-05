/**
 * API Client DI Types
 *
 * inversify コンテナで使用する DI トークン定義
 */

export const API_TYPES = {
  ApiClient: Symbol.for('ApiClient'),
} as const;

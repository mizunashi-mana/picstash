/**
 * API Client DI Types
 *
 * inversify コンテナで使用する DI トークン定義
 */

export const API_TYPES = {
  HttpClient: Symbol.for('HttpClient'),
  ApiClient: Symbol.for('ApiClient'),
} as const;

/**
 * Images API - エンドポイント定義と型
 *
 * client と server で共有する画像関連の API 定義
 */

import { buildUrl } from './url.js';

// ============================================================
// クエリパラメータ型
// ============================================================

/** 画像一覧取得オプション */
export type ImageListQuery = {
  /** 検索クエリ */
  q?: string;
  /** 取得件数 */
  limit?: number;
  /** オフセット */
  offset?: number;
};

/** 類似画像取得オプション */
export type SimilarImagesQuery = {
  /** 取得件数 */
  limit?: number;
};

/** 属性提案取得オプション */
export type SuggestedAttributesQuery = {
  /** 類似度閾値 */
  threshold?: number;
  /** 取得件数 */
  limit?: number;
};

/** 重複画像取得オプション */
export type DuplicatesQuery = {
  /** 類似度閾値 */
  threshold?: number;
};

// ============================================================
// エンドポイント定義
// ============================================================

/**
 * 画像エンドポイント定義
 *
 * client: URL を生成するヘルパー関数として使用
 * server: routes プロパティでルート登録に使用
 */
export const imageEndpoints = {
  /** 画像一覧を取得 (GET) / 画像をアップロード (POST) */
  list: (query?: ImageListQuery) => buildUrl('/api/images', query),

  /** 画像詳細を取得 (GET) / 画像を更新 (PATCH) / 画像を削除 (DELETE) */
  detail: (imageId: string) => `/api/images/${imageId}` as const,

  /** サムネイル画像を取得 */
  thumbnail: (imageId: string) => `/api/images/${imageId}/thumbnail` as const,

  /** オリジナル画像ファイルを取得 */
  file: (imageId: string) => `/api/images/${imageId}/file` as const,

  /** 類似画像一覧を取得 */
  similar: (imageId: string, query?: SimilarImagesQuery) =>
    buildUrl(`/api/images/${imageId}/similar`, query),

  /** 属性提案を取得 */
  suggestedAttributes: (imageId: string, query?: SuggestedAttributesQuery) =>
    buildUrl(`/api/images/${imageId}/suggested-attributes`, query),

  /** 説明文を生成（ジョブ作成） */
  generateDescription: (imageId: string) => `/api/images/${imageId}/generate-description` as const,

  /** 重複画像グループを取得 */
  duplicates: (query?: DuplicatesQuery) => buildUrl('/api/images/duplicates', query),

  /** 画像が所属するコレクション一覧を取得 */
  collections: (imageId: string) => `/api/images/${imageId}/collections` as const,

  /** 画像属性 */
  attributes: {
    /** 画像の属性一覧を取得 (GET) / 属性を追加 (POST) */
    list: (imageId: string) => `/api/images/${imageId}/attributes` as const,

    /** 属性を更新 (PUT) / 属性を削除 (DELETE) */
    detail: (imageId: string, attributeId: string) =>
      `/api/images/${imageId}/attributes/${attributeId}` as const,
  },

  /** ローカルファイルから画像レコードを作成（デスクトップアプリ用） */
  fromLocal: '/api/images/from-local' as const,

  /**
   * server 側のルート登録用パターン
   * Fastify のパラメータ形式（:param）を使用
   */
  routes: {
    list: '/api/images',
    detail: '/api/images/:imageId',
    thumbnail: '/api/images/:imageId/thumbnail',
    file: '/api/images/:imageId/file',
    similar: '/api/images/:imageId/similar',
    suggestedAttributes: '/api/images/:imageId/suggested-attributes',
    generateDescription: '/api/images/:imageId/generate-description',
    duplicates: '/api/images/duplicates',
    collections: '/api/images/:imageId/collections',
    fromLocal: '/api/images/from-local',
    attributes: {
      list: '/api/images/:imageId/attributes',
      detail: '/api/images/:imageId/attributes/:attributeId',
    },
  },
} as const;

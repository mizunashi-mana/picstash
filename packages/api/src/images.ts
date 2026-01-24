/**
 * Images API - エンドポイント定義と型
 *
 * client と server で共有する画像関連の API 定義
 */

/**
 * 画像エンドポイント定義
 *
 * client: URL を生成するヘルパー関数として使用
 * server: routes プロパティでルート登録に使用
 */
export const imageEndpoints = {
  /** 画像一覧を取得 (GET) / 画像をアップロード (POST) */
  list: '/api/images' as const,

  /** 画像詳細を取得 (GET) / 画像を更新 (PATCH) / 画像を削除 (DELETE) */
  detail: (imageId: string) => `/api/images/${imageId}` as const,

  /** サムネイル画像を取得 */
  thumbnail: (imageId: string) => `/api/images/${imageId}/thumbnail` as const,

  /** オリジナル画像ファイルを取得 */
  file: (imageId: string) => `/api/images/${imageId}/file` as const,

  /** 類似画像一覧を取得 */
  similar: (imageId: string) => `/api/images/${imageId}/similar` as const,

  /** 属性提案を取得 */
  suggestedAttributes: (imageId: string) => `/api/images/${imageId}/suggested-attributes` as const,

  /** 説明文を生成（ジョブ作成） */
  generateDescription: (imageId: string) => `/api/images/${imageId}/generate-description` as const,

  /** 重複画像グループを取得 */
  duplicates: '/api/images/duplicates' as const,

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
    attributes: {
      list: '/api/images/:imageId/attributes',
      detail: '/api/images/:imageId/attributes/:attributeId',
    },
  },
} as const;

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
  /** サムネイル画像を取得 */
  thumbnail: (imageId: string) => `/api/images/${imageId}/thumbnail` as const,

  /** オリジナル画像ファイルを取得 */
  file: (imageId: string) => `/api/images/${imageId}/file` as const,

  /** 画像詳細を取得 */
  detail: (imageId: string) => `/api/images/${imageId}` as const,

  /** 画像一覧を取得 */
  list: '/api/images' as const,

  /** 画像をアップロード */
  upload: '/api/images/upload' as const,

  /** 画像を削除 */
  delete: (imageId: string) => `/api/images/${imageId}` as const,

  /**
   * server 側のルート登録用パターン
   * Fastify のパラメータ形式（:param）を使用
   */
  routes: {
    thumbnail: '/api/images/:imageId/thumbnail',
    file: '/api/images/:imageId/file',
    detail: '/api/images/:imageId',
    list: '/api/images',
    upload: '/api/images/upload',
    delete: '/api/images/:imageId',
  },
} as const;

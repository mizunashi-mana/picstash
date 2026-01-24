/**
 * Attribute label type definitions
 */

/**
 * ラベルエンドポイント定義
 */
export const labelsEndpoints = {
  /** ラベル一覧取得 */
  list: '/api/labels' as const,

  /** ラベル詳細取得 */
  detail: (labelId: string) => `/api/labels/${labelId}` as const,

  /** ラベル作成 */
  create: '/api/labels' as const,

  /** ラベル更新 */
  update: (labelId: string) => `/api/labels/${labelId}` as const,

  /** ラベル削除 */
  delete: (labelId: string) => `/api/labels/${labelId}` as const,

  /**
   * server 側のルート登録用パターン
   */
  routes: {
    list: '/api/labels',
    detail: '/api/labels/:labelId',
    create: '/api/labels',
    update: '/api/labels/:labelId',
    delete: '/api/labels/:labelId',
  },
} as const;

export interface Label {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabelInput {
  name: string;
  color?: string;
}

export interface UpdateLabelInput {
  name?: string;
  color?: string;
}

/**
 * Collections API - エンドポイント定義と型
 *
 * client と server で共有するコレクション関連の API 定義
 */

// ============================================================
// レスポンス型
// ============================================================

/** コレクション */
export interface Collection {
  id: string;
  name: string;
  description: string | null;
  coverImageId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** コレクション（画像数付き） */
export interface CollectionWithCount extends Collection {
  imageCount: number;
}

/** コレクション画像 */
export interface CollectionImage {
  id: string;
  imageId: string;
  order: number;
  title: string;
  thumbnailPath: string | null;
}

/** コレクション（画像付き） */
export interface CollectionWithImages extends Collection {
  images: CollectionImage[];
}

/** コレクション作成入力 */
export interface CreateCollectionInput {
  name: string;
  description?: string;
  coverImageId?: string;
}

/** コレクション更新入力 */
export interface UpdateCollectionInput {
  name?: string;
  description?: string | null;
  coverImageId?: string | null;
}

/** コレクション画像追加入力 */
export interface AddImageInput {
  imageId: string;
  order?: number;
}

/** コレクション画像順序更新入力 */
export interface UpdateOrderInput {
  orders: Array<{
    imageId: string;
    order: number;
  }>;
}

// ============================================================
// エンドポイント定義
// ============================================================

/**
 * コレクションエンドポイント定義
 */
export const collectionsEndpoints = {
  /** コレクション一覧取得 (GET) / コレクション作成 (POST) */
  list: '/api/collections' as const,

  /** コレクション詳細取得 (GET) / コレクション更新 (PUT) / コレクション削除 (DELETE) */
  detail: (collectionId: string) => `/api/collections/${collectionId}` as const,

  /** コレクションの画像 */
  images: {
    /** 画像追加 (POST) */
    list: (collectionId: string) => `/api/collections/${collectionId}/images` as const,

    /** 画像削除 (DELETE) */
    detail: (collectionId: string, imageId: string) =>
      `/api/collections/${collectionId}/images/${imageId}` as const,

    /** 画像順序更新 (PUT) */
    order: (collectionId: string) => `/api/collections/${collectionId}/images/order` as const,
  },

  /**
   * server 側のルート登録用パターン
   */
  routes: {
    list: '/api/collections',
    detail: '/api/collections/:id',
    images: {
      list: '/api/collections/:id/images',
      detail: '/api/collections/:id/images/:imageId',
      order: '/api/collections/:id/images/order',
    },
  },
} as const;

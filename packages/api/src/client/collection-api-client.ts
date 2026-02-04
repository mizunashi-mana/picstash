/**
 * Collection API Client Interface
 */

import type {
  AddImageInput,
  Collection,
  CollectionWithCount,
  CollectionWithImages,
  CreateCollectionInput,
  UpdateCollectionInput,
  UpdateOrderInput,
} from '../collections.js';

export interface CollectionApiClient {
  /** コレクション一覧取得 */
  list: () => Promise<CollectionWithCount[]>;

  /** コレクション詳細取得 */
  detail: (collectionId: string) => Promise<CollectionWithImages>;

  /** コレクション作成 */
  create: (input: CreateCollectionInput) => Promise<Collection>;

  /** コレクション更新 */
  update: (collectionId: string, input: UpdateCollectionInput) => Promise<Collection>;

  /** コレクション削除 */
  delete: (collectionId: string) => Promise<void>;

  /** コレクションに画像追加 */
  addImage: (collectionId: string, input: AddImageInput) => Promise<void>;

  /** コレクションから画像削除 */
  removeImage: (collectionId: string, imageId: string) => Promise<void>;

  /** コレクション画像順序更新 */
  updateImageOrder: (collectionId: string, input: UpdateOrderInput) => Promise<void>;

  /** 画像が所属するコレクション一覧取得 */
  fetchImageCollections: (imageId: string) => Promise<Collection[]>;
}

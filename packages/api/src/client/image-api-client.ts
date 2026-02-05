/**
 * Image API Client Interface
 */

import type { Collection } from '@/collections.js';
import type {
  DuplicatesQuery,
  DuplicatesResponse,
  GenerateDescriptionJobResponse,
  Image,
  ImageListQuery,
  PaginatedResult,
  PaginationOptions,
  SimilarImagesQuery,
  SimilarImagesResponse,
  SuggestedAttributesQuery,
  SuggestedAttributesResponse,
  UpdateImageInput,
} from '@/images.js';

export interface ImageApiClient {
  /** 画像一覧取得 */
  list: (query?: ImageListQuery) => Promise<Image[]>;

  /** 画像一覧取得（ページネーション） */
  listPaginated: (query?: string, options?: PaginationOptions) => Promise<PaginatedResult<Image>>;

  /** 画像詳細取得 */
  detail: (imageId: string) => Promise<Image>;

  /** 画像更新 */
  update: (imageId: string, input: UpdateImageInput) => Promise<Image>;

  /** 画像削除 */
  delete: (imageId: string) => Promise<void>;

  /** 画像ファイル URL 取得 */
  getImageUrl: (imageId: string) => string;

  /** サムネイル URL 取得 */
  getThumbnailUrl: (imageId: string) => string;

  /** 類似画像取得 */
  fetchSimilar: (imageId: string, query?: SimilarImagesQuery) => Promise<SimilarImagesResponse>;

  /** 重複画像取得 */
  fetchDuplicates: (query?: DuplicatesQuery) => Promise<DuplicatesResponse>;

  /** 属性提案取得 */
  fetchSuggestedAttributes: (imageId: string, query?: SuggestedAttributesQuery) => Promise<SuggestedAttributesResponse>;

  /** 説明文生成ジョブ作成 */
  generateDescription: (imageId: string) => Promise<GenerateDescriptionJobResponse>;

  /** 画像が所属するコレクション一覧取得 */
  fetchCollections: (imageId: string) => Promise<Collection[]>;

  /** 画像アップロード */
  // eslint-disable-next-line n/no-unsupported-features/node-builtins -- Blob is available in browser environment
  upload: (file: Blob) => Promise<Image>;
}

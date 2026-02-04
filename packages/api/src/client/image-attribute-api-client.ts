/**
 * Image Attribute API Client Interface
 */

import type {
  CreateImageAttributeInput,
  ImageAttribute,
  UpdateImageAttributeInput,
} from '../image-attributes.js';

export interface ImageAttributeApiClient {
  /** 画像の属性一覧取得 */
  list: (imageId: string) => Promise<ImageAttribute[]>;

  /** 属性追加 */
  create: (imageId: string, input: CreateImageAttributeInput) => Promise<ImageAttribute>;

  /** 属性更新 */
  update: (imageId: string, attributeId: string, input: UpdateImageAttributeInput) => Promise<ImageAttribute>;

  /** 属性削除 */
  delete: (imageId: string, attributeId: string) => Promise<void>;
}

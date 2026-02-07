// This file is deprecated. Use ApiClient from @/shared instead.
// Types should be imported from @picstash/api.
//
// Migration guide:
//   Before:
//     import { uploadImage } from '@/features/upload/api';
//     const image = await uploadImage(file);
//
//   After:
//     import { useApiClient } from '@/shared';
//     import type { Image } from '@picstash/api';
//     const apiClient = useApiClient();
//     const image = await apiClient.images.upload(file);
//
// Note: For desktop local storage upload, use uploadImageWithLocalFallback from this feature.

import { uploadImageLocal } from './local-api.js';
import type { Image } from '@picstash/api';

/**
 * ローカルストレージが使用可能かどうかを確認
 */
async function isLocalStorageAvailable(): Promise<boolean> {
  if (window.picstash === undefined) {
    return false;
  }
  return await window.picstash.storage.isInitialized();
}

/**
 * 画像をアップロード（ローカルストレージ対応版）
 * デスクトップモードでローカルストレージが初期化済みの場合はローカルアップロードを使用
 * それ以外の場合は HTTP アップロードにフォールバック
 *
 * @param file アップロードするファイル
 * @param httpUpload HTTP 経由でアップロードする関数（ApiClient.images.upload）
 */
export async function uploadImageWithLocalFallback(
  file: Blob,
  httpUpload: (file: Blob) => Promise<Image>,
): Promise<Image> {
  // デスクトップモードでローカルストレージが使用可能な場合
  if (await isLocalStorageAvailable()) {
    return await uploadImageLocal(file);
  }

  // フォールバック: 従来の HTTP アップロード
  return await httpUpload(file);
}

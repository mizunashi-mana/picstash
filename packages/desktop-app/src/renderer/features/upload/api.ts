import { uploadImageLocal } from './local-api.js';

export interface Image {
  id: string;
  path: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ErrorResponse {
  message?: string;
}

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
 * HTTP 経由で画像をアップロード（従来方式）
 */
async function uploadImageHttp(file: Blob): Promise<Image> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/images', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API error response
    const error = (await response.json()) as ErrorResponse;
    throw new Error(error.message ?? 'Upload failed');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API response
  return (await response.json()) as Image;
}

/**
 * 画像をアップロード
 * デスクトップモードでローカルストレージが初期化済みの場合はローカルアップロードを使用
 * それ以外の場合は HTTP アップロードにフォールバック
 */
export async function uploadImage(file: Blob): Promise<Image> {
  // デスクトップモードでローカルストレージが使用可能な場合
  if (await isLocalStorageAvailable()) {
    return await uploadImageLocal(file);
  }

  // フォールバック: 従来の HTTP アップロード
  return await uploadImageHttp(file);
}

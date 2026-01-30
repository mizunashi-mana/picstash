import { imageEndpoints } from '@picstash/api';
import type { Image } from './types.js';

/**
 * ローカルからの画像作成用リクエストボディ
 */
interface CreateImageFromLocalInput {
  path: string;
  thumbnailPath: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
}

/**
 * ローカルストレージを使用して画像をアップロード
 * 1. IPC 経由でローカルにファイル保存
 * 2. リモート API でデータベースレコード作成
 * @param file アップロードするファイル
 * @returns 作成された画像レコード
 * @throws picstash API が利用できない場合
 */
export async function uploadImageLocal(file: Blob): Promise<Image> {
  // picstash API の存在確認（呼び出し元で確認済みだが型安全のため再チェック）
  if (window.picstash === undefined) {
    throw new Error('Picstash API is not available');
  }
  const { image, storage } = window.picstash;

  // 1. Blob → ArrayBuffer
  const data = await file.arrayBuffer();

  // 2. ローカル保存 (IPC)
  const result = await image.upload({
    data,
    filename: file instanceof File ? file.name : 'image',
    mimetype: file.type,
  });

  if (!result.success) {
    throw new Error(result.message);
  }

  // 3. DB レコード作成 (リモート API)
  const body: CreateImageFromLocalInput = {
    path: result.path,
    thumbnailPath: result.thumbnailPath,
    mimeType: result.mimeType,
    size: result.size,
    width: result.width,
    height: result.height,
  };

  const response = await fetch(imageEndpoints.fromLocal, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    // ロールバック: ローカルファイル削除
    await storage.deleteFile(result.path).catch(() => {
      // クリーンアップエラーは無視
    });
    await storage.deleteFile(result.thumbnailPath).catch(() => {
      // クリーンアップエラーは無視
    });

    // レスポンスからエラーメッセージを取得
    let errorMessage = `Failed to create database record (status ${String(response.status)})`;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API error response
      const errorBody = (await response.json()) as { message?: string };
      if (typeof errorBody.message === 'string' && errorBody.message !== '') {
        errorMessage = errorBody.message;
      }
    }
    catch {
      // JSON パース失敗時はデフォルトメッセージを使用
    }
    throw new Error(errorMessage);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API response
  return (await response.json()) as Image;
}

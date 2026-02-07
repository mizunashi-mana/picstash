import { imageEndpoints, type Image } from '@picstash/api';

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
 * 2. IPC 経由で API を呼び出してデータベースレコード作成
 * @param file アップロードするファイル
 * @returns 作成された画像レコード
 * @throws picstash API が利用できない場合
 */
export async function uploadImageLocal(file: Blob): Promise<Image> {
  // picstash API の存在確認（呼び出し元で確認済みだが型安全のため再チェック）
  if (window.picstash === undefined) {
    throw new Error('Picstash API is not available');
  }
  const { image, api, storage } = window.picstash;

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

  // 3. DB レコード作成 (IPC 経由で API を呼び出し)
  const body: CreateImageFromLocalInput = {
    path: result.path,
    thumbnailPath: result.thumbnailPath,
    mimeType: result.mimeType,
    size: result.size,
    width: result.width,
    height: result.height,
  };

  const response = await api.request({
    method: 'POST',
    url: imageEndpoints.fromLocal,
    body,
  });

  if (response.error !== undefined) {
    // ロールバック: ローカルファイル削除
    await storage.deleteFile(result.path).catch(() => {
      // クリーンアップエラーは無視
    });
    await storage.deleteFile(result.thumbnailPath).catch(() => {
      // クリーンアップエラーは無視
    });

    throw new Error(response.error);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API response
  return response.data as Image;
}

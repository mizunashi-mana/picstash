// eslint-disable-next-line no-restricted-imports -- Service imports within main process
import { storageManager } from '../storage-manager.js';
import { imageProcessorService } from './image-processor.js';

/**
 * 許可された画像 MIME タイプ
 */
const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
] as const;

type AllowedImageMimeType = typeof ALLOWED_IMAGE_MIME_TYPES[number];

/**
 * MIME タイプが許可されているか確認
 */
function isAllowedMimeType(mimeType: string): mimeType is AllowedImageMimeType {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type guard pattern
  return ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as AllowedImageMimeType);
}

/**
 * MIME タイプから拡張子を取得
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExtension: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/bmp': '.bmp',
  };
  return mimeToExtension[mimeType] ?? '.bin';
}

/**
 * ファイル名から拡張子を取得（小文字に正規化）
 */
function getExtensionFromFilename(filename: string): string | null {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) {
    return null;
  }
  return filename.slice(lastDot).toLowerCase();
}

/**
 * アップロード成功結果
 */
export interface UploadSuccessResult {
  success: true;
  path: string;
  thumbnailPath: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
}

/**
 * アップロード失敗結果
 */
export interface UploadErrorResult {
  success: false;
  error: 'INVALID_MIME_TYPE' | 'STORAGE_NOT_INITIALIZED';
  message: string;
}

/**
 * アップロード結果
 */
export type UploadResult = UploadSuccessResult | UploadErrorResult;

/**
 * アップロード入力
 */
export interface UploadInput {
  data: Buffer;
  filename: string;
  mimetype: string;
}

/**
 * アップロードサービス
 * 画像のローカル保存・サムネイル生成を担当
 */
export class UploadService {
  /**
   * 画像をアップロード（ローカル保存）
   * @param input アップロード入力
   * @returns アップロード結果
   */
  async uploadImage(input: UploadInput): Promise<UploadResult> {
    const { data, filename, mimetype } = input;

    // ストレージ初期化チェック
    if (!storageManager.isInitialized()) {
      return {
        success: false,
        error: 'STORAGE_NOT_INITIALIZED',
        message: 'Storage path is not configured. Please select a storage folder first.',
      };
    }

    // MIME タイプ検証
    if (!isAllowedMimeType(mimetype)) {
      return {
        success: false,
        error: 'INVALID_MIME_TYPE',
        message: `Invalid file type: ${mimetype}. Allowed types: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`,
      };
    }

    // 拡張子を決定（ファイル名優先、なければ MIME タイプから）
    const extension = getExtensionFromFilename(filename) ?? getExtensionFromMimeType(mimetype);

    // オリジナルファイルを保存
    const originalSaved = await storageManager.saveFile(data, {
      category: 'originals',
      extension,
    });

    // メタデータ取得とサムネイル生成
    let metadata;
    let thumbnailSaved;
    try {
      metadata = await imageProcessorService.getMetadata(data);
      const thumbnailBuffer = await imageProcessorService.generateThumbnail(data);
      const thumbnailFilename = originalSaved.filename.replace(/\.[^.]+$/, '.jpg');
      thumbnailSaved = await storageManager.saveFile(thumbnailBuffer, {
        category: 'thumbnails',
        extension: '.jpg',
        filename: thumbnailFilename,
      });
    }
    catch (error: unknown) {
      // エラー時はオリジナルファイルをクリーンアップ
      await storageManager.deleteFile(originalSaved.path).catch(() => {
        // クリーンアップエラーは無視
      });
      if (error instanceof Error) {
        // eslint-disable-next-line no-console -- Background task error logging
        console.error('Failed to process image:', error);
      }
      throw new Error('Failed to process image for upload. Please try again with a different file.');
    }

    return {
      success: true,
      path: originalSaved.path,
      thumbnailPath: thumbnailSaved.path,
      mimeType: mimetype,
      size: data.length,
      width: metadata.width,
      height: metadata.height,
    };
  }

  /**
   * ファイルパスからデータ URL を生成
   * @param relativePath ストレージルートからの相対パス
   * @returns data URL 形式の文字列
   */
  async getDataUrl(relativePath: string): Promise<string> {
    const buffer = await storageManager.readFile(relativePath);

    // 拡張子から MIME タイプを推定
    const extension = relativePath.slice(relativePath.lastIndexOf('.')).toLowerCase();
    const extensionToMime: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
    };
    const mimeType = extensionToMime[extension] ?? 'application/octet-stream';

    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }
}

// シングルトンインスタンス
export const uploadService = new UploadService();

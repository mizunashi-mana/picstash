import sharp from 'sharp';

/**
 * 画像メタデータ
 */
export interface ImageMetadata {
  width: number;
  height: number;
}

/**
 * サムネイルサイズ（300x300）
 */
const THUMBNAIL_SIZE = 300;

/**
 * 画像処理サービス
 * sharp を使用してメタデータ取得・サムネイル生成を行う
 */
export class ImageProcessorService {
  /**
   * 画像のメタデータを取得
   * @param imageData 画像のバイナリデータ
   * @returns 画像の幅と高さ
   * @throws 画像のサイズが取得できない場合
   */
  async getMetadata(imageData: Buffer): Promise<ImageMetadata> {
    const metadata = await sharp(imageData).metadata();
    const { width, height } = metadata;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Sharp returns undefined for corrupted files
    if (width === undefined || height === undefined) {
      throw new Error('Unable to determine image dimensions from file');
    }

    return { width, height };
  }

  /**
   * サムネイルを生成
   * 300x300 ピクセル、JPEG 形式、品質 80%
   * @param imageData 元画像のバイナリデータ
   * @returns サムネイルのバイナリデータ
   */
  async generateThumbnail(imageData: Buffer): Promise<Buffer> {
    return await sharp(imageData)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  }
}

// シングルトンインスタンス
export const imageProcessorService = new ImageProcessorService();

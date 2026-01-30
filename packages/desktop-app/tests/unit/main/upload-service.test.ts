import { beforeEach, describe, expect, it, vi } from 'vitest';

// storageManager モック
vi.mock('../../../src/main/storage-manager.js', () => ({
  storageManager: {
    isInitialized: vi.fn(),
    saveFile: vi.fn(),
    deleteFile: vi.fn(),
    readFile: vi.fn(),
  },
}));

// imageProcessorService モック
vi.mock('../../../src/main/services/image-processor.js', () => ({
  imageProcessorService: {
    getMetadata: vi.fn(),
    generateThumbnail: vi.fn(),
  },
}));

const { storageManager } = await import(
  '../../../src/main/storage-manager.js',
);

const { imageProcessorService } = await import(
  '../../../src/main/services/image-processor.js',
);

const { UploadService } = await import(
  '../../../src/main/services/upload-service.js',
);

describe('UploadService', () => {
  let service: InstanceType<typeof UploadService>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UploadService();
  });

  describe('uploadImage', () => {
    it('ストレージ未初期化時にエラー結果を返す', async () => {
      vi.mocked(storageManager.isInitialized).mockReturnValue(false);

      const result = await service.uploadImage({
        data: Buffer.from('test'),
        filename: 'test.jpg',
        mimetype: 'image/jpeg',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('STORAGE_NOT_INITIALIZED');
      }
    });

    it('無効な MIME タイプを拒否する', async () => {
      vi.mocked(storageManager.isInitialized).mockReturnValue(true);

      const result = await service.uploadImage({
        data: Buffer.from('test'),
        filename: 'test.txt',
        mimetype: 'text/plain',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('INVALID_MIME_TYPE');
        expect(result.message).toContain('text/plain');
      }
    });

    it.each([
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
    ])('許可された MIME タイプ %s を受け入れる', async (mimeType) => {
      vi.mocked(storageManager.isInitialized).mockReturnValue(true);
      vi.mocked(storageManager.saveFile)
        .mockResolvedValueOnce({ filename: 'abc.jpg', path: 'originals/abc.jpg' })
        .mockResolvedValueOnce({ filename: 'abc.jpg', path: 'thumbnails/abc.jpg' });
      vi.mocked(imageProcessorService.getMetadata).mockResolvedValue({ width: 100, height: 200 });
      vi.mocked(imageProcessorService.generateThumbnail).mockResolvedValue(Buffer.from('thumb'));

      const result = await service.uploadImage({
        data: Buffer.from('test'),
        filename: 'test.jpg',
        mimetype: mimeType,
      });

      expect(result.success).toBe(true);
    });

    it('正常にアップロードできる', async () => {
      vi.mocked(storageManager.isInitialized).mockReturnValue(true);
      vi.mocked(storageManager.saveFile)
        .mockResolvedValueOnce({ filename: 'abc.jpg', path: 'originals/abc.jpg' })
        .mockResolvedValueOnce({ filename: 'abc.jpg', path: 'thumbnails/abc.jpg' });
      vi.mocked(imageProcessorService.getMetadata).mockResolvedValue({ width: 800, height: 600 });
      vi.mocked(imageProcessorService.generateThumbnail).mockResolvedValue(Buffer.from('thumb'));

      const data = Buffer.from('image-data');
      const result = await service.uploadImage({
        data,
        filename: 'photo.jpg',
        mimetype: 'image/jpeg',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.path).toBe('originals/abc.jpg');
        expect(result.thumbnailPath).toBe('thumbnails/abc.jpg');
        expect(result.mimeType).toBe('image/jpeg');
        expect(result.size).toBe(data.length);
        expect(result.width).toBe(800);
        expect(result.height).toBe(600);
      }
    });

    it('ファイル名から拡張子を使用する', async () => {
      vi.mocked(storageManager.isInitialized).mockReturnValue(true);
      vi.mocked(storageManager.saveFile)
        .mockResolvedValueOnce({ filename: 'abc.png', path: 'originals/abc.png' })
        .mockResolvedValueOnce({ filename: 'abc.jpg', path: 'thumbnails/abc.jpg' });
      vi.mocked(imageProcessorService.getMetadata).mockResolvedValue({ width: 100, height: 100 });
      vi.mocked(imageProcessorService.generateThumbnail).mockResolvedValue(Buffer.from('thumb'));

      await service.uploadImage({
        data: Buffer.from('test'),
        filename: 'photo.PNG',
        mimetype: 'image/png',
      });

      // saveFile の最初の呼び出し（オリジナル）で拡張子が小文字になる
      expect(storageManager.saveFile).toHaveBeenCalledWith(
        expect.any(Buffer) as Buffer,
        expect.objectContaining({ extension: '.png' }),
      );
    });

    it('ファイル名に拡張子がない場合は MIME タイプから拡張子を決定する', async () => {
      vi.mocked(storageManager.isInitialized).mockReturnValue(true);
      vi.mocked(storageManager.saveFile)
        .mockResolvedValueOnce({ filename: 'abc.jpg', path: 'originals/abc.jpg' })
        .mockResolvedValueOnce({ filename: 'abc.jpg', path: 'thumbnails/abc.jpg' });
      vi.mocked(imageProcessorService.getMetadata).mockResolvedValue({ width: 100, height: 100 });
      vi.mocked(imageProcessorService.generateThumbnail).mockResolvedValue(Buffer.from('thumb'));

      await service.uploadImage({
        data: Buffer.from('test'),
        filename: 'photo',
        mimetype: 'image/jpeg',
      });

      expect(storageManager.saveFile).toHaveBeenCalledWith(
        expect.any(Buffer) as Buffer,
        expect.objectContaining({ extension: '.jpg' }),
      );
    });

    it('サムネイル生成失敗時にオリジナルファイルをクリーンアップする', async () => {
      vi.mocked(storageManager.isInitialized).mockReturnValue(true);
      vi.mocked(storageManager.saveFile).mockResolvedValueOnce({
        filename: 'abc.jpg',
        path: 'originals/abc.jpg',
      });
      vi.mocked(imageProcessorService.getMetadata).mockResolvedValue({ width: 100, height: 100 });
      vi.mocked(imageProcessorService.generateThumbnail).mockRejectedValue(new Error('sharp error'));
      vi.mocked(storageManager.deleteFile).mockResolvedValue(undefined);

      await expect(
        service.uploadImage({
          data: Buffer.from('test'),
          filename: 'bad.jpg',
          mimetype: 'image/jpeg',
        }),
      ).rejects.toThrow('Failed to process image for upload');

      expect(storageManager.deleteFile).toHaveBeenCalledWith('originals/abc.jpg');
    });

    it('メタデータ取得失敗時にオリジナルファイルをクリーンアップする', async () => {
      vi.mocked(storageManager.isInitialized).mockReturnValue(true);
      vi.mocked(storageManager.saveFile).mockResolvedValueOnce({
        filename: 'abc.jpg',
        path: 'originals/abc.jpg',
      });
      vi.mocked(imageProcessorService.getMetadata).mockRejectedValue(new Error('corrupt image'));
      vi.mocked(storageManager.deleteFile).mockResolvedValue(undefined);

      await expect(
        service.uploadImage({
          data: Buffer.from('test'),
          filename: 'corrupt.jpg',
          mimetype: 'image/jpeg',
        }),
      ).rejects.toThrow('Failed to process image for upload');

      expect(storageManager.deleteFile).toHaveBeenCalledWith('originals/abc.jpg');
    });

    it('クリーンアップ失敗時でもエラーを投げる', async () => {
      vi.mocked(storageManager.isInitialized).mockReturnValue(true);
      vi.mocked(storageManager.saveFile).mockResolvedValueOnce({
        filename: 'abc.jpg',
        path: 'originals/abc.jpg',
      });
      vi.mocked(imageProcessorService.getMetadata).mockRejectedValue(new Error('corrupt'));
      vi.mocked(storageManager.deleteFile).mockRejectedValue(new Error('cleanup failed'));

      await expect(
        service.uploadImage({
          data: Buffer.from('test'),
          filename: 'test.jpg',
          mimetype: 'image/jpeg',
        }),
      ).rejects.toThrow('Failed to process image for upload');
    });
  });

  describe('getDataUrl', () => {
    it('JPEG ファイルのデータ URL を生成する', async () => {
      const buffer = Buffer.from('jpeg-data');
      vi.mocked(storageManager.readFile).mockResolvedValue(buffer);

      const result = await service.getDataUrl('originals/test.jpg');

      const expected = `data:image/jpeg;base64,${buffer.toString('base64')}`;
      expect(result).toBe(expected);
    });

    it('PNG ファイルのデータ URL を生成する', async () => {
      const buffer = Buffer.from('png-data');
      vi.mocked(storageManager.readFile).mockResolvedValue(buffer);

      const result = await service.getDataUrl('originals/test.png');

      expect(result).toContain('data:image/png;base64,');
    });

    it('不明な拡張子は application/octet-stream を使用する', async () => {
      const buffer = Buffer.from('unknown-data');
      vi.mocked(storageManager.readFile).mockResolvedValue(buffer);

      const result = await service.getDataUrl('originals/test.xyz');

      expect(result).toContain('data:application/octet-stream;base64,');
    });

    it('大文字の拡張子も正しく処理する', async () => {
      const buffer = Buffer.from('jpeg-data');
      vi.mocked(storageManager.readFile).mockResolvedValue(buffer);

      const result = await service.getDataUrl('originals/test.JPG');

      expect(result).toContain('data:image/jpeg;base64,');
    });
  });
});

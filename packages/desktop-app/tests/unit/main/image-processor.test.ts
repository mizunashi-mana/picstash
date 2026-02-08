import { beforeEach, describe, expect, it, vi } from 'vitest';

// sharp モック
const mockMetadata = vi.fn();
const mockResize = vi.fn();
const mockJpeg = vi.fn();
const mockToBuffer = vi.fn();

vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    metadata: mockMetadata,
    resize: mockResize,
  })),
}));

// チェーンメソッドのセットアップ
mockResize.mockReturnValue({ jpeg: mockJpeg });
mockJpeg.mockReturnValue({ toBuffer: mockToBuffer });

const { ImageProcessorService } = await import(
  '../../../src/main/services/image-processor.js',
);

describe('ImageProcessorService', () => {
  let service: InstanceType<typeof ImageProcessorService>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ImageProcessorService();

    // チェーンメソッドのリセット
    mockResize.mockReturnValue({ jpeg: mockJpeg });
    mockJpeg.mockReturnValue({ toBuffer: mockToBuffer });
  });

  describe('getMetadata', () => {
    it('画像のメタデータを正常に取得する', async () => {
      mockMetadata.mockResolvedValue({ width: 1920, height: 1080 });

      const result = await service.getMetadata(Buffer.from('test-image'));

      expect(result).toEqual({ width: 1920, height: 1080 });
    });

    it('width が undefined の場合はエラーを投げる', async () => {
      mockMetadata.mockResolvedValue({ width: undefined, height: 1080 });

      await expect(service.getMetadata(Buffer.from('test'))).rejects.toThrow(
        'Unable to determine image dimensions from file',
      );
    });

    it('height が undefined の場合はエラーを投げる', async () => {
      mockMetadata.mockResolvedValue({ width: 1920, height: undefined });

      await expect(service.getMetadata(Buffer.from('test'))).rejects.toThrow(
        'Unable to determine image dimensions from file',
      );
    });

    it('width と height の両方が undefined の場合はエラーを投げる', async () => {
      mockMetadata.mockResolvedValue({ width: undefined, height: undefined });

      await expect(service.getMetadata(Buffer.from('test'))).rejects.toThrow(
        'Unable to determine image dimensions from file',
      );
    });
  });

  describe('generateThumbnail', () => {
    it('サムネイルを正常に生成する', async () => {
      const thumbnailBuffer = Buffer.from('thumbnail-data');
      mockToBuffer.mockResolvedValue(thumbnailBuffer);

      const result = await service.generateThumbnail(Buffer.from('test-image'));

      expect(result).toBe(thumbnailBuffer);
      expect(mockResize).toHaveBeenCalledWith(300, 300, {
        fit: 'cover',
        position: 'center',
      });
      expect(mockJpeg).toHaveBeenCalledWith({ quality: 80 });
    });
  });
});

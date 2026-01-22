import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock node:fs/promises
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

// Track mock state
let mockWorker: {
  recognize: ReturnType<typeof vi.fn>;
  terminate: ReturnType<typeof vi.fn>;
};

// Mock tesseract.js
vi.mock('tesseract.js', () => ({
  createWorker: vi.fn().mockImplementation(async () => {
    return await Promise.resolve(mockWorker);
  }),
}));

describe('TesseractOcrService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Reset mock worker
    mockWorker = {
      recognize: vi.fn().mockResolvedValue({
        data: {
          text: 'test ocr text',
          confidence: 85,
        },
      }),
      terminate: vi.fn().mockResolvedValue(undefined),
    };
  });

  describe('extractTextFromBuffer', () => {
    it('should extract text from image buffer', async () => {
      const { TesseractOcrService } = await import(
        '@/infra/ocr/tesseract-ocr-service',
      );

      mockWorker.recognize.mockResolvedValue({
        data: {
          text: 'Hello World',
          confidence: 90,
        },
      });

      const service = new TesseractOcrService();
      const result = await service.extractTextFromBuffer(Buffer.from('fake image'));

      expect(result.text).toBe('Hello World');
      expect(result.confidence).toBe(0.9); // Converted to 0-1 scale
      expect(mockWorker.recognize).toHaveBeenCalled();
    });

    it('should return empty text when confidence is below threshold (30%)', async () => {
      const { TesseractOcrService } = await import(
        '@/infra/ocr/tesseract-ocr-service',
      );

      mockWorker.recognize.mockResolvedValue({
        data: {
          text: 'low confidence text',
          confidence: 25, // Below 30% threshold
        },
      });

      const service = new TesseractOcrService();
      const result = await service.extractTextFromBuffer(Buffer.from('fake image'));

      expect(result.text).toBe('');
      expect(result.confidence).toBe(0);
    });

    it('should accept text at exactly 30% confidence', async () => {
      const { TesseractOcrService } = await import(
        '@/infra/ocr/tesseract-ocr-service',
      );

      mockWorker.recognize.mockResolvedValue({
        data: {
          text: 'threshold text',
          confidence: 30,
        },
      });

      const service = new TesseractOcrService();
      const result = await service.extractTextFromBuffer(Buffer.from('fake image'));

      expect(result.text).toBe('threshold text');
      expect(result.confidence).toBe(0.3);
    });

    it('should clean text by normalizing line breaks', async () => {
      const { TesseractOcrService } = await import(
        '@/infra/ocr/tesseract-ocr-service',
      );

      mockWorker.recognize.mockResolvedValue({
        data: {
          text: 'line1\r\nline2\r\nline3',
          confidence: 80,
        },
      });

      const service = new TesseractOcrService();
      const result = await service.extractTextFromBuffer(Buffer.from('fake image'));

      expect(result.text).toBe('line1\nline2\nline3');
    });

    it('should clean text by removing excessive line breaks', async () => {
      const { TesseractOcrService } = await import(
        '@/infra/ocr/tesseract-ocr-service',
      );

      mockWorker.recognize.mockResolvedValue({
        data: {
          text: 'line1\n\n\n\nline2',
          confidence: 80,
        },
      });

      const service = new TesseractOcrService();
      const result = await service.extractTextFromBuffer(Buffer.from('fake image'));

      expect(result.text).toBe('line1\n\nline2');
    });

    it('should clean text by trimming whitespace from lines', async () => {
      const { TesseractOcrService } = await import(
        '@/infra/ocr/tesseract-ocr-service',
      );

      mockWorker.recognize.mockResolvedValue({
        data: {
          text: '  line1  \n  line2  ',
          confidence: 80,
        },
      });

      const service = new TesseractOcrService();
      const result = await service.extractTextFromBuffer(Buffer.from('fake image'));

      expect(result.text).toBe('line1\nline2');
    });
  });

  describe('extractText', () => {
    it('should read file and extract text', async () => {
      const { TesseractOcrService } = await import(
        '@/infra/ocr/tesseract-ocr-service',
      );

      vi.mocked(readFile).mockResolvedValue(Buffer.from('fake image data'));
      mockWorker.recognize.mockResolvedValue({
        data: {
          text: 'text from file',
          confidence: 85,
        },
      });

      const service = new TesseractOcrService();
      const result = await service.extractText('/path/to/image.png');

      expect(readFile).toHaveBeenCalledWith('/path/to/image.png');
      expect(result.text).toBe('text from file');
    });

    it('should throw error when file read fails', async () => {
      const { TesseractOcrService } = await import(
        '@/infra/ocr/tesseract-ocr-service',
      );

      vi.mocked(readFile).mockRejectedValue(new Error('File not found'));

      const service = new TesseractOcrService();
      await expect(service.extractText('/nonexistent/image.png')).rejects.toThrow(
        'File not found',
      );
    });
  });

  describe('isReady', () => {
    it('should return false before initialization', async () => {
      const { TesseractOcrService } = await import(
        '@/infra/ocr/tesseract-ocr-service',
      );

      const service = new TesseractOcrService();
      expect(service.isReady()).toBe(false);
    });

    it('should return true after initialization', async () => {
      const { TesseractOcrService } = await import(
        '@/infra/ocr/tesseract-ocr-service',
      );

      const service = new TesseractOcrService();
      await service.initialize();

      expect(service.isReady()).toBe(true);
    });
  });

  describe('initialize', () => {
    it('should only initialize once even when called concurrently', async () => {
      const { TesseractOcrService } = await import(
        '@/infra/ocr/tesseract-ocr-service',
      );

      const tesseract = await import('tesseract.js');

      const service = new TesseractOcrService();
      await Promise.all([service.initialize(), service.initialize(), service.initialize()]);

      expect(tesseract.createWorker).toHaveBeenCalledTimes(1);
    });

    it('should skip initialization if already ready', async () => {
      const { TesseractOcrService } = await import(
        '@/infra/ocr/tesseract-ocr-service',
      );

      const tesseract = await import('tesseract.js');

      const service = new TesseractOcrService();
      await service.initialize();

      const callCount = vi.mocked(tesseract.createWorker).mock.calls.length;

      await service.initialize();
      expect(tesseract.createWorker).toHaveBeenCalledTimes(callCount);
    });
  });

  describe('terminate', () => {
    it('should terminate worker when initialized', async () => {
      const { TesseractOcrService } = await import(
        '@/infra/ocr/tesseract-ocr-service',
      );

      const service = new TesseractOcrService();
      await service.initialize();

      expect(service.isReady()).toBe(true);

      await service.terminate();

      expect(mockWorker.terminate).toHaveBeenCalled();
      expect(service.isReady()).toBe(false);
    });

    it('should do nothing when not initialized', async () => {
      const { TesseractOcrService } = await import(
        '@/infra/ocr/tesseract-ocr-service',
      );

      const service = new TesseractOcrService();

      // Should not throw
      await service.terminate();

      expect(mockWorker.terminate).not.toHaveBeenCalled();
    });
  });
});

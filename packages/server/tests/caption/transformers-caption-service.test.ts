import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock node:fs/promises
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

// Track mock state
let mockFlorence2Model: {
  generate: ReturnType<typeof vi.fn>;
};
let mockFlorence2Processor: ReturnType<typeof vi.fn> & {
  construct_prompts: ReturnType<typeof vi.fn>;
  batch_decode: ReturnType<typeof vi.fn>;
  post_process_generation: ReturnType<typeof vi.fn>;
};
let mockTranslationPipeline: ReturnType<typeof vi.fn>;
let mockRawImageFromBlob: ReturnType<typeof vi.fn>;

// Mock the @huggingface/transformers module
vi.mock('@huggingface/transformers', () => ({
  Florence2ForConditionalGeneration: {
    from_pretrained: vi.fn().mockImplementation(async () => {
      return await Promise.resolve(mockFlorence2Model);
    }),
  },
  AutoProcessor: {
    from_pretrained: vi.fn().mockImplementation(async () => {
      return await Promise.resolve(mockFlorence2Processor);
    }),
  },
  pipeline: vi.fn().mockImplementation(async (task: string) => {
    if (task === 'translation') {
      return await Promise.resolve(mockTranslationPipeline);
    }
    throw new Error(`Unknown task: ${task}`);
  }),
  RawImage: {
    get fromBlob() {
      return mockRawImageFromBlob;
    },
  },
}));

describe('TransformersCaptionService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset module-level state by reimporting
    vi.resetModules();

    // Recreate mock functions for Florence-2
    mockFlorence2Model = {
      generate: vi.fn().mockResolvedValue([[1, 2, 3]]),
    };

    // Create processor mock as a callable function with additional methods
    const processorFn = vi.fn().mockResolvedValue({
      input_ids: [[1, 2, 3]],
      pixel_values: [[[1, 2, 3]]],
    });
    mockFlorence2Processor = Object.assign(processorFn, {
      construct_prompts: vi.fn().mockReturnValue('<MORE_DETAILED_CAPTION>'),
      batch_decode: vi.fn().mockReturnValue(['test caption']),
      post_process_generation: vi.fn().mockReturnValue({
        '<MORE_DETAILED_CAPTION>': 'a cat sitting on a couch',
      }),
    });

    mockTranslationPipeline = vi.fn().mockResolvedValue([{ translation_text: 'テストキャプション' }]);
    mockRawImageFromBlob = vi.fn().mockResolvedValue({
      data: new Uint8ClampedArray(100),
      width: 10,
      height: 10,
    });
  });

  describe('generateFromBuffer', () => {
    it('should generate caption and translate to Japanese', async () => {
      const { TransformersCaptionService } = (await import(
        '@/infra/caption/transformers-caption-service',
      ));

      mockFlorence2Processor.post_process_generation.mockReturnValue({
        '<MORE_DETAILED_CAPTION>': 'a cat sitting on a couch',
      });
      mockTranslationPipeline.mockResolvedValue([{ translation_text: 'ソファに座っている猫' }]);

      const service = new TransformersCaptionService();
      const result = await service.generateFromBuffer(Buffer.from('fake image data'));

      expect(result.caption).toBe('ソファに座っている猫');
      expect(result.model).toContain('Florence-2');
      expect(result.model).toContain('nllb-200-distilled-600M');
    });

    it('should return English caption when translation fails', async () => {
      const { TransformersCaptionService } = (await import(
        '@/infra/caption/transformers-caption-service',
      ));

      mockFlorence2Processor.post_process_generation.mockReturnValue({
        '<MORE_DETAILED_CAPTION>': 'a dog running',
      });
      mockTranslationPipeline.mockResolvedValue([]);

      const service = new TransformersCaptionService();
      const result = await service.generateFromBuffer(Buffer.from('fake image data'));

      expect(result.caption).toBe('a dog running');
    });

    it('should handle empty caption result', async () => {
      const { TransformersCaptionService } = (await import(
        '@/infra/caption/transformers-caption-service',
      ));

      mockFlorence2Processor.post_process_generation.mockReturnValue({
        '<MORE_DETAILED_CAPTION>': '',
      });
      mockTranslationPipeline.mockResolvedValue([]);

      const service = new TransformersCaptionService();
      const result = await service.generateFromBuffer(Buffer.from('fake image data'));

      expect(result.caption).toBe('');
    });
  });

  describe('generateFromFile', () => {
    it('should read file and generate caption', async () => {
      const { TransformersCaptionService } = (await import(
        '@/infra/caption/transformers-caption-service',
      ));

      mockFlorence2Processor.post_process_generation.mockReturnValue({
        '<MORE_DETAILED_CAPTION>': 'a beautiful sunset',
      });
      mockTranslationPipeline.mockResolvedValue([{ translation_text: '美しい夕日' }]);
      vi.mocked(readFile).mockResolvedValue(Buffer.from('fake image data'));

      const service = new TransformersCaptionService();
      const result = await service.generateFromFile('/path/to/image.jpg');

      expect(readFile).toHaveBeenCalledWith('/path/to/image.jpg');
      expect(result.caption).toBe('美しい夕日');
    });

    it('should throw error when file read fails', async () => {
      const { TransformersCaptionService } = (await import(
        '@/infra/caption/transformers-caption-service',
      ));

      vi.mocked(readFile).mockRejectedValue(new Error('File not found'));

      const service = new TransformersCaptionService();
      await expect(service.generateFromFile('/nonexistent/image.jpg')).rejects.toThrow(
        'File not found',
      );
    });
  });

  describe('getModel', () => {
    it('should return model identifier', async () => {
      const { TransformersCaptionService } = (await import(
        '@/infra/caption/transformers-caption-service',
      ));

      const service = new TransformersCaptionService();
      const model = service.getModel();

      expect(model).toContain('Florence-2');
      expect(model).toContain('nllb-200-distilled-600M');
    });
  });

  describe('isReady', () => {
    it('should return false before initialization', async () => {
      const { TransformersCaptionService } = (await import(
        '@/infra/caption/transformers-caption-service',
      ));

      const service = new TransformersCaptionService();
      expect(service.isReady()).toBe(false);
    });

    it('should return true after initialization', async () => {
      const { TransformersCaptionService } = (await import(
        '@/infra/caption/transformers-caption-service',
      ));

      const service = new TransformersCaptionService();
      await service.initialize();

      expect(service.isReady()).toBe(true);
    });
  });

  describe('initialize', () => {
    it('should only initialize once even when called concurrently', async () => {
      const { TransformersCaptionService } = (await import(
        '@/infra/caption/transformers-caption-service',
      ));

      const transformers = await import('@huggingface/transformers');

      const service = new TransformersCaptionService();
      await Promise.all([service.initialize(), service.initialize(), service.initialize()]);

      // Florence2ForConditionalGeneration.from_pretrained should be called once
      expect(transformers.Florence2ForConditionalGeneration.from_pretrained).toHaveBeenCalledTimes(1);
      // AutoProcessor.from_pretrained should be called once
      expect(transformers.AutoProcessor.from_pretrained).toHaveBeenCalledTimes(1);
      // pipeline should be called once (for translation only)
      expect(transformers.pipeline).toHaveBeenCalledTimes(1);
    });

    it('should skip initialization if already ready', async () => {
      const { TransformersCaptionService } = (await import(
        '@/infra/caption/transformers-caption-service',
      ));

      const transformers = await import('@huggingface/transformers');

      const service = new TransformersCaptionService();
      await service.initialize();

      const callCount = vi.mocked(transformers.pipeline).mock.calls.length;

      // Second initialization should be a no-op
      await service.initialize();
      expect(transformers.pipeline).toHaveBeenCalledTimes(callCount);
    });
  });
});

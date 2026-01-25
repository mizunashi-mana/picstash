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
        '@picstash/core'
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
        '@picstash/core',
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
        '@picstash/core',
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
        '@picstash/core',
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
        '@picstash/core',
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
        '@picstash/core',
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
        '@picstash/core',
      ));

      const service = new TransformersCaptionService();
      expect(service.isReady()).toBe(false);
    });

    it('should return true after initialization', async () => {
      const { TransformersCaptionService } = (await import(
        '@picstash/core',
      ));

      const service = new TransformersCaptionService();
      await service.initialize();

      expect(service.isReady()).toBe(true);
    });
  });

  describe('initialize', () => {
    it('should only initialize once even when called concurrently', async () => {
      const { TransformersCaptionService } = (await import(
        '@picstash/core',
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
        '@picstash/core',
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

  describe('generateWithContext', () => {
    it('should fall back to basic generation when context is empty', async () => {
      const { TransformersCaptionService } = (await import(
        '@picstash/core',
      ));

      mockFlorence2Processor.post_process_generation.mockReturnValue({
        '<MORE_DETAILED_CAPTION>': 'a cat sitting',
      });
      mockTranslationPipeline.mockResolvedValue([{ translation_text: '座っている猫' }]);
      vi.mocked(readFile).mockResolvedValue(Buffer.from('fake image data'));

      const service = new TransformersCaptionService();
      const result = await service.generateWithContext('/path/to/image.jpg', {
        similarDescriptions: [],
      });

      expect(result.caption).toBe('座っている猫');
      expect(result.model).toContain('Florence-2');
      expect(result.model).not.toContain('llama');
    });

    it('should fall back to basic generation when llmService is undefined', async () => {
      const { TransformersCaptionService } = (await import(
        '@picstash/core',
      ));

      mockFlorence2Processor.post_process_generation.mockReturnValue({
        '<MORE_DETAILED_CAPTION>': 'a dog running',
      });
      mockTranslationPipeline.mockResolvedValue([{ translation_text: '走っている犬' }]);
      vi.mocked(readFile).mockResolvedValue(Buffer.from('fake image data'));

      // Service without LLM injection
      const service = new TransformersCaptionService();
      const result = await service.generateWithContext('/path/to/image.jpg', {
        similarDescriptions: [{ description: 'similar image', similarity: 0.9 }],
      });

      expect(result.caption).toBe('走っている犬');
      expect(result.model).not.toContain('llama');
    });

    it('should fall back to basic generation when llmService is not available', async () => {
      const { TransformersCaptionService } = (await import(
        '@picstash/core',
      ));

      mockFlorence2Processor.post_process_generation.mockReturnValue({
        '<MORE_DETAILED_CAPTION>': 'a bird flying',
      });
      mockTranslationPipeline.mockResolvedValue([{ translation_text: '飛んでいる鳥' }]);
      vi.mocked(readFile).mockResolvedValue(Buffer.from('fake image data'));

      const mockLlmService = {
        generate: vi.fn(),
        getModel: vi.fn().mockReturnValue('test-model'),
        isAvailable: vi.fn().mockResolvedValue(false),
      };

      const service = new TransformersCaptionService(mockLlmService);
      const result = await service.generateWithContext('/path/to/image.jpg', {
        similarDescriptions: [{ description: 'similar image', similarity: 0.9 }],
      });

      expect(result.caption).toBe('飛んでいる鳥');
      expect(mockLlmService.isAvailable).toHaveBeenCalled();
      expect(mockLlmService.generate).not.toHaveBeenCalled();
    });

    it('should use LLM to refine caption when available with context', async () => {
      const { TransformersCaptionService } = (await import(
        '@picstash/core',
      ));

      mockFlorence2Processor.post_process_generation.mockReturnValue({
        '<MORE_DETAILED_CAPTION>': 'a character illustration',
      });
      mockTranslationPipeline.mockResolvedValue([{ translation_text: 'キャラクターイラスト' }]);
      vi.mocked(readFile).mockResolvedValue(Buffer.from('fake image data'));

      const mockLlmService = {
        generate: vi.fn().mockResolvedValue({
          text: '初音ミクのイラストです。',
          model: 'llama3.2',
        }),
        getModel: vi.fn().mockReturnValue('llama3.2'),
        isAvailable: vi.fn().mockResolvedValue(true),
      };

      const service = new TransformersCaptionService(mockLlmService);
      const result = await service.generateWithContext('/path/to/image.jpg', {
        similarDescriptions: [
          { description: '初音ミクが歌っている', similarity: 0.85 },
          { description: 'ボーカロイドのイラスト', similarity: 0.7 },
        ],
      });

      expect(result.caption).toBe('初音ミクのイラストです。');
      expect(result.model).toContain('llama3.2');
      expect(mockLlmService.generate).toHaveBeenCalledWith(
        expect.stringContaining('キャラクターイラスト'),
        expect.objectContaining({ maxTokens: 256 }),
      );
    });

    it('should fall back to base result when LLM generation fails', async () => {
      const { TransformersCaptionService } = (await import(
        '@picstash/core',
      ));

      mockFlorence2Processor.post_process_generation.mockReturnValue({
        '<MORE_DETAILED_CAPTION>': 'a flower',
      });
      mockTranslationPipeline.mockResolvedValue([{ translation_text: '花' }]);
      vi.mocked(readFile).mockResolvedValue(Buffer.from('fake image data'));

      const mockLlmService = {
        generate: vi.fn().mockRejectedValue(new Error('LLM API error')),
        getModel: vi.fn().mockReturnValue('llama3.2'),
        isAvailable: vi.fn().mockResolvedValue(true),
      };

      // Spy on console.error to suppress output during test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const service = new TransformersCaptionService(mockLlmService);
      const result = await service.generateWithContext('/path/to/image.jpg', {
        similarDescriptions: [{ description: 'similar flower', similarity: 0.8 }],
      });

      expect(result.caption).toBe('花');
      expect(result.model).not.toContain('llama');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should use LLM when only OCR text is provided (no similar descriptions)', async () => {
      const { TransformersCaptionService } = (await import(
        '@picstash/core',
      ));

      mockFlorence2Processor.post_process_generation.mockReturnValue({
        '<MORE_DETAILED_CAPTION>': 'a manga page',
      });
      mockTranslationPipeline.mockResolvedValue([{ translation_text: '漫画のページ' }]);
      vi.mocked(readFile).mockResolvedValue(Buffer.from('fake image data'));

      const mockLlmService = {
        generate: vi.fn().mockResolvedValue({
          text: '「おはよう」と話すキャラクターの漫画ページです。',
          model: 'llama3.2',
        }),
        getModel: vi.fn().mockReturnValue('llama3.2'),
        isAvailable: vi.fn().mockResolvedValue(true),
      };

      const service = new TransformersCaptionService(mockLlmService);
      const result = await service.generateWithContext('/path/to/image.jpg', {
        similarDescriptions: [],
        ocrText: 'おはよう',
      });

      expect(result.caption).toBe('「おはよう」と話すキャラクターの漫画ページです。');
      expect(result.model).toContain('llama3.2');
      expect(mockLlmService.generate).toHaveBeenCalled();
    });

    it('should include OCR text section in LLM prompt', async () => {
      const { TransformersCaptionService } = (await import(
        '@picstash/core',
      ));

      mockFlorence2Processor.post_process_generation.mockReturnValue({
        '<MORE_DETAILED_CAPTION>': 'a character illustration',
      });
      mockTranslationPipeline.mockResolvedValue([{ translation_text: 'キャラクターイラスト' }]);
      vi.mocked(readFile).mockResolvedValue(Buffer.from('fake image data'));

      const mockLlmService = {
        generate: vi.fn().mockResolvedValue({
          text: '「今日は天気がいい」と話すキャラクターのイラストです。',
          model: 'llama3.2',
        }),
        getModel: vi.fn().mockReturnValue('llama3.2'),
        isAvailable: vi.fn().mockResolvedValue(true),
      };

      const service = new TransformersCaptionService(mockLlmService);
      await service.generateWithContext('/path/to/image.jpg', {
        similarDescriptions: [{ description: 'similar image', similarity: 0.8 }],
        ocrText: '今日は天気がいい',
      });

      // Verify that OCR text is included in the prompt
      expect(mockLlmService.generate).toHaveBeenCalledWith(
        expect.stringContaining('OCRで読み取ったテキスト'),
        expect.any(Object),
      );
      expect(mockLlmService.generate).toHaveBeenCalledWith(
        expect.stringContaining('今日は天気がいい'),
        expect.any(Object),
      );
    });

    it('should not include OCR section when ocrText is empty', async () => {
      const { TransformersCaptionService } = (await import(
        '@picstash/core',
      ));

      mockFlorence2Processor.post_process_generation.mockReturnValue({
        '<MORE_DETAILED_CAPTION>': 'a character illustration',
      });
      mockTranslationPipeline.mockResolvedValue([{ translation_text: 'キャラクターイラスト' }]);
      vi.mocked(readFile).mockResolvedValue(Buffer.from('fake image data'));

      const mockLlmService = {
        generate: vi.fn().mockResolvedValue({
          text: 'キャラクターのイラストです。',
          model: 'llama3.2',
        }),
        getModel: vi.fn().mockReturnValue('llama3.2'),
        isAvailable: vi.fn().mockResolvedValue(true),
      };

      const service = new TransformersCaptionService(mockLlmService);
      await service.generateWithContext('/path/to/image.jpg', {
        similarDescriptions: [{ description: 'similar image', similarity: 0.8 }],
        ocrText: '   ', // Empty/whitespace only
      });

      // Verify that OCR section is NOT included in the prompt
      expect(mockLlmService.generate).toHaveBeenCalledWith(
        expect.not.stringContaining('OCRで読み取ったテキスト'),
        expect.any(Object),
      );
    });
  });
});

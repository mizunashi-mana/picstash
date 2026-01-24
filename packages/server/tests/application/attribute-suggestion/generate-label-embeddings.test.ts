import 'reflect-metadata';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  generateLabelEmbedding,
  generateMissingLabelEmbeddings,
  regenerateAllLabelEmbeddings,
  type GenerateLabelEmbeddingDeps,
} from '@/application/attribute-suggestion/generate-label-embeddings';
import type { EmbeddingService, EmbeddingResult } from '@/application/ports/embedding-service';
import type { Label, LabelRepository } from '@/application/ports/label-repository';

function createMockLabel(overrides: Partial<Label> = {}): Label {
  return {
    id: 'test-label-id',
    name: 'Test Label',
    color: '#ff0000',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockEmbeddingResult(): EmbeddingResult {
  return {
    embedding: new Float32Array(512).fill(0.1),
    dimension: 512,
    model: 'openai/clip-vit-base-patch16',
  };
}

function createMockDeps(): GenerateLabelEmbeddingDeps {
  const mockLabelRepository: LabelRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findByName: vi.fn(),
    findAll: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn(),
    findAllWithEmbedding: vi.fn(),
    findIdsWithoutEmbedding: vi.fn(),
    updateEmbedding: vi.fn(),
    clearAllEmbeddings: vi.fn(),
    countWithEmbedding: vi.fn(),
  };

  const mockEmbeddingService: EmbeddingService = {
    generateFromFile: vi.fn(),
    generateFromBuffer: vi.fn(),
    generateFromText: vi.fn(),
    getDimension: vi.fn().mockReturnValue(512),
    getModel: vi.fn().mockReturnValue('openai/clip-vit-base-patch16'),
    isReady: vi.fn().mockReturnValue(true),
    initialize: vi.fn(),
  };

  return {
    labelRepository: mockLabelRepository,
    embeddingService: mockEmbeddingService,
  };
}

describe('generateLabelEmbedding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success case', () => {
    it('should generate embedding and store it', async () => {
      const deps = createMockDeps();
      const mockLabel = createMockLabel();
      const mockEmbeddingResult = createMockEmbeddingResult();

      vi.mocked(deps.labelRepository.findById).mockResolvedValue(mockLabel);
      vi.mocked(deps.embeddingService.generateFromText).mockResolvedValue(mockEmbeddingResult);

      const result = await generateLabelEmbedding({ labelId: 'test-label-id' }, deps);

      expect(result).not.toBe('LABEL_NOT_FOUND');
      expect(result).not.toBe('EMBEDDING_FAILED');
      expect(typeof result).toBe('object');

      if (typeof result === 'object') {
        expect(result.labelId).toBe('test-label-id');
        expect(result.labelName).toBe('Test Label');
        expect(result.dimension).toBe(512);
        expect(result.model).toBe('openai/clip-vit-base-patch16');
        expect(result.generatedAt).toBeInstanceOf(Date);
      }

      expect(deps.labelRepository.updateEmbedding).toHaveBeenCalledWith(
        'test-label-id',
        expect.objectContaining({

          embedding: expect.any(Buffer),

          embeddedAt: expect.any(Date),
        }),
      );
    });
  });

  describe('error cases', () => {
    it('should return LABEL_NOT_FOUND when label does not exist', async () => {
      const deps = createMockDeps();
      vi.mocked(deps.labelRepository.findById).mockResolvedValue(null);

      const result = await generateLabelEmbedding({ labelId: 'non-existent-id' }, deps);

      expect(result).toBe('LABEL_NOT_FOUND');
      expect(deps.embeddingService.generateFromText).not.toHaveBeenCalled();
      expect(deps.labelRepository.updateEmbedding).not.toHaveBeenCalled();
    });

    it('should return EMBEDDING_FAILED when embedding service fails', async () => {
      const deps = createMockDeps();
      const mockLabel = createMockLabel();

      vi.mocked(deps.labelRepository.findById).mockResolvedValue(mockLabel);
      vi.mocked(deps.embeddingService.generateFromText).mockRejectedValue(
        new Error('Model failed'),
      );

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await generateLabelEmbedding({ labelId: 'test-label-id' }, deps);

      expect(result).toBe('EMBEDDING_FAILED');
      expect(deps.labelRepository.updateEmbedding).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});

describe('generateMissingLabelEmbeddings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate embeddings for labels without embeddings', async () => {
    const deps = createMockDeps();
    const mockEmbeddingResult = createMockEmbeddingResult();

    vi.mocked(deps.labelRepository.findIdsWithoutEmbedding).mockResolvedValue([
      { id: 'label-1', name: 'Label 1' },
      { id: 'label-2', name: 'Label 2' },
    ]);
    vi.mocked(deps.labelRepository.findById)
      .mockResolvedValueOnce(createMockLabel({ id: 'label-1', name: 'Label 1' }))
      .mockResolvedValueOnce(createMockLabel({ id: 'label-2', name: 'Label 2' }));
    vi.mocked(deps.embeddingService.generateFromText).mockResolvedValue(mockEmbeddingResult);

    const result = await generateMissingLabelEmbeddings(deps);

    expect(result.total).toBe(2);
    expect(result.success).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.errors).toEqual([]);
  });

  it('should report errors for failed embeddings', async () => {
    const deps = createMockDeps();

    vi.mocked(deps.labelRepository.findIdsWithoutEmbedding).mockResolvedValue([
      { id: 'label-1', name: 'Label 1' },
    ]);
    vi.mocked(deps.labelRepository.findById).mockResolvedValue(null);

    const result = await generateMissingLabelEmbeddings(deps);

    expect(result.total).toBe(1);
    expect(result.success).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.labelId).toBe('label-1');
    expect(result.errors[0]?.error).toBe('LABEL_NOT_FOUND');
  });

  it('should call onProgress callback', async () => {
    const deps = createMockDeps();
    const mockEmbeddingResult = createMockEmbeddingResult();
    const onProgress = vi.fn();

    vi.mocked(deps.labelRepository.findIdsWithoutEmbedding).mockResolvedValue([
      { id: 'label-1', name: 'Label 1' },
      { id: 'label-2', name: 'Label 2' },
    ]);
    vi.mocked(deps.labelRepository.findById).mockResolvedValue(createMockLabel());
    vi.mocked(deps.embeddingService.generateFromText).mockResolvedValue(mockEmbeddingResult);

    await generateMissingLabelEmbeddings(deps, { onProgress });

    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenNthCalledWith(1, 1, 2, 'Label 1');
    expect(onProgress).toHaveBeenNthCalledWith(2, 2, 2, 'Label 2');
  });

  it('should return empty result when no labels without embeddings', async () => {
    const deps = createMockDeps();
    vi.mocked(deps.labelRepository.findIdsWithoutEmbedding).mockResolvedValue([]);

    const result = await generateMissingLabelEmbeddings(deps);

    expect(result.total).toBe(0);
    expect(result.success).toBe(0);
    expect(result.failed).toBe(0);
  });
});

describe('regenerateAllLabelEmbeddings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clear all embeddings and regenerate', async () => {
    const deps = createMockDeps();
    const mockEmbeddingResult = createMockEmbeddingResult();

    vi.mocked(deps.labelRepository.clearAllEmbeddings).mockResolvedValue();
    vi.mocked(deps.labelRepository.findIdsWithoutEmbedding).mockResolvedValue([
      { id: 'label-1', name: 'Label 1' },
    ]);
    vi.mocked(deps.labelRepository.findById).mockResolvedValue(createMockLabel());
    vi.mocked(deps.embeddingService.generateFromText).mockResolvedValue(mockEmbeddingResult);

    const result = await regenerateAllLabelEmbeddings(deps);

    expect(deps.labelRepository.clearAllEmbeddings).toHaveBeenCalled();
    expect(result.total).toBe(1);
    expect(result.success).toBe(1);
  });

  it('should call onProgress callback', async () => {
    const deps = createMockDeps();
    const mockEmbeddingResult = createMockEmbeddingResult();
    const onProgress = vi.fn();

    vi.mocked(deps.labelRepository.clearAllEmbeddings).mockResolvedValue();
    vi.mocked(deps.labelRepository.findIdsWithoutEmbedding).mockResolvedValue([
      { id: 'label-1', name: 'Label 1' },
    ]);
    vi.mocked(deps.labelRepository.findById).mockResolvedValue(createMockLabel());
    vi.mocked(deps.embeddingService.generateFromText).mockResolvedValue(mockEmbeddingResult);

    await regenerateAllLabelEmbeddings(deps, { onProgress });

    expect(onProgress).toHaveBeenCalledWith(1, 1, 'Label 1');
  });
});

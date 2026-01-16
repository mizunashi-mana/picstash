import 'reflect-metadata';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  suggestAttributes,
  type SuggestAttributesDeps,
} from '@/application/attribute-suggestion/suggest-attributes';
import type { EmbeddingRepository } from '@/application/ports/embedding-repository';
import type { ImageAttributeRepository } from '@/application/ports/image-attribute-repository';
import type { ImageRepository, ImageWithEmbedding } from '@/application/ports/image-repository';
import type { LabelRepository, LabelWithEmbedding } from '@/application/ports/label-repository';

function createMockImageRepository(): ImageRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    search: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn(),
    findIdsWithoutEmbedding: vi.fn(),
    findByIdWithEmbedding: vi.fn(),
    findWithEmbedding: vi.fn(),
    updateEmbedding: vi.fn(),
    clearAllEmbeddings: vi.fn(),
    count: vi.fn(),
    countWithEmbedding: vi.fn(),
  };
}

function createMockLabelRepository(): LabelRepository {
  return {
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
}

function createMockEmbeddingRepository(): EmbeddingRepository {
  return {
    upsert: vi.fn(),
    remove: vi.fn(),
    findSimilar: vi.fn().mockReturnValue([]),
    count: vi.fn(),
    close: vi.fn(),
  };
}

function createMockImageAttributeRepository(): ImageAttributeRepository {
  return {
    findById: vi.fn(),
    findByImageId: vi.fn().mockResolvedValue([]),
    findByImageAndLabel: vi.fn(),
    create: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn(),
  };
}

function createNormalizedEmbedding(values: number[]): Uint8Array {
  // Normalize the values
  let norm = 0;
  for (const v of values) {
    norm += v * v;
  }
  norm = Math.sqrt(norm);

  const normalized = values.map(v => v / norm);
  const float32 = new Float32Array(normalized);
  return new Uint8Array(float32.buffer);
}

describe('suggestAttributes', () => {
  let mockImageRepository: ImageRepository;
  let mockLabelRepository: LabelRepository;
  let mockEmbeddingRepository: EmbeddingRepository;
  let mockImageAttributeRepository: ImageAttributeRepository;
  let deps: SuggestAttributesDeps;

  beforeEach(() => {
    vi.clearAllMocks();
    mockImageRepository = createMockImageRepository();
    mockLabelRepository = createMockLabelRepository();
    mockEmbeddingRepository = createMockEmbeddingRepository();
    mockImageAttributeRepository = createMockImageAttributeRepository();
    deps = {
      imageRepository: mockImageRepository,
      labelRepository: mockLabelRepository,
      embeddingRepository: mockEmbeddingRepository,
      imageAttributeRepository: mockImageAttributeRepository,
    };
  });

  describe('success cases', () => {
    it('should return suggestions sorted by score', async () => {
      // Create embeddings that will produce predictable similarity scores
      // Image embedding: normalized [1, 0, 0, ..., 0] (512 dims)
      const imageEmbValues: number[] = new Array<number>(512).fill(0);
      imageEmbValues[0] = 1;
      const imageEmbedding = createNormalizedEmbedding(imageEmbValues);

      // Label 1: similar to image [0.9, 0.1, 0, ..., 0]
      const label1EmbValues: number[] = new Array<number>(512).fill(0);
      label1EmbValues[0] = 0.9;
      label1EmbValues[1] = 0.1;
      const label1Embedding = createNormalizedEmbedding(label1EmbValues);

      // Label 2: less similar [0.5, 0.5, 0, ..., 0]
      const label2EmbValues: number[] = new Array<number>(512).fill(0);
      label2EmbValues[0] = 0.5;
      label2EmbValues[1] = 0.5;
      const label2Embedding = createNormalizedEmbedding(label2EmbValues);

      const mockImageWithEmbedding: ImageWithEmbedding = {
        id: 'img-1',
        path: 'originals/test.png',
        embedding: imageEmbedding,
      };

      const mockLabelsWithEmbedding: LabelWithEmbedding[] = [
        { id: 'label-1', name: 'Similar Label', embedding: label1Embedding },
        { id: 'label-2', name: 'Less Similar', embedding: label2Embedding },
      ];

      vi.mocked(mockImageRepository.findByIdWithEmbedding).mockResolvedValue(mockImageWithEmbedding);
      vi.mocked(mockLabelRepository.findAllWithEmbedding).mockResolvedValue(mockLabelsWithEmbedding);

      const result = await suggestAttributes({ imageId: 'img-1', threshold: 0.1 }, deps);

      expect(result).not.toBe('IMAGE_NOT_FOUND');
      expect(result).not.toBe('IMAGE_NOT_EMBEDDED');
      expect(result).not.toBe('NO_LABELS_WITH_EMBEDDING');

      if (typeof result === 'object') {
        expect(result.imageId).toBe('img-1');
        expect(result.suggestions.length).toBe(2);
        // Sorted by score descending
        expect(result.suggestions[0]?.labelName).toBe('Similar Label');
        expect(result.suggestions[1]?.labelName).toBe('Less Similar');
        expect(result.suggestions[0]!.score).toBeGreaterThan(result.suggestions[1]!.score);
      }
    });

    it('should filter by threshold', async () => {
      const imageEmbValues: number[] = new Array<number>(512).fill(0);
      imageEmbValues[0] = 1;
      const imageEmbedding = createNormalizedEmbedding(imageEmbValues);

      // High similarity label
      const highSimValues: number[] = new Array<number>(512).fill(0);
      highSimValues[0] = 1;
      const highSimEmbedding = createNormalizedEmbedding(highSimValues);

      // Low similarity label (orthogonal)
      const lowSimValues: number[] = new Array<number>(512).fill(0);
      lowSimValues[1] = 1;
      const lowSimEmbedding = createNormalizedEmbedding(lowSimValues);

      vi.mocked(mockImageRepository.findByIdWithEmbedding).mockResolvedValue(
        { id: 'img-1', path: 'originals/test.png', embedding: imageEmbedding },
      );
      vi.mocked(mockLabelRepository.findAllWithEmbedding).mockResolvedValue([
        { id: 'label-high', name: 'High', embedding: highSimEmbedding },
        { id: 'label-low', name: 'Low', embedding: lowSimEmbedding },
      ]);

      const result = await suggestAttributes({ imageId: 'img-1', threshold: 0.5 }, deps);

      if (typeof result === 'object') {
        // Only high similarity should pass threshold
        expect(result.suggestions.length).toBe(1);
        expect(result.suggestions[0]?.labelName).toBe('High');
      }
    });

    it('should respect limit parameter', async () => {
      const imageEmbValues: number[] = new Array<number>(512).fill(0);
      imageEmbValues[0] = 1;
      const imageEmbedding = createNormalizedEmbedding(imageEmbValues);

      // Create 5 similar labels
      const labels: LabelWithEmbedding[] = [];
      for (let i = 0; i < 5; i++) {
        const values: number[] = new Array<number>(512).fill(0);
        values[0] = 1 - i * 0.1;
        labels.push({
          id: `label-${i}`,
          name: `Label ${i}`,
          embedding: createNormalizedEmbedding(values),
        });
      }

      vi.mocked(mockImageRepository.findByIdWithEmbedding).mockResolvedValue(
        { id: 'img-1', path: 'originals/test.png', embedding: imageEmbedding },
      );
      vi.mocked(mockLabelRepository.findAllWithEmbedding).mockResolvedValue(labels);

      const result = await suggestAttributes({ imageId: 'img-1', threshold: 0.1, limit: 3 }, deps);

      if (typeof result === 'object') {
        expect(result.suggestions.length).toBe(3);
      }
    });
  });

  describe('error cases', () => {
    it('should return IMAGE_NOT_FOUND when image does not exist', async () => {
      vi.mocked(mockImageRepository.findByIdWithEmbedding).mockResolvedValue(null);

      const result = await suggestAttributes({ imageId: 'non-existent' }, deps);

      expect(result).toBe('IMAGE_NOT_FOUND');
    });

    it('should return IMAGE_NOT_EMBEDDED when image exists but has no embedding', async () => {
      vi.mocked(mockImageRepository.findByIdWithEmbedding).mockResolvedValue({
        id: 'img-1',
        path: 'originals/test.png',
        embedding: null,
      });

      const result = await suggestAttributes({ imageId: 'img-1' }, deps);

      expect(result).toBe('IMAGE_NOT_EMBEDDED');
    });

    it('should return NO_LABELS_WITH_EMBEDDING when no labels have embeddings', async () => {
      const imageEmbValues: number[] = new Array<number>(512).fill(0);
      imageEmbValues[0] = 1;
      const imageEmbedding = createNormalizedEmbedding(imageEmbValues);

      vi.mocked(mockImageRepository.findByIdWithEmbedding).mockResolvedValue(
        { id: 'img-1', path: 'originals/test.png', embedding: imageEmbedding },
      );
      vi.mocked(mockLabelRepository.findAllWithEmbedding).mockResolvedValue([]);

      const result = await suggestAttributes({ imageId: 'img-1' }, deps);

      expect(result).toBe('NO_LABELS_WITH_EMBEDDING');
    });
  });
});

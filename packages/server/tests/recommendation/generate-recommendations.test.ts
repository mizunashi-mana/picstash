import 'reflect-metadata';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { EMBEDDING_DIMENSION, type EmbeddingRepository } from '@/application/ports/embedding-repository';
import {
  generateRecommendations,
} from '@/application/recommendation/generate-recommendations';
import type { ImageRepository, ImageWithEmbedding } from '@/application/ports/image-repository';
import type {
  ViewHistoryRepository,
  ViewHistoryWithImage,
} from '@/application/ports/view-history-repository';

function createMockViewHistoryRepository(): ViewHistoryRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    updateDuration: vi.fn(),
    findRecentWithImages: vi.fn().mockResolvedValue([]),
    getImageStats: vi.fn(),
    deleteById: vi.fn(),
  };
}

function createMockImageRepository(): ImageRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByIds: vi.fn(),
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

function createMockEmbeddingRepository(): EmbeddingRepository {
  return {
    upsert: vi.fn(),
    remove: vi.fn(),
    findSimilar: vi.fn().mockReturnValue([]),
    count: vi.fn(),
    getAllImageIds: vi.fn().mockReturnValue([]),
    close: vi.fn(),
  };
}

function createNormalizedEmbedding(values: number[]): Uint8Array {
  let norm = 0;
  for (const v of values) {
    norm += v * v;
  }
  norm = Math.sqrt(norm);

  const normalized = values.map(v => v / norm);
  const float32 = new Float32Array(normalized);
  return new Uint8Array(float32.buffer);
}

describe('generateRecommendations', () => {
  let mockViewHistoryRepo: ViewHistoryRepository;
  let mockImageRepo: ImageRepository;
  let mockEmbeddingRepo: EmbeddingRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    mockViewHistoryRepo = createMockViewHistoryRepository();
    mockImageRepo = createMockImageRepository();
    mockEmbeddingRepo = createMockEmbeddingRepository();
  });

  describe('no_history case', () => {
    it('should return no_history when view history is empty', async () => {
      vi.mocked(mockViewHistoryRepo.findRecentWithImages).mockResolvedValue([]);

      const result = await generateRecommendations(
        mockViewHistoryRepo,
        mockImageRepo,
        mockEmbeddingRepo,
      );

      expect(result.recommendations).toEqual([]);
      expect(result.reason).toBe('no_history');
    });
  });

  describe('no_embeddings case', () => {
    it('should return no_embeddings when viewed images have no embeddings', async () => {
      const viewHistory: ViewHistoryWithImage[] = [
        {
          id: 'vh-1',
          imageId: 'img-1',
          viewedAt: new Date(),
          duration: 5000,
          createdAt: new Date(),
          updatedAt: new Date(),
          image: { id: 'img-1', title: '無題の画像 (img-1)', thumbnailPath: null },
        },
      ];
      vi.mocked(mockViewHistoryRepo.findRecentWithImages).mockResolvedValue(viewHistory);
      vi.mocked(mockImageRepo.findByIdWithEmbedding).mockResolvedValue(null);

      const result = await generateRecommendations(
        mockViewHistoryRepo,
        mockImageRepo,
        mockEmbeddingRepo,
      );

      expect(result.recommendations).toEqual([]);
      expect(result.reason).toBe('no_embeddings');
    });
  });

  describe('success case', () => {
    it('should return recommendations based on view history', async () => {
      // Setup view history
      const viewHistory: ViewHistoryWithImage[] = [
        {
          id: 'vh-1',
          imageId: 'img-1',
          viewedAt: new Date(),
          duration: 5000,
          createdAt: new Date(),
          updatedAt: new Date(),
          image: { id: 'img-1', title: '無題の画像 (img-1)', thumbnailPath: null },
        },
      ];
      vi.mocked(mockViewHistoryRepo.findRecentWithImages).mockResolvedValue(viewHistory);

      // Setup embedding for viewed image
      const embeddingValues: number[] = new Array<number>(EMBEDDING_DIMENSION).fill(0);
      embeddingValues[0] = 1;
      const embedding = createNormalizedEmbedding(embeddingValues);

      const viewedImageWithEmbedding: ImageWithEmbedding = {
        id: 'img-1',
        path: 'originals/viewed.png',
        embedding,
      };
      vi.mocked(mockImageRepo.findByIdWithEmbedding).mockResolvedValue(viewedImageWithEmbedding);

      // Setup similar images found
      vi.mocked(mockEmbeddingRepo.findSimilar).mockReturnValue([
        { imageId: 'img-2', distance: 0.1 },
        { imageId: 'img-3', distance: 0.2 },
      ]);

      // Setup recommended image details
      vi.mocked(mockImageRepo.findById)
        .mockResolvedValueOnce({
          id: 'img-2',
          path: 'originals/similar1.png',
          thumbnailPath: 'thumbnails/similar1.png',
          mimeType: 'image/png',
          width: 100,
          height: 100,
          size: 1000,
          title: '無題の画像 (img-2)',
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: 'img-3',
          path: 'originals/similar2.png',
          thumbnailPath: 'thumbnails/similar2.png',
          mimeType: 'image/png',
          width: 100,
          height: 100,
          size: 1000,
          title: '無題の画像 (img-3)',
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const result = await generateRecommendations(
        mockViewHistoryRepo,
        mockImageRepo,
        mockEmbeddingRepo,
        { limit: 10 },
      );

      expect(result.reason).toBeUndefined();
      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations[0]?.id).toBe('img-2');
      expect(result.recommendations[1]?.id).toBe('img-3');
      // Score should be 1 / (1 + distance)
      expect(result.recommendations[0]?.score).toBeCloseTo(1 / 1.1, 5);
      expect(result.recommendations[1]?.score).toBeCloseTo(1 / 1.2, 5);
    });
  });
});

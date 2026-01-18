import 'reflect-metadata';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  findDuplicates,
  DEFAULT_DUPLICATE_THRESHOLD,
  type FindDuplicatesDeps,
} from '@/application/duplicate-detection/find-duplicates';
import type { EmbeddingRepository } from '@/application/ports/embedding-repository';
import type { ImageRepository, Image } from '@/application/ports/image-repository';

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

function createImage(id: string, createdAt: Date): Image {
  return {
    id,
    path: `originals/${id}.png`,
    thumbnailPath: `thumbnails/${id}.webp`,
    mimeType: 'image/png',
    size: 1024,
    width: 100,
    height: 100,
    description: null,
    createdAt,
    updatedAt: createdAt,
  };
}

describe('findDuplicates', () => {
  let mockImageRepository: ImageRepository;
  let mockEmbeddingRepository: EmbeddingRepository;
  let deps: FindDuplicatesDeps;

  beforeEach(() => {
    vi.clearAllMocks();
    mockImageRepository = createMockImageRepository();
    mockEmbeddingRepository = createMockEmbeddingRepository();
    deps = {
      imageRepository: mockImageRepository,
      embeddingRepository: mockEmbeddingRepository,
    };
  });

  describe('empty cases', () => {
    it('should return empty result when no images exist', async () => {
      vi.mocked(mockEmbeddingRepository.getAllImageIds).mockReturnValue([]);

      const result = await findDuplicates({}, deps);

      expect(result.groups).toHaveLength(0);
      expect(result.totalGroups).toBe(0);
      expect(result.totalDuplicates).toBe(0);
    });

    it('should return empty result when no duplicates found', async () => {
      vi.mocked(mockEmbeddingRepository.getAllImageIds).mockReturnValue(['img-1', 'img-2']);

      // Create dissimilar embeddings
      const emb1Values: number[] = new Array<number>(512).fill(0);
      emb1Values[0] = 1;
      const emb1 = createNormalizedEmbedding(emb1Values);

      const emb2Values: number[] = new Array<number>(512).fill(0);
      emb2Values[1] = 1;
      const emb2 = createNormalizedEmbedding(emb2Values);

      vi.mocked(mockImageRepository.findByIdWithEmbedding)
        .mockResolvedValueOnce({ id: 'img-1', path: 'originals/1.png', embedding: emb1 })
        .mockResolvedValueOnce({ id: 'img-2', path: 'originals/2.png', embedding: emb2 });

      // No similar images found (distance > threshold)
      vi.mocked(mockEmbeddingRepository.findSimilar)
        .mockReturnValue([{ imageId: 'img-2', distance: 1.0 }]);

      const result = await findDuplicates({}, deps);

      expect(result.groups).toHaveLength(0);
      expect(result.totalGroups).toBe(0);
      expect(result.totalDuplicates).toBe(0);
    });
  });

  describe('basic duplicate detection', () => {
    it('should detect a pair of duplicates', async () => {
      vi.mocked(mockEmbeddingRepository.getAllImageIds).mockReturnValue(['img-1', 'img-2']);

      const embValues: number[] = new Array<number>(512).fill(0);
      embValues[0] = 1;
      const embedding = createNormalizedEmbedding(embValues);

      const img1 = createImage('img-1', new Date('2024-01-01'));
      const img2 = createImage('img-2', new Date('2024-01-02'));

      vi.mocked(mockImageRepository.findByIdWithEmbedding)
        .mockResolvedValueOnce({ id: 'img-1', path: img1.path, embedding })
        .mockResolvedValueOnce({ id: 'img-2', path: img2.path, embedding });

      vi.mocked(mockImageRepository.findById)
        .mockResolvedValueOnce(img1)
        .mockResolvedValueOnce(img2);

      // img-1 finds img-2 as similar
      vi.mocked(mockEmbeddingRepository.findSimilar)
        .mockReturnValueOnce([{ imageId: 'img-2', distance: 0.05 }])
        .mockReturnValueOnce([{ imageId: 'img-1', distance: 0.05 }]);

      const result = await findDuplicates({}, deps);

      expect(result.groups).toHaveLength(1);
      expect(result.totalGroups).toBe(1);
      expect(result.totalDuplicates).toBe(1);
      expect(result.groups[0]?.original.id).toBe('img-1');
      expect(result.groups[0]?.duplicates).toHaveLength(1);
      expect(result.groups[0]?.duplicates[0]?.id).toBe('img-2');
      expect(result.groups[0]?.duplicates[0]?.distance).toBe(0.05);
    });

    it('should mark oldest image as original', async () => {
      vi.mocked(mockEmbeddingRepository.getAllImageIds).mockReturnValue(['img-newer', 'img-older']);

      const embValues: number[] = new Array<number>(512).fill(0);
      embValues[0] = 1;
      const embedding = createNormalizedEmbedding(embValues);

      // img-newer was created first in ID order but older date
      const imgNewer = createImage('img-newer', new Date('2024-02-01'));
      const imgOlder = createImage('img-older', new Date('2024-01-01'));

      vi.mocked(mockImageRepository.findByIdWithEmbedding)
        .mockResolvedValueOnce({ id: 'img-newer', path: imgNewer.path, embedding })
        .mockResolvedValueOnce({ id: 'img-older', path: imgOlder.path, embedding });

      vi.mocked(mockImageRepository.findById)
        .mockImplementation(async (id) => {
          if (id === 'img-newer') return imgNewer;
          if (id === 'img-older') return imgOlder;
          return null;
        });

      vi.mocked(mockEmbeddingRepository.findSimilar)
        .mockReturnValue([{ imageId: 'img-older', distance: 0.02 }]);

      const result = await findDuplicates({}, deps);

      expect(result.groups).toHaveLength(1);
      // img-older should be original (oldest by createdAt)
      expect(result.groups[0]?.original.id).toBe('img-older');
      expect(result.groups[0]?.duplicates[0]?.id).toBe('img-newer');
    });
  });

  describe('threshold filtering', () => {
    it('should use default threshold', async () => {
      expect(DEFAULT_DUPLICATE_THRESHOLD).toBe(0.1);
    });

    it('should respect custom threshold', async () => {
      vi.mocked(mockEmbeddingRepository.getAllImageIds).mockReturnValue(['img-1', 'img-2']);

      const embValues: number[] = new Array<number>(512).fill(0);
      embValues[0] = 1;
      const embedding = createNormalizedEmbedding(embValues);

      vi.mocked(mockImageRepository.findByIdWithEmbedding)
        .mockResolvedValue({ id: 'img-1', path: 'originals/1.png', embedding });

      // Distance 0.15 is above default threshold but below 0.2
      vi.mocked(mockEmbeddingRepository.findSimilar)
        .mockReturnValue([{ imageId: 'img-2', distance: 0.15 }]);

      // With default threshold (0.1), no duplicates
      const resultDefault = await findDuplicates({}, deps);
      expect(resultDefault.groups).toHaveLength(0);

      // Reset mocks
      vi.clearAllMocks();
      vi.mocked(mockEmbeddingRepository.getAllImageIds).mockReturnValue(['img-1', 'img-2']);

      const img1 = createImage('img-1', new Date('2024-01-01'));
      const img2 = createImage('img-2', new Date('2024-01-02'));

      vi.mocked(mockImageRepository.findByIdWithEmbedding)
        .mockResolvedValueOnce({ id: 'img-1', path: img1.path, embedding })
        .mockResolvedValueOnce({ id: 'img-2', path: img2.path, embedding });

      vi.mocked(mockImageRepository.findById)
        .mockResolvedValueOnce(img1)
        .mockResolvedValueOnce(img2);

      vi.mocked(mockEmbeddingRepository.findSimilar)
        .mockReturnValue([{ imageId: 'img-2', distance: 0.15 }]);

      // With threshold 0.2, should find duplicate
      const resultCustom = await findDuplicates({ threshold: 0.2 }, deps);
      expect(resultCustom.groups).toHaveLength(1);
    });
  });

  describe('transitive grouping', () => {
    it('should group transitively connected images', async () => {
      // A is similar to B, B is similar to C, but A and C are not directly compared
      vi.mocked(mockEmbeddingRepository.getAllImageIds).mockReturnValue(['img-a', 'img-b', 'img-c']);

      const embValues: number[] = new Array<number>(512).fill(0);
      embValues[0] = 1;
      const embedding = createNormalizedEmbedding(embValues);

      const imgA = createImage('img-a', new Date('2024-01-01'));
      const imgB = createImage('img-b', new Date('2024-01-02'));
      const imgC = createImage('img-c', new Date('2024-01-03'));

      vi.mocked(mockImageRepository.findByIdWithEmbedding)
        .mockResolvedValueOnce({ id: 'img-a', path: imgA.path, embedding })
        .mockResolvedValueOnce({ id: 'img-b', path: imgB.path, embedding })
        .mockResolvedValueOnce({ id: 'img-c', path: imgC.path, embedding });

      vi.mocked(mockImageRepository.findById)
        .mockImplementation(async (id) => {
          if (id === 'img-a') return imgA;
          if (id === 'img-b') return imgB;
          if (id === 'img-c') return imgC;
          return null;
        });

      // A -> B (similar), B -> C (similar), but A -> C (not similar or not returned)
      vi.mocked(mockEmbeddingRepository.findSimilar)
        .mockReturnValueOnce([{ imageId: 'img-b', distance: 0.05 }]) // A finds B
        .mockReturnValueOnce([{ imageId: 'img-a', distance: 0.05 }, { imageId: 'img-c', distance: 0.08 }]) // B finds A and C
        .mockReturnValueOnce([{ imageId: 'img-b', distance: 0.08 }]); // C finds B

      const result = await findDuplicates({}, deps);

      // All three should be in one group
      expect(result.groups).toHaveLength(1);
      expect(result.totalDuplicates).toBe(2);
      expect(result.groups[0]?.original.id).toBe('img-a'); // oldest
      expect(result.groups[0]?.duplicates).toHaveLength(2);

      // C is transitively connected via B, so its distance to A should be undefined
      const imgCDuplicate = result.groups[0]?.duplicates.find(d => d.id === 'img-c');
      expect(imgCDuplicate?.distance).toBeUndefined();

      // B is directly connected to A
      const imgBDuplicate = result.groups[0]?.duplicates.find(d => d.id === 'img-b');
      expect(imgBDuplicate?.distance).toBe(0.05);
    });
  });

  describe('edge cases', () => {
    it('should handle image without embedding gracefully', async () => {
      vi.mocked(mockEmbeddingRepository.getAllImageIds).mockReturnValue(['img-1', 'img-2']);

      const embValues: number[] = new Array<number>(512).fill(0);
      embValues[0] = 1;
      const embedding = createNormalizedEmbedding(embValues);

      vi.mocked(mockImageRepository.findByIdWithEmbedding)
        .mockResolvedValueOnce({ id: 'img-1', path: 'originals/1.png', embedding: null }) // No embedding
        .mockResolvedValueOnce({ id: 'img-2', path: 'originals/2.png', embedding });

      vi.mocked(mockEmbeddingRepository.findSimilar).mockReturnValue([]);

      const result = await findDuplicates({}, deps);

      // Should not crash, just skip images without embeddings
      expect(result.groups).toHaveLength(0);
    });

    it('should handle image not found in repository', async () => {
      vi.mocked(mockEmbeddingRepository.getAllImageIds).mockReturnValue(['img-1', 'img-2']);

      const embValues: number[] = new Array<number>(512).fill(0);
      embValues[0] = 1;
      const embedding = createNormalizedEmbedding(embValues);

      vi.mocked(mockImageRepository.findByIdWithEmbedding)
        .mockResolvedValueOnce({ id: 'img-1', path: 'originals/1.png', embedding })
        .mockResolvedValueOnce({ id: 'img-2', path: 'originals/2.png', embedding });

      vi.mocked(mockEmbeddingRepository.findSimilar)
        .mockReturnValue([{ imageId: 'img-2', distance: 0.05 }]);

      // Image not found when fetching details
      vi.mocked(mockImageRepository.findById).mockResolvedValue(null);

      const result = await findDuplicates({}, deps);

      // Group should be skipped because members can't be fetched
      expect(result.groups).toHaveLength(0);
    });
  });
});

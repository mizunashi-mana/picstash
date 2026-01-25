import { describe, expect, it } from 'vitest';
import { EMBEDDING_DIMENSION } from '@/index.js';

describe('sqlite-vec module', () => {
  describe('EMBEDDING_DIMENSION', () => {
    it('should be 512 for CLIP ViT-B/16', () => {
      expect(EMBEDDING_DIMENSION).toBe(512);
    });
  });

  describe('embedding dimension validation', () => {
    it('should define correct dimension for CLIP model', () => {
      // CLIP ViT-B/16 produces 512-dimensional embeddings
      expect(EMBEDDING_DIMENSION).toBe(512);
    });

    it('should allow creating Float32Array with correct dimension', () => {
      const embedding = new Float32Array(EMBEDDING_DIMENSION);
      expect(embedding.length).toBe(512);
      expect(embedding.byteLength).toBe(512 * 4); // 4 bytes per float32
    });
  });
});

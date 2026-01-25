/**
 * Find duplicate images in the library using embedding similarity.
 */

import { EMBEDDING_DIMENSION } from '@/application/ports/embedding-repository.js';
import type { EmbeddingRepository } from '@/application/ports/embedding-repository.js';
import type { ImageRepository } from '@/application/ports/image-repository.js';

/** Default distance threshold for duplicate detection */
export const DEFAULT_DUPLICATE_THRESHOLD = 0.1;

/** Image info for duplicate detection results */
export interface DuplicateImageInfo {
  id: string;
  title: string;
  thumbnailPath: string | null;
  createdAt: Date;
  distance?: number;
}

/** A group of duplicate images */
export interface DuplicateGroup {
  /** The original image (oldest in the group) */
  original: DuplicateImageInfo;
  /** Duplicate images (newer than original) */
  duplicates: DuplicateImageInfo[];
}

/** Result of duplicate detection */
export interface FindDuplicatesResult {
  groups: DuplicateGroup[];
  totalGroups: number;
  totalDuplicates: number;
}

/** Dependencies for find duplicates use case */
export interface FindDuplicatesDeps {
  imageRepository: ImageRepository;
  embeddingRepository: EmbeddingRepository;
}

/** Input for find duplicates use case */
export interface FindDuplicatesInput {
  /** Distance threshold for duplicate detection (default: 0.1) */
  threshold?: number;
}

/**
 * Union-Find data structure for efficient grouping.
 */
class UnionFind {
  private readonly parent: Map<string, string>;
  private readonly rank: Map<string, number>;

  constructor() {
    this.parent = new Map();
    this.rank = new Map();
  }

  makeSet(x: string): void {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
    }
  }

  find(x: string): string {
    if (!this.parent.has(x)) {
      this.makeSet(x);
    }
    const parent = this.parent.get(x);
    if (parent === undefined) {
      return x;
    }
    if (parent !== x) {
      // Path compression
      const root = this.find(parent);
      this.parent.set(x, root);
      return root;
    }
    return x;
  }

  union(x: string, y: string): void {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) {
      return;
    }

    const rankX = this.rank.get(rootX) ?? 0;
    const rankY = this.rank.get(rootY) ?? 0;

    // Union by rank
    if (rankX < rankY) {
      this.parent.set(rootX, rootY);
    }
    else if (rankX > rankY) {
      this.parent.set(rootY, rootX);
    }
    else {
      this.parent.set(rootY, rootX);
      this.rank.set(rootX, rankX + 1);
    }
  }

  getGroups(): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    for (const id of this.parent.keys()) {
      const root = this.find(id);
      const group = groups.get(root);
      if (group === undefined) {
        groups.set(root, [id]);
      }
      else {
        group.push(id);
      }
    }
    return groups;
  }
}

/**
 * Find duplicate image groups in the library.
 *
 * Uses embedding similarity with a strict threshold to identify duplicates.
 * Groups are formed using Union-Find, and the oldest image in each group
 * is marked as the original.
 */
export async function findDuplicates(
  input: FindDuplicatesInput,
  deps: FindDuplicatesDeps,
): Promise<FindDuplicatesResult> {
  const threshold = input.threshold ?? DEFAULT_DUPLICATE_THRESHOLD;
  const { imageRepository, embeddingRepository } = deps;

  // Get all images with embeddings
  const imageIds = embeddingRepository.getAllImageIds();

  if (imageIds.length === 0) {
    return { groups: [], totalGroups: 0, totalDuplicates: 0 };
  }

  // Track distances between duplicate pairs
  const distances = new Map<string, number>();
  const makeDistanceKey = (id1: string, id2: string): string =>
    id1 < id2 ? `${id1}:${id2}` : `${id2}:${id1}`;

  // Use Union-Find to group duplicates
  const uf = new UnionFind();
  const processedPairs = new Set<string>();

  // For each image, find similar images within threshold
  for (const imageId of imageIds) {
    uf.makeSet(imageId);

    // Get embedding for this image
    const imageWithEmbedding = await imageRepository.findByIdWithEmbedding(imageId);
    const embedding = imageWithEmbedding?.embedding;
    if (embedding === null || embedding === undefined) {
      continue;
    }

    // Validate embedding dimension
    const expectedByteLength = EMBEDDING_DIMENSION * 4;
    if (embedding.byteLength !== expectedByteLength) {
      continue;
    }

    // Convert to Float32Array
    const embeddingVector = new Float32Array(
      embedding.buffer,
      embedding.byteOffset,
      embedding.byteLength / 4,
    );

    // Find similar images within threshold
    // We fetch more results to ensure we capture all potential duplicates
    const similarResults = embeddingRepository.findSimilar(embeddingVector, 100, [imageId]);

    for (const result of similarResults) {
      // Skip if distance exceeds threshold
      if (result.distance > threshold) {
        continue;
      }

      // Skip if we've already processed this pair
      const pairKey = makeDistanceKey(imageId, result.imageId);
      if (processedPairs.has(pairKey)) {
        continue;
      }
      processedPairs.add(pairKey);

      // Record distance
      distances.set(pairKey, result.distance);

      // Union the two images
      uf.union(imageId, result.imageId);
    }
  }

  // Get groups (only groups with more than 1 member are duplicates)
  const unionGroups = uf.getGroups();
  const duplicateGroups: DuplicateGroup[] = [];

  for (const [_root, memberIds] of unionGroups) {
    // Skip groups with only one member (no duplicates)
    if (memberIds.length < 2) {
      continue;
    }

    // Get image details for all members
    const members: Array<DuplicateImageInfo & { distance?: number }> = [];
    for (const memberId of memberIds) {
      const image = await imageRepository.findById(memberId);
      if (image !== null) {
        members.push({
          id: image.id,
          title: image.title,
          thumbnailPath: image.thumbnailPath,
          createdAt: image.createdAt,
        });
      }
    }

    // Sort by createdAt (oldest first = original)
    members.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    if (members.length < 2) {
      continue;
    }

    // First member is original, rest are duplicates
    const original = members[0];
    if (original === undefined) {
      continue;
    }

    const duplicates = members.slice(1).map((dup) => {
      const distanceKey = makeDistanceKey(original.id, dup.id);
      return {
        ...dup,
        distance: distances.get(distanceKey),
      };
    });

    duplicateGroups.push({
      original: {
        id: original.id,
        title: original.title,
        thumbnailPath: original.thumbnailPath,
        createdAt: original.createdAt,
      },
      duplicates,
    });
  }

  // Calculate totals
  const totalDuplicates = duplicateGroups.reduce(
    (sum, group) => sum + group.duplicates.length,
    0,
  );

  return {
    groups: duplicateGroups,
    totalGroups: duplicateGroups.length,
    totalDuplicates,
  };
}

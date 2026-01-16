/**
 * Port for embedding generation service.
 * This interface defines the contract for generating embeddings from images and text.
 */

/** Result of embedding generation */
export interface EmbeddingResult {
  /** The embedding vector */
  embedding: Float32Array;
  /** Dimension of the embedding (e.g., 512 for CLIP ViT-B/16) */
  dimension: number;
  /** Model identifier used for generation */
  model: string;
}

/**
 * Service for generating embeddings.
 * Implementations may use different models (CLIP, DINOv2, etc.)
 */
export interface EmbeddingService {
  /**
   * Generate an embedding from an image file.
   * @param imagePath - Path to the image file
   * @returns The embedding result
   */
  generateFromFile: (imagePath: string) => Promise<EmbeddingResult>;

  /**
   * Generate an embedding from image data.
   * @param imageData - Raw image data as Buffer
   * @returns The embedding result
   */
  generateFromBuffer: (imageData: Buffer) => Promise<EmbeddingResult>;

  /**
   * Generate an embedding from text.
   * @param text - The text to embed
   * @returns The embedding result
   */
  generateFromText: (text: string) => Promise<EmbeddingResult>;

  /**
   * Get the dimension of embeddings produced by this service.
   */
  getDimension: () => number;

  /**
   * Get the model identifier used by this service.
   */
  getModel: () => string;

  /**
   * Check if the model is loaded and ready.
   */
  isReady: () => boolean;

  /**
   * Initialize/load the model.
   * Called automatically on first use, but can be called explicitly for warm-up.
   */
  initialize: () => Promise<void>;
}

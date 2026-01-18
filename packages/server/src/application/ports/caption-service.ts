/**
 * Port for caption generation service.
 * This interface defines the contract for generating captions from images.
 */

/** Result of caption generation */
export interface CaptionResult {
  /** The generated caption text */
  caption: string;
  /** Model identifier used for generation */
  model: string;
}

/** Similar image description with similarity score */
export interface SimilarImageDescription {
  /** Description text from a similar image */
  description: string;
  /** Similarity score (0-1, higher is more similar) */
  similarity: number;
}

/** Context for caption generation */
export interface CaptionContext {
  /** Descriptions from similar images with similarity scores */
  similarDescriptions: SimilarImageDescription[];
}

/**
 * Service for generating image captions.
 * Implementations may use different models (BLIP, ViT-GPT2, etc.)
 */
export interface CaptionService {
  /**
   * Generate a caption from an image file.
   * @param imagePath - Path to the image file
   * @returns The caption result
   */
  generateFromFile: (imagePath: string) => Promise<CaptionResult>;

  /**
   * Generate a caption from image data.
   * @param imageData - Raw image data as Buffer
   * @returns The caption result
   */
  generateFromBuffer: (imageData: Buffer) => Promise<CaptionResult>;

  /**
   * Generate a caption from an image file with context from similar images.
   * Uses an LLM to refine the caption based on similar images' descriptions.
   * Falls back to generateFromFile if LLM is unavailable or context is empty.
   * @param imagePath - Path to the image file
   * @param context - Context from similar images
   * @returns The caption result
   */
  generateWithContext: (imagePath: string, context: CaptionContext) => Promise<CaptionResult>;

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

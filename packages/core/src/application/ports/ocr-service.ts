/**
 * Port for OCR (Optical Character Recognition) service.
 * This interface defines the contract for extracting text from images.
 */

/** Result of OCR extraction */
export interface OcrResult {
  /** The extracted text from the image */
  text: string;
  /** Confidence score (0-1, higher is more confident) */
  confidence: number;
}

/**
 * Service for extracting text from images using OCR.
 * Implementations may use different OCR engines (Tesseract, etc.)
 */
export interface OcrService {
  /**
   * Extract text from an image file.
   * @param imagePath - Path to the image file
   * @returns The OCR result with extracted text and confidence
   */
  extractText: (imagePath: string) => Promise<OcrResult>;

  /**
   * Extract text from image data.
   * @param imageData - Raw image data as Buffer
   * @returns The OCR result with extracted text and confidence
   */
  extractTextFromBuffer: (imageData: Buffer) => Promise<OcrResult>;

  /**
   * Check if the OCR engine is loaded and ready.
   */
  isReady: () => boolean;

  /**
   * Initialize/load the OCR engine.
   * Called automatically on first use, but can be called explicitly for warm-up.
   */
  initialize: () => Promise<void>;

  /**
   * Terminate the OCR worker to free resources.
   */
  terminate: () => Promise<void>;
}

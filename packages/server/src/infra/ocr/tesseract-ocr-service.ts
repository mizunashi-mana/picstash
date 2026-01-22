/**
 * OCR Service using Tesseract.js
 *
 * Uses Tesseract.js to extract text from images.
 * Supports Japanese and English text recognition.
 */

import 'reflect-metadata';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { injectable } from 'inversify';
import { createWorker, type Worker } from 'tesseract.js';
import type { OcrResult, OcrService } from '@/application/ports/ocr-service.js';

/** Languages to recognize (Japanese + English) */
const LANGUAGES = 'jpn+eng';

/** Cache path for tessdata (relative to server package) */
const currentDir = dirname(fileURLToPath(import.meta.url));
const TESSDATA_CACHE_PATH = join(currentDir, '..', '..', '..', '..', 'tessdata');

/** Minimum confidence threshold to consider OCR result valid (0-100) */
const MIN_CONFIDENCE = 30;

@injectable()
export class TesseractOcrService implements OcrService {
  private worker: Worker | null = null;
  private initPromise: Promise<void> | null = null;

  async extractText(imagePath: string): Promise<OcrResult> {
    await this.initialize();

    const imageData = await readFile(imagePath);
    return await this.extractTextFromBuffer(imageData);
  }

  async extractTextFromBuffer(imageData: Buffer): Promise<OcrResult> {
    await this.initialize();

    if (this.worker === null) {
      throw new Error('OCR worker not initialized');
    }

    const result = await this.worker.recognize(imageData);
    const confidence = result.data.confidence / 100; // Convert to 0-1 scale

    // If confidence is too low, return empty text
    if (result.data.confidence < MIN_CONFIDENCE) {
      return {
        text: '',
        confidence: 0,
      };
    }

    // Clean up the extracted text
    const cleanedText = this.cleanText(result.data.text);

    return {
      text: cleanedText,
      confidence,
    };
  }

  isReady(): boolean {
    return this.worker !== null;
  }

  async initialize(): Promise<void> {
    if (this.isReady()) {
      return;
    }

    // Prevent multiple simultaneous initialization
    if (this.initPromise !== null) {
      await this.initPromise;
      return;
    }

    const initPromise = this.loadWorker();
    this.initPromise = initPromise;
    try {
      await initPromise;
    }
    finally {
      this.initPromise = null;
    }
  }

  async terminate(): Promise<void> {
    if (this.worker !== null) {
      await this.worker.terminate();
      this.worker = null;
    }
  }

  private async loadWorker(): Promise<void> {
    // eslint-disable-next-line no-console -- Worker loading status
    console.log(`Loading OCR worker with languages: ${LANGUAGES}...`);
    const startTime = Date.now();

    // Ensure cache directory exists
    await mkdir(TESSDATA_CACHE_PATH, { recursive: true });

    // Set TESSDATA_PREFIX environment variable to suppress warnings
    process.env.TESSDATA_PREFIX = TESSDATA_CACHE_PATH;

    this.worker = await createWorker(LANGUAGES, 1, {
      cachePath: TESSDATA_CACHE_PATH,
    });

    const elapsed = Date.now() - startTime;
    // eslint-disable-next-line no-console -- Worker loading status
    console.log(`OCR worker loaded in ${elapsed}ms (cache: ${TESSDATA_CACHE_PATH})`);
  }

  /**
   * Clean up extracted text by removing extra whitespace and normalizing line breaks
   */
  private cleanText(text: string): string {
    return text
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      // Remove multiple consecutive line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Remove leading/trailing whitespace from each line
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      // Remove leading/trailing whitespace from the entire text
      .trim();
  }
}

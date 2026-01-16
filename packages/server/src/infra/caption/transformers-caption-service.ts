/**
 * Caption Service using @huggingface/transformers
 *
 * Uses the ViT-GPT2 model to generate image captions,
 * then translates to Japanese using opus-mt-en-jap.
 */

import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { injectable } from 'inversify';
import type {
  CaptionResult,
  CaptionService,
} from '@/application/ports/caption-service.js';

/** Caption model identifier */
const CAPTION_MODEL_ID = 'Xenova/vit-gpt2-image-captioning';

/** Translation model identifier (NLLB multilingual model) */
const TRANSLATION_MODEL_ID = 'Xenova/nllb-200-distilled-600M';

// Type for the transformers module
interface TransformersModule {
  pipeline: (
    task: string,
    model: string,
  ) => Promise<ImageToTextPipeline | TranslationPipeline>;
  RawImage: {
    // eslint-disable-next-line n/no-unsupported-features/node-builtins -- Blob is available in Node.js 18+
    fromBlob: (blob: Blob) => Promise<RawImageInstance>;
  };
}

// RawImage instance type
interface RawImageInstance {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

// Pipeline result types
interface ImageToTextResult {
  generated_text: string;
}

interface TranslationResult {
  translation_text: string;
}

// Translation options type
interface TranslationOptions {
  src_lang: string;
  tgt_lang: string;
}

// Pipeline function types
type ImageToTextPipeline = (image: RawImageInstance) => Promise<ImageToTextResult[]>;
type TranslationPipeline = (text: string, options: TranslationOptions) => Promise<TranslationResult[]>;

// Module and pipeline instances (lazy loaded)
let transformers: TransformersModule | null = null;
let captionPipeline: ImageToTextPipeline | null = null;
let translationPipeline: TranslationPipeline | null = null;

@injectable()
export class TransformersCaptionService implements CaptionService {
  private initPromise: Promise<void> | null = null;

  async generateFromFile(imagePath: string): Promise<CaptionResult> {
    await this.initialize();

    const imageData = await readFile(imagePath);
    return await this.generateFromBuffer(imageData);
  }

  async generateFromBuffer(imageData: Buffer): Promise<CaptionResult> {
    await this.initialize();

    if (transformers === null || captionPipeline === null || translationPipeline === null) {
      throw new Error('Caption model not initialized');
    }

    // Load image using RawImage
    // eslint-disable-next-line n/no-unsupported-features/node-builtins -- Blob is available in Node.js 18+
    const image = await transformers.RawImage.fromBlob(new Blob([imageData]));

    // Generate English caption
    const captionResults = await captionPipeline(image);
    const englishCaption = captionResults[0]?.generated_text ?? '';

    // Translate to Japanese using NLLB model
    const translationResults = await translationPipeline(englishCaption, {
      src_lang: 'eng_Latn',
      tgt_lang: 'jpn_Jpan',
    });
    const japaneseCaption = translationResults[0]?.translation_text ?? englishCaption;

    return {
      caption: japaneseCaption,
      model: `${CAPTION_MODEL_ID} + ${TRANSLATION_MODEL_ID}`,
    };
  }

  getModel(): string {
    return `${CAPTION_MODEL_ID} + ${TRANSLATION_MODEL_ID}`;
  }

  isReady(): boolean {
    return captionPipeline !== null && translationPipeline !== null;
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

    this.initPromise = this.loadModels();
    await this.initPromise;
  }

  private async loadModels(): Promise<void> {
    // eslint-disable-next-line no-console -- Model loading status
    console.log(`Loading caption model: ${CAPTION_MODEL_ID}...`);
    const startTime = Date.now();

    // Dynamic import of transformers.js
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Dynamic import has unknown type
    transformers = (await import(
      '@huggingface/transformers',
    )) as unknown as TransformersModule;

    // Load the image-to-text pipeline
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Pipeline type depends on task
    captionPipeline = await transformers.pipeline(
      'image-to-text',
      CAPTION_MODEL_ID,
    ) as ImageToTextPipeline;

    const captionElapsed = Date.now() - startTime;
    // eslint-disable-next-line no-console -- Model loading status
    console.log(`Caption model loaded in ${captionElapsed}ms`);

    // Load the translation pipeline
    // eslint-disable-next-line no-console -- Model loading status
    console.log(`Loading translation model: ${TRANSLATION_MODEL_ID}...`);
    const translationStartTime = Date.now();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Pipeline type depends on task
    translationPipeline = await transformers.pipeline(
      'translation',
      TRANSLATION_MODEL_ID,
    ) as TranslationPipeline;

    const translationElapsed = Date.now() - translationStartTime;
    // eslint-disable-next-line no-console -- Model loading status
    console.log(`Translation model loaded in ${translationElapsed}ms`);
  }
}

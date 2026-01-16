/**
 * Caption Service using @huggingface/transformers
 *
 * Uses the ViT-GPT2 model to generate image captions.
 */

import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { injectable } from 'inversify';
import type {
  CaptionResult,
  CaptionService,
} from '@/application/ports/caption-service.js';

/** Caption model identifier */
const MODEL_ID = 'Xenova/vit-gpt2-image-captioning';

// Type for the transformers module
interface TransformersModule {
  pipeline: (
    task: string,
    model: string,
  ) => Promise<ImageToTextPipeline>;
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

// Pipeline result type
interface ImageToTextResult {
  generated_text: string;
}

// Pipeline function type
type ImageToTextPipeline = (image: RawImageInstance) => Promise<ImageToTextResult[]>;

// Module and pipeline instances (lazy loaded)
let transformers: TransformersModule | null = null;
let captionPipeline: ImageToTextPipeline | null = null;

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

    if (transformers === null || captionPipeline === null) {
      throw new Error('Caption model not initialized');
    }

    // Load image using RawImage
    // eslint-disable-next-line n/no-unsupported-features/node-builtins -- Blob is available in Node.js 18+
    const image = await transformers.RawImage.fromBlob(new Blob([imageData]));

    // Generate caption
    const results = await captionPipeline(image);

    // Extract the generated text
    const caption = results[0]?.generated_text ?? '';

    return {
      caption,
      model: MODEL_ID,
    };
  }

  getModel(): string {
    return MODEL_ID;
  }

  isReady(): boolean {
    return captionPipeline !== null;
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
    console.log(`Loading caption model: ${MODEL_ID}...`);
    const startTime = Date.now();

    // Dynamic import of transformers.js
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Dynamic import has unknown type
    transformers = (await import(
      '@huggingface/transformers',
    )) as unknown as TransformersModule;

    // Load the image-to-text pipeline
    captionPipeline = await transformers.pipeline('image-to-text', MODEL_ID);

    const elapsed = Date.now() - startTime;
    // eslint-disable-next-line no-console -- Model loading status
    console.log(`Caption model loaded in ${elapsed}ms`);
  }
}

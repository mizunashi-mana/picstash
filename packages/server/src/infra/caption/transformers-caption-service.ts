/**
 * Caption Service using @huggingface/transformers
 *
 * Uses the Florence-2 model to generate detailed image captions,
 * then translates to Japanese using NLLB-200.
 */

import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { injectable } from 'inversify';
import type {
  CaptionResult,
  CaptionService,
} from '@/application/ports/caption-service.js';

/** Caption model identifier (Florence-2 for detailed captioning) */
const CAPTION_MODEL_ID = 'onnx-community/Florence-2-base-ft';

/** Translation model identifier (NLLB multilingual model) */
const TRANSLATION_MODEL_ID = 'Xenova/nllb-200-distilled-600M';

/** Florence-2 task for detailed captioning */
const FLORENCE_TASK = '<MORE_DETAILED_CAPTION>';

// Type for Florence-2 model
interface Florence2Model {
  generate: (options: {
    input_ids: unknown;
    pixel_values: unknown;
    max_new_tokens: number;
  }) => Promise<unknown>;
}

// Type for Florence-2 processor
interface Florence2Processor {
  construct_prompts: (task: string) => string;
  (image: RawImageInstance, prompts: string): Promise<{
    input_ids: unknown;
    pixel_values: unknown;
  }>;
  batch_decode: (ids: unknown, options: { skip_special_tokens: boolean }) => string[];
  post_process_generation: (
    text: string,
    task: string,
    imageSize: { width: number; height: number },
  ) => Record<string, string>;
}

// Type for the transformers module
interface TransformersModule {
  Florence2ForConditionalGeneration: {
    from_pretrained: (
      model: string,
      options: { dtype: string },
    ) => Promise<Florence2Model>;
  };
  AutoProcessor: {
    from_pretrained: (model: string) => Promise<Florence2Processor>;
  };
  pipeline: (
    task: string,
    model: string,
  ) => Promise<TranslationPipeline>;
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
interface TranslationResult {
  translation_text: string;
}

// Translation options type
interface TranslationOptions {
  src_lang: string;
  tgt_lang: string;
}

// Pipeline function types
type TranslationPipeline = (text: string, options: TranslationOptions) => Promise<TranslationResult[]>;

// Module and model instances (lazy loaded)
let transformers: TransformersModule | null = null;
let florence2Model: Florence2Model | null = null;
let florence2Processor: Florence2Processor | null = null;
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

    if (transformers === null || florence2Model === null || florence2Processor === null || translationPipeline === null) {
      throw new Error('Caption model not initialized');
    }

    // Load image using RawImage
    // eslint-disable-next-line n/no-unsupported-features/node-builtins -- Blob is available in Node.js 18+
    const image = await transformers.RawImage.fromBlob(new Blob([imageData]));

    // Construct prompts for Florence-2
    const prompts = florence2Processor.construct_prompts(FLORENCE_TASK);

    // Pre-process the image and text inputs
    const inputs = await florence2Processor(image, prompts);

    // Generate caption with Florence-2
    const generatedIds = await florence2Model.generate({
      ...inputs,
      max_new_tokens: 256,
    });

    // Decode generated text
    const generatedText = florence2Processor.batch_decode(generatedIds, { skip_special_tokens: false })[0] ?? '';

    // Post-process the generated text
    const result = florence2Processor.post_process_generation(
      generatedText,
      FLORENCE_TASK,
      { width: image.width, height: image.height },
    );
    const englishCaption = result[FLORENCE_TASK] ?? '';

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
    return florence2Model !== null && florence2Processor !== null && translationPipeline !== null;
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

    const initPromise = this.loadModels();
    this.initPromise = initPromise;
    try {
      await initPromise;
    }
    finally {
      // Clear the promise after initialization completes to free memory
      this.initPromise = null;
    }
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

    // Load Florence-2 model
    florence2Model = await transformers.Florence2ForConditionalGeneration.from_pretrained(
      CAPTION_MODEL_ID,
      { dtype: 'fp32' },
    );

    // Load Florence-2 processor

    florence2Processor = await transformers.AutoProcessor.from_pretrained(CAPTION_MODEL_ID);

    const captionElapsed = Date.now() - startTime;
    // eslint-disable-next-line no-console -- Model loading status
    console.log(`Caption model loaded in ${captionElapsed}ms`);

    // Load the translation pipeline
    // eslint-disable-next-line no-console -- Model loading status
    console.log(`Loading translation model: ${TRANSLATION_MODEL_ID}...`);
    const translationStartTime = Date.now();

    translationPipeline = await transformers.pipeline(
      'translation',
      TRANSLATION_MODEL_ID,
    );

    const translationElapsed = Date.now() - translationStartTime;
    // eslint-disable-next-line no-console -- Model loading status
    console.log(`Translation model loaded in ${translationElapsed}ms`);
  }
}

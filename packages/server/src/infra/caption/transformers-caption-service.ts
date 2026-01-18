/**
 * Caption Service using @huggingface/transformers
 *
 * Uses the Florence-2 model to generate detailed image captions,
 * then translates to Japanese using NLLB-200.
 */

import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { inject, injectable, optional } from 'inversify';
import { TYPES } from '@/infra/di/types.js';
import type {
  CaptionContext,
  CaptionResult,
  CaptionService,
} from '@/application/ports/caption-service.js';
import type { LlmService } from '@/application/ports/llm-service.js';

/** Caption model identifier (Florence-2 for detailed captioning) */
const CAPTION_MODEL_ID = 'onnx-community/Florence-2-base-ft';

/** Translation model identifier (NLLB multilingual model) */
const TRANSLATION_MODEL_ID = 'Xenova/nllb-200-distilled-600M';

/** Florence-2 task for detailed captioning */
const FLORENCE_TASK = '<MORE_DETAILED_CAPTION>';

/** Maximum number of tokens to generate for captions */
const MAX_NEW_TOKENS = 256;

/** Generated token IDs type (nested array of token IDs) */
type GeneratedTokenIds = number[][];

/** Pixel values tensor type (nested array for image data) */
type PixelValues = number[][][];

// Type for Florence-2 model
interface Florence2Model {
  generate: (options: {
    input_ids: GeneratedTokenIds;
    pixel_values: PixelValues;
    max_new_tokens: number;
  }) => Promise<GeneratedTokenIds>;
}

/**
 * Type for Florence-2 processor.
 * The processor is a callable object that preprocesses images and text,
 * while also having methods for prompt construction, decoding, and post-processing.
 */
interface Florence2Processor {
  construct_prompts: (task: string) => string;
  (image: RawImageInstance, prompts: string): Promise<{
    input_ids: GeneratedTokenIds;
    pixel_values: PixelValues;
  }>;
  batch_decode: (ids: GeneratedTokenIds, options: { skip_special_tokens: boolean }) => string[];
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

/** System prompt for LLM refinement */
const REFINEMENT_SYSTEM_PROMPT = `あなたは画像の説明文を生成するアシスタントです。
画像分析結果と、類似画像の説明文（類似度付き）が与えられます。
これらを参考に、適切な日本語の説明文を1つ生成してください。

ルール:
- 説明文は1〜3文程度で簡潔に
- 類似度が高い（80%以上）画像の説明を特に重視し、固有名詞（人物名、キャラクター名、シリーズ名など）を積極的に活用
- 類似度が低い（50%未満）画像の説明は参考程度に
- 画像分析結果に忠実に、内容を正確に説明
- 説明文のみを出力（前置きや説明は不要）`;

@injectable()
export class TransformersCaptionService implements CaptionService {
  private initPromise: Promise<void> | null = null;

  constructor(
    @inject(TYPES.LlmService) @optional()
    private readonly llmService?: LlmService,
  ) {}

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
      max_new_tokens: MAX_NEW_TOKENS,
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

  async generateWithContext(imagePath: string, context: CaptionContext): Promise<CaptionResult> {
    // If no similar descriptions or LLM not available, fall back to basic generation
    if (
      context.similarDescriptions.length === 0
      || this.llmService === undefined
    ) {
      return await this.generateFromFile(imagePath);
    }

    // Check if LLM is available
    const llmAvailable = await this.llmService.isAvailable();
    if (!llmAvailable) {
      return await this.generateFromFile(imagePath);
    }

    // First, generate a base caption using Florence-2
    const baseResult = await this.generateFromFile(imagePath);

    // Build the prompt for LLM refinement with similarity scores
    const similarDescriptionsText = context.similarDescriptions
      .map((item, i) => {
        const similarityPercent = Math.round(item.similarity * 100);
        return `${i + 1}. [類似度: ${similarityPercent}%] ${item.description}`;
      })
      .join('\n');

    const prompt = `## 画像分析結果
${baseResult.caption}

## 類似画像の説明文（類似度順）
${similarDescriptionsText}

上記を参考に、この画像の説明文を生成してください。類似度が高い画像の説明を優先的に参考にしてください。`;

    try {
      const llmResult = await this.llmService.generate(prompt, {
        systemPrompt: REFINEMENT_SYSTEM_PROMPT,
        maxTokens: 256,
        temperature: 0.7,
      });

      return {
        caption: llmResult.text,
        model: `${this.getModel()} + ${llmResult.model}`,
      };
    }
    catch (error) {
      // If LLM fails, return the base result
      // eslint-disable-next-line no-console -- Log LLM errors for debugging
      console.error('LLM refinement failed, using base caption:', error);
      return baseResult;
    }
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
    // Using fp32 for maximum compatibility and accuracy. Lower precision (fp16) may cause
    // issues on some systems and the memory savings are minimal for this model size.
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

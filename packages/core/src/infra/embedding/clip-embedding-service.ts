/**
 * CLIP Embedding Service using @huggingface/transformers
 *
 * Uses the CLIP ViT-B/16 model to generate 512-dimensional embeddings
 * that can be used for similarity search and text-image matching.
 */

import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { injectable } from 'inversify';
import type {
  EmbeddingResult,
  EmbeddingService,
} from '../../application/ports/embedding-service.js';

/** CLIP model identifier */
const MODEL_ID = 'Xenova/clip-vit-base-patch16';

/** Embedding dimension for CLIP ViT-B/16 */
const EMBEDDING_DIMENSION = 512;

// Type for the transformers module
interface TransformersModule {
  RawImage: {
    fromBlob: (blob: Blob) => Promise<unknown>;
  };
  AutoProcessor: {
    from_pretrained: (modelId: string) => Promise<ProcessorInstance>;
  };
  AutoTokenizer: {
    from_pretrained: (modelId: string) => Promise<TokenizerInstance>;
  };
  CLIPVisionModelWithProjection: {
    from_pretrained: (modelId: string) => Promise<VisionModelInstance>;
  };
  CLIPTextModelWithProjection: {
    from_pretrained: (modelId: string) => Promise<TextModelInstance>;
  };
}

// Processor and model instance types
type ProcessorInstance = (image: unknown) => Promise<unknown>;

type TokenizerInstance = (text: string, options?: { padding?: boolean; truncation?: boolean }) => unknown;

type VisionModelInstance = (inputs: unknown) => Promise<VisionModelOutput>;

type TextModelInstance = (inputs: unknown) => Promise<TextModelOutput>;

interface VisionModelOutput {
  image_embeds: {
    data: Float32Array;
  };
}

interface TextModelOutput {
  text_embeds: {
    data: Float32Array;
  };
}

// Module and model instances (lazy loaded)
let transformers: TransformersModule | null = null;
let processor: ProcessorInstance | null = null;
let tokenizer: TokenizerInstance | null = null;
let visionModel: VisionModelInstance | null = null;
let textModel: TextModelInstance | null = null;

@injectable()
export class ClipEmbeddingService implements EmbeddingService {
  private initPromise: Promise<void> | null = null;

  async generateFromFile(imagePath: string): Promise<EmbeddingResult> {
    await this.initialize();

    const imageData = await readFile(imagePath);
    return await this.generateFromBuffer(imageData);
  }

  async generateFromBuffer(imageData: Buffer): Promise<EmbeddingResult> {
    await this.initialize();

    if (transformers === null || processor === null || visionModel === null) {
      throw new Error('CLIP vision model not initialized');
    }

    // Load image using RawImage
    const image = await transformers.RawImage.fromBlob(new Blob([imageData]));

    // Process image through the processor
    const inputs = await processor(image);

    // Generate embedding
    const output = await visionModel(inputs);

    // Extract the embedding vector
    // image_embeds is a Tensor with shape [1, 512]
    const embedding = output.image_embeds.data;

    // Normalize the embedding (L2 normalization)
    const normalized = this.normalizeEmbedding(embedding);

    return {
      embedding: normalized,
      dimension: EMBEDDING_DIMENSION,
      model: MODEL_ID,
    };
  }

  async generateFromText(text: string): Promise<EmbeddingResult> {
    await this.initialize();

    if (tokenizer === null || textModel === null) {
      throw new Error('CLIP text model not initialized');
    }

    // Tokenize the text
    const inputs = tokenizer(text, { padding: true, truncation: true });

    // Generate embedding
    const output = await textModel(inputs);

    // Extract the embedding vector
    // text_embeds is a Tensor with shape [1, 512]
    const embedding = output.text_embeds.data;

    // Normalize the embedding (L2 normalization)
    const normalized = this.normalizeEmbedding(embedding);

    return {
      embedding: normalized,
      dimension: EMBEDDING_DIMENSION,
      model: MODEL_ID,
    };
  }

  getDimension(): number {
    return EMBEDDING_DIMENSION;
  }

  getModel(): string {
    return MODEL_ID;
  }

  isReady(): boolean {
    return (
      processor !== null
      && tokenizer !== null
      && visionModel !== null
      && textModel !== null
    );
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
    console.log(`Loading CLIP models: ${MODEL_ID}...`);
    const startTime = Date.now();

    // Dynamic import of transformers.js
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Dynamic import has unknown type
    transformers = (await import(
      '@huggingface/transformers',
    )) as unknown as TransformersModule;

    // Load all components in parallel
    const [loadedProcessor, loadedTokenizer, loadedVisionModel, loadedTextModel]
      = await Promise.all([
        transformers.AutoProcessor.from_pretrained(MODEL_ID),
        transformers.AutoTokenizer.from_pretrained(MODEL_ID),
        transformers.CLIPVisionModelWithProjection.from_pretrained(MODEL_ID),
        transformers.CLIPTextModelWithProjection.from_pretrained(MODEL_ID),
      ]);

    processor = loadedProcessor;
    tokenizer = loadedTokenizer;
    visionModel = loadedVisionModel;
    textModel = loadedTextModel;

    const elapsed = Date.now() - startTime;
    // eslint-disable-next-line no-console -- Model loading status
    console.log(`CLIP models loaded in ${elapsed}ms`);
  }

  /**
   * L2 normalize an embedding vector.
   * This ensures consistent similarity calculations.
   */
  private normalizeEmbedding(embedding: Float32Array): Float32Array {
    let norm = 0;
    for (const value of embedding) {
      norm += value * value;
    }
    norm = Math.sqrt(norm);

    if (norm === 0) {
      return embedding;
    }

    const normalized = new Float32Array(embedding.length);
    let i = 0;
    for (const value of embedding) {
      normalized[i] = value / norm;
      i++;
    }

    return normalized;
  }
}

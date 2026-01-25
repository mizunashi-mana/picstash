/**
 * Ollama LLM Service
 *
 * Uses the Ollama API for local LLM text generation.
 * Configuration is loaded from config.yaml (ollama section).
 */

import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '../di/types.js';
import type {
  LlmService,
  LlmGenerateResult,
  LlmGenerateOptions,
} from '../../application/ports/llm-service.js';
import type { CoreConfig } from '../../config.js';

/** Default Ollama API URL */
const DEFAULT_OLLAMA_URL = 'http://localhost:11434';

/** Default model to use */
const DEFAULT_MODEL = 'llama3.2';

/** Default max tokens */
const DEFAULT_MAX_TOKENS = 512;

/** Default temperature */
const DEFAULT_TEMPERATURE = 0.7;

/** Ollama API response type */
interface OllamaGenerateResponse {
  response: string;
  model: string;
  done: boolean;
}

@injectable()
export class OllamaLlmService implements LlmService {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(@inject(TYPES.Config) config: CoreConfig) {
    this.baseUrl = config.ollama?.url ?? DEFAULT_OLLAMA_URL;
    this.model = config.ollama?.model ?? DEFAULT_MODEL;
  }

  async generate(prompt: string, options?: LlmGenerateOptions): Promise<LlmGenerateResult> {
    const systemPrompt = options?.systemPrompt ?? '';
    const maxTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS;
    const temperature = options?.temperature ?? DEFAULT_TEMPERATURE;

    const fullPrompt = systemPrompt !== ''
      ? `${systemPrompt}\n\n${prompt}`
      : prompt;

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        prompt: fullPrompt,
        stream: false,
        options: {
          num_predict: maxTokens,
          temperature,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- response.json() returns unknown
    const data = (await response.json()) as OllamaGenerateResponse;

    return {
      text: data.response.trim(),
      model: data.model,
    };
  }

  getModel(): string {
    return this.model;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const signal = AbortSignal.timeout(5000);
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal,
      });
      return response.ok;
    }
    catch {
      return false;
    }
  }
}

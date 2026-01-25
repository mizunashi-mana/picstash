/**
 * Port for LLM (Large Language Model) service.
 * This interface defines the contract for text generation using LLMs.
 */

/** Result of text generation */
export interface LlmGenerateResult {
  /** The generated text */
  text: string;
  /** Model identifier used for generation */
  model: string;
}

/** Options for text generation */
export interface LlmGenerateOptions {
  /** System prompt to set the behavior of the model */
  systemPrompt?: string;
  /** Maximum number of tokens to generate */
  maxTokens?: number;
  /** Temperature for sampling (0-1, lower = more deterministic) */
  temperature?: number;
}

/**
 * Service for generating text using LLMs.
 * Implementations may use different providers (Ollama, OpenAI, etc.)
 */
export interface LlmService {
  /**
   * Generate text from a prompt.
   * @param prompt - The user prompt
   * @param options - Generation options
   * @returns The generation result
   */
  generate: (prompt: string, options?: LlmGenerateOptions) => Promise<LlmGenerateResult>;

  /**
   * Get the model identifier used by this service.
   */
  getModel: () => string;

  /**
   * Check if the service is available and ready.
   */
  isAvailable: () => Promise<boolean>;
}

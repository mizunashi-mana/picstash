import 'reflect-metadata';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Config } from '@/config.js';

const testConfig: Config = {
  server: { port: 3000, host: '0.0.0.0' },
  database: { url: 'file:./test.db' },
  storage: { path: './storage' },
  logging: {
    level: 'info',
    format: 'pretty',
    file: {
      enabled: false,
      path: './logs/server.log',
      rotation: { enabled: true, maxSize: '10M', maxFiles: 5 },
    },
  },
  ollama: {
    url: 'http://localhost:11434',
    model: 'llama3.2',
  },
};

// Store original fetch
const originalFetch = globalThis.fetch;

describe('OllamaLlmService', () => {
  let mockFetch: ReturnType<typeof vi.fn<typeof fetch>>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock fetch with proper type
    mockFetch = vi.fn<typeof fetch>();
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('generate', () => {
    it('should generate text successfully', async () => {
      const { OllamaLlmService } = await import('@/infra/llm/ollama-llm-service');

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          response: 'Generated text response',
          model: 'llama3.2',
          done: true,
        }),
      } as unknown as Response);

      const service = new OllamaLlmService(testConfig);
      const result = await service.generate('Test prompt');

      expect(result.text).toBe('Generated text response');
      expect(result.model).toBe('llama3.2');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('should include system prompt in request', async () => {
      const { OllamaLlmService } = await import('@/infra/llm/ollama-llm-service');

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          response: 'Response with system prompt',
          model: 'llama3.2',
          done: true,
        }),
      } as unknown as Response);

      const service = new OllamaLlmService(testConfig);
      await service.generate('User prompt', {
        systemPrompt: 'You are a helpful assistant',
        maxTokens: 100,
        temperature: 0.5,
      });

      const callArgs = mockFetch.mock.calls[0];
      if (callArgs === undefined) {
        throw new Error('Expected fetch to be called');
      }
      const callBody = JSON.parse((callArgs[1]!).body as string) as {
        prompt: string;
        options: { num_predict: number; temperature: number };
      };
      expect(callBody.prompt).toContain('You are a helpful assistant');
      expect(callBody.prompt).toContain('User prompt');
      expect(callBody.options.num_predict).toBe(100);
      expect(callBody.options.temperature).toBe(0.5);
    });

    it('should throw error when API returns non-OK response', async () => {
      const { OllamaLlmService } = await import('@/infra/llm/ollama-llm-service');

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      } as unknown as Response);

      const service = new OllamaLlmService(testConfig);
      await expect(service.generate('Test prompt')).rejects.toThrow(
        'Ollama API error: 500 - Internal Server Error',
      );
    });

    it('should trim whitespace from response', async () => {
      const { OllamaLlmService } = await import('@/infra/llm/ollama-llm-service');

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          response: '  Trimmed response  \n',
          model: 'llama3.2',
          done: true,
        }),
      } as unknown as Response);

      const service = new OllamaLlmService(testConfig);
      const result = await service.generate('Test prompt');

      expect(result.text).toBe('Trimmed response');
    });
  });

  describe('getModel', () => {
    it('should return configured model name', async () => {
      const { OllamaLlmService } = await import('@/infra/llm/ollama-llm-service');

      const service = new OllamaLlmService(testConfig);
      expect(service.getModel()).toBe('llama3.2');
    });
  });

  describe('isAvailable', () => {
    it('should return true when Ollama API is reachable', async () => {
      const { OllamaLlmService } = await import('@/infra/llm/ollama-llm-service');

      mockFetch.mockResolvedValue({
        ok: true,
      } as unknown as Response);

      const service = new OllamaLlmService(testConfig);
      const available = await service.isAvailable();

      expect(available).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/tags',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should return false when Ollama API returns error', async () => {
      const { OllamaLlmService } = await import('@/infra/llm/ollama-llm-service');

      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
      } as unknown as Response);

      const service = new OllamaLlmService(testConfig);
      const available = await service.isAvailable();

      expect(available).toBe(false);
    });

    it('should return false when fetch throws error', async () => {
      const { OllamaLlmService } = await import('@/infra/llm/ollama-llm-service');

      mockFetch.mockRejectedValue(new Error('Network error'));

      const service = new OllamaLlmService(testConfig);
      const available = await service.isAvailable();

      expect(available).toBe(false);
    });

    it('should return false when request times out', async () => {
      const { OllamaLlmService } = await import('@/infra/llm/ollama-llm-service');

      mockFetch.mockRejectedValue(new DOMException('Aborted', 'AbortError'));

      const service = new OllamaLlmService(testConfig);
      const available = await service.isAvailable();

      expect(available).toBe(false);
    });
  });
});

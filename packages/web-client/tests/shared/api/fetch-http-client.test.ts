import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FetchHttpClient } from '@/shared/api/fetch-http-client';

describe('FetchHttpClient', () => {
  let client: FetchHttpClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    client = new FetchHttpClient();
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('get', () => {
    it('should perform GET request and return JSON', async () => {
      const mockData = { id: '1', name: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => await Promise.resolve(mockData),
      });

      const result = await client.get<typeof mockData>('/api/test');

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {},
        signal: undefined,
      });
      expect(result).toEqual(mockData);
    });

    it('should throw error on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(client.get('/api/test')).rejects.toThrow(
        'API Error: 404 Not Found',
      );
    });

    it('should pass custom headers', async () => {
      const mockData = { id: '1' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => await Promise.resolve(mockData),
      });

      await client.get('/api/test', { headers: { Authorization: 'Bearer token' } });

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
        signal: undefined,
      });
    });
  });

  describe('post', () => {
    it('should perform POST request with JSON body', async () => {
      const mockData = { id: '1' };
      const requestBody = { name: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => await Promise.resolve(mockData),
      });

      const result = await client.post<typeof mockData>('/api/test', requestBody);

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: undefined,
      });
      expect(result).toEqual(mockData);
    });

    it('should perform POST request without body', async () => {
      const mockData = { id: '1' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => await Promise.resolve(mockData),
      });

      const result = await client.post<typeof mockData>('/api/test');

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: {},
        body: undefined,
        signal: undefined,
      });
      expect(result).toEqual(mockData);
    });

    it('should merge custom headers with Content-Type', async () => {
      const mockData = { id: '1' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => await Promise.resolve(mockData),
      });

      await client.post('/api/test', { name: 'test' }, { headers: { 'X-Custom': 'value' } });

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Custom': 'value' },
        body: JSON.stringify({ name: 'test' }),
        signal: undefined,
      });
    });
  });

  describe('put', () => {
    it('should perform PUT request with JSON body', async () => {
      const mockData = { id: '1', updated: true };
      const requestBody = { name: 'updated' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => await Promise.resolve(mockData),
      });

      const result = await client.put<typeof mockData>('/api/test', requestBody);

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: undefined,
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('patch', () => {
    it('should perform PATCH request with JSON body', async () => {
      const mockData = { id: '1', patched: true };
      const requestBody = { name: 'patched' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => await Promise.resolve(mockData),
      });

      const result = await client.patch<typeof mockData>('/api/test', requestBody);

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: undefined,
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('delete', () => {
    it('should perform DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await client.delete('/api/test/1');

      expect(mockFetch).toHaveBeenCalledWith('/api/test/1', {
        method: 'DELETE',
        headers: {},
        signal: undefined,
      });
    });
  });

  describe('postFormData', () => {
    it('should perform POST request with FormData', async () => {
      const mockData = { id: '1', uploaded: true };
      const formData = new FormData();
      formData.append('file', new Blob(['test']), 'test.txt');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => await Promise.resolve(mockData),
      });

      const result = await client.postFormData<typeof mockData>('/api/upload', formData);

      expect(mockFetch).toHaveBeenCalledWith('/api/upload', {
        method: 'POST',
        body: formData,
        headers: undefined,
        signal: undefined,
      });
      expect(result).toEqual(mockData);
    });

    it('should throw error on non-ok response', async () => {
      const formData = new FormData();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(client.postFormData('/api/upload', formData)).rejects.toThrow(
        'API Error: 500 Internal Server Error',
      );
    });

    it('should pass custom headers for FormData', async () => {
      const mockData = { id: '1' };
      const formData = new FormData();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => await Promise.resolve(mockData),
      });

      await client.postFormData('/api/upload', formData, { headers: { 'X-Custom': 'value' } });

      expect(mockFetch).toHaveBeenCalledWith('/api/upload', {
        method: 'POST',
        body: formData,
        headers: { 'X-Custom': 'value' },
        signal: undefined,
      });
    });
  });

  describe('204 No Content handling', () => {
    it('should return undefined for 204 responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await client.get('/api/test');

      expect(result).toBeUndefined();
    });
  });

  describe('RequestOptions signal handling', () => {
    it('should pass user-provided signal', async () => {
      const controller = new AbortController();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => await Promise.resolve({}),
      });

      await client.get('/api/test', { signal: controller.signal });

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {},
        signal: controller.signal,
      });
    });

    it('should create timeout signal when timeout is specified', async () => {
      const mockTimeoutSignal = AbortSignal.timeout(5000);
      vi.spyOn(AbortSignal, 'timeout').mockReturnValueOnce(mockTimeoutSignal);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => await Promise.resolve({}),
      });

      await client.get('/api/test', { timeout: 5000 });

      expect(AbortSignal.timeout).toHaveBeenCalledWith(5000);
      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {},
        signal: mockTimeoutSignal,
      });
    });

    it('should combine signal and timeout with AbortSignal.any', async () => {
      const controller = new AbortController();
      const mockTimeoutSignal = AbortSignal.timeout(5000);
      const mockCombinedController = new AbortController();
      const mockCombinedSignal = mockCombinedController.signal;

      vi.spyOn(AbortSignal, 'timeout').mockReturnValueOnce(mockTimeoutSignal);
      vi.spyOn(AbortSignal, 'any').mockReturnValueOnce(mockCombinedSignal);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => await Promise.resolve({}),
      });

      await client.get('/api/test', { signal: controller.signal, timeout: 5000 });

      expect(AbortSignal.any).toHaveBeenCalledWith([controller.signal, mockTimeoutSignal]);
      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {},
        signal: mockCombinedSignal,
      });
    });
  });
});

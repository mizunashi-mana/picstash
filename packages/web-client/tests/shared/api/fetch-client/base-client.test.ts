import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseHttpClient } from '@/shared/api/fetch-client/base-client';

describe('BaseHttpClient', () => {
  let client: BaseHttpClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    client = new BaseHttpClient();
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
      });
      expect(result).toEqual(mockData);
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
      });
      expect(result).toEqual(mockData);
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
});

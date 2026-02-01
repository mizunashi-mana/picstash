import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/shared/api/client';

describe('apiClient', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it('should make a GET request to the endpoint', async () => {
    const mockData = { id: '1', name: 'test' };
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => await Promise.resolve(mockData),
    });

    const result = await apiClient('/api/test');

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      headers: {},
    });
    expect(result).toEqual(mockData);
  });

  it('should append query params to the URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => await Promise.resolve({}),
    });

    await apiClient('/api/test', { params: { q: 'search', limit: '10' } });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test?q=search&limit=10',
      expect.any(Object),
    );
  });

  it('should set Content-Type header when body is provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => await Promise.resolve({}),
    });

    await apiClient('/api/test', {
      method: 'POST',
      body: JSON.stringify({ name: 'test' }),
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      body: JSON.stringify({ name: 'test' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('should not set Content-Type header when no body is provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => await Promise.resolve({}),
    });

    await apiClient('/api/test', { method: 'GET' });

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'GET',
      headers: {},
    });
  });

  it('should merge custom headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => await Promise.resolve({}),
    });

    await apiClient('/api/test', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'X-Custom-Header': 'value' },
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'value',
      },
    });
  });

  it('should throw an error when response is not ok', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(apiClient('/api/test')).rejects.toThrow(
      'API Error: 404 Not Found',
    );
  });

  it('should return undefined for 204 No Content responses', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
    });

    const result = await apiClient('/api/test', { method: 'DELETE' });

    expect(result).toBeUndefined();
  });

  it('should handle 500 server errors', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(apiClient('/api/test')).rejects.toThrow(
      'API Error: 500 Internal Server Error',
    );
  });
});

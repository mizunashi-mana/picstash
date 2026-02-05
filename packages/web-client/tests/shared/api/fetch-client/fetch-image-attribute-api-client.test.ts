import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type BaseHttpClient } from '@/shared/api/fetch-client/base-client';
import { FetchImageAttributeApiClient } from '@/shared/api/fetch-client/fetch-image-attribute-api-client';

describe('FetchImageAttributeApiClient', () => {
  let client: FetchImageAttributeApiClient;
  let mockHttp: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockHttp = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    client = new FetchImageAttributeApiClient(mockHttp as unknown as BaseHttpClient);
  });

  it('should call http.get for list', async () => {
    const mockData = [{ id: '1', name: 'attr1', value: 'value1' }];
    mockHttp.get.mockResolvedValueOnce(mockData);

    const result = await client.list('img-1');

    expect(mockHttp.get).toHaveBeenCalledWith('/api/images/img-1/attributes');
    expect(result).toEqual(mockData);
  });

  it('should call http.post for create', async () => {
    const mockData = { id: '1', labelId: 'label-1', keywords: 'test' };
    mockHttp.post.mockResolvedValueOnce(mockData);

    const result = await client.create('img-1', { labelId: 'label-1', keywords: 'test' });

    expect(mockHttp.post).toHaveBeenCalledWith('/api/images/img-1/attributes', {
      labelId: 'label-1',
      keywords: 'test',
    });
    expect(result).toEqual(mockData);
  });

  it('should call http.put for update', async () => {
    const mockData = { id: '1', labelId: 'label-1', keywords: 'updated' };
    mockHttp.put.mockResolvedValueOnce(mockData);

    const result = await client.update('img-1', 'attr-1', { keywords: 'updated' });

    expect(mockHttp.put).toHaveBeenCalledWith('/api/images/img-1/attributes/attr-1', {
      keywords: 'updated',
    });
    expect(result).toEqual(mockData);
  });

  it('should call http.delete for delete', async () => {
    mockHttp.delete.mockResolvedValueOnce(undefined);

    await client.delete('img-1', 'attr-1');

    expect(mockHttp.delete).toHaveBeenCalledWith('/api/images/img-1/attributes/attr-1');
  });
});

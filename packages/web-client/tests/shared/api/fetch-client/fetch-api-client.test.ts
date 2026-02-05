import { describe, expect, it } from 'vitest';
import { FetchApiClient, createFetchApiClient } from '@/shared/api/fetch-client';

describe('FetchApiClient', () => {
  it('should create an instance with all API client properties', () => {
    const client = new FetchApiClient();

    expect(client.images).toBeDefined();
    expect(client.imageAttributes).toBeDefined();
    expect(client.collections).toBeDefined();
    expect(client.labels).toBeDefined();
    expect(client.search).toBeDefined();
    expect(client.stats).toBeDefined();
    expect(client.viewHistory).toBeDefined();
    expect(client.recommendations).toBeDefined();
    expect(client.archiveImport).toBeDefined();
    expect(client.urlCrawl).toBeDefined();
    expect(client.description).toBeDefined();
    expect(client.jobs).toBeDefined();
  });
});

describe('createFetchApiClient', () => {
  it('should return a FetchApiClient instance', () => {
    const client = createFetchApiClient();

    expect(client).toBeInstanceOf(FetchApiClient);
  });

  it('should return a new instance on each call', () => {
    const client1 = createFetchApiClient();
    const client2 = createFetchApiClient();

    expect(client1).not.toBe(client2);
  });
});

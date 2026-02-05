import { API_TYPES, createApiClient, type ApiClient, type HttpClient } from '@picstash/api';
import { Container } from 'inversify';
import { FetchHttpClient } from '@/shared/api/fetch-http-client';

/**
 * Creates and configures the web-client DI container.
 *
 * Binds:
 * - API_TYPES.HttpClient -> FetchHttpClient instance (singleton)
 * - API_TYPES.ApiClient -> ApiClient instance created with HttpClient (singleton)
 */
export function createContainer(): Container {
  const container = new Container();

  // Bind HttpClient to FetchHttpClient instance as a singleton
  const httpClient = new FetchHttpClient();
  container.bind<HttpClient>(API_TYPES.HttpClient).toConstantValue(httpClient);

  // Bind ApiClient using createApiClient from @picstash/api
  container.bind<ApiClient>(API_TYPES.ApiClient).toConstantValue(createApiClient(httpClient));

  return container;
}

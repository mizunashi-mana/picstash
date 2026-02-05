import { API_TYPES, type ApiClient } from '@picstash/api';
import { Container } from 'inversify';
import { createFetchApiClient } from '@/shared/api/fetch-client';

/**
 * Creates and configures the web-client DI container.
 *
 * Binds:
 * - API_TYPES.ApiClient -> FetchApiClient instance (singleton)
 */
export function createContainer(): Container {
  const container = new Container();

  // Bind ApiClient to FetchApiClient instance as a singleton
  // Using toConstantValue avoids the need for @injectable() decorator
  container.bind<ApiClient>(API_TYPES.ApiClient).toConstantValue(createFetchApiClient());

  return container;
}

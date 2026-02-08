import { API_TYPES, createApiClient, type ApiClient, type HttpClient } from '@picstash/api';
import { Container } from 'inversify';
import { IpcHttpClientWithFormData } from '@/shared/api';

/**
 * HttpClient を作成
 *
 * desktop-app はローカルストレージベースのため、常に IPC 経由で
 * CoreContainer にアクセスする
 */
function createHttpClient(): HttpClient {
  return new IpcHttpClientWithFormData();
}

/**
 * Creates and configures the desktop-app DI container.
 *
 * Binds:
 * - API_TYPES.HttpClient -> HttpClient instance (singleton, environment-dependent)
 * - API_TYPES.ApiClient -> ApiClient instance created with HttpClient (singleton)
 */
export function createContainer(): Container {
  const container = new Container();

  // Bind HttpClient based on environment (IPC for production, Fetch for development)
  const httpClient = createHttpClient();
  container.bind<HttpClient>(API_TYPES.HttpClient).toConstantValue(httpClient);

  // Bind ApiClient using createApiClient from @picstash/api
  container.bind<ApiClient>(API_TYPES.ApiClient).toConstantValue(createApiClient(httpClient));

  return container;
}

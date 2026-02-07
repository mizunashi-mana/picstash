import { API_TYPES, createApiClient, type ApiClient, type HttpClient } from '@picstash/api';
import { Container } from 'inversify';
import { FetchHttpClient, IpcHttpClientWithFormData } from '@/shared/api';

/**
 * 実行環境を検出
 *
 * - file:// プロトコル: プロダクションモード（Electron でパッケージ済み）
 * - http:// / https://: 開発モード（Vite dev server）
 */
function isProductionMode(): boolean {
  return window.location.protocol === 'file:';
}

/**
 * 環境に応じた HttpClient を作成
 *
 * - プロダクションモード: IpcHttpClient（IPC 経由で CoreContainer にアクセス）
 * - 開発モード: FetchHttpClient（HTTP 経由で API サーバーにアクセス）
 */
function createHttpClient(): HttpClient {
  if (isProductionMode()) {
    return new IpcHttpClientWithFormData();
  }
  return new FetchHttpClient();
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

/**
 * Fetch HTTP Client
 *
 * @picstash/api の HttpClient interface を fetch API で実装
 */

import type { HttpClient, RequestOptions } from '@picstash/api';

/**
 * fetch API を使用した HttpClient 実装
 *
 * @example
 * ```typescript
 * const httpClient = new FetchHttpClient();
 * const apiClient = createApiClient(httpClient);
 * ```
 */
export class FetchHttpClient implements HttpClient {
  /**
   * GET リクエストを送信
   */
  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    return await this.request<T>(url, { method: 'GET' }, options);
  }

  /**
   * POST リクエストを送信（JSON）
   */
  async post<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return await this.request<T>(
      url,
      {
        method: 'POST',
        body: body !== undefined ? JSON.stringify(body) : undefined,
      },
      options,
    );
  }

  /**
   * PUT リクエストを送信（JSON）
   */
  async put<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return await this.request<T>(
      url,
      {
        method: 'PUT',
        body: body !== undefined ? JSON.stringify(body) : undefined,
      },
      options,
    );
  }

  /**
   * PATCH リクエストを送信（JSON）
   */
  async patch<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return await this.request<T>(
      url,
      {
        method: 'PATCH',
        body: body !== undefined ? JSON.stringify(body) : undefined,
      },
      options,
    );
  }

  /**
   * DELETE リクエストを送信
   */
  async delete(url: string, options?: RequestOptions): Promise<void> {
    await this.request<undefined>(url, { method: 'DELETE' }, options);
  }

  /**
   * FormData を POST リクエストで送信（ファイルアップロード用）
   * Content-Type header は設定しない（ブラウザが multipart boundary を設定）
   */
  async postFormData<T>(
    url: string,
    formData: FormData,
    options?: RequestOptions,
  ): Promise<T> {
    const signal = this.createSignal(options);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: options?.headers,
      signal,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    // 204 No Content をハンドリング
    if (response.status === 204) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 204 returns no content
      return undefined as T;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- response.json() returns unknown
    return (await response.json()) as T;
  }

  /**
   * AbortSignal を作成（タイムアウトまたはユーザー指定の signal を使用）
   */
  private createSignal(options?: RequestOptions): AbortSignal | undefined {
    if (options?.signal !== undefined && options.timeout !== undefined) {
      // 両方指定された場合は AbortSignal.any() で合成
      return AbortSignal.any([
        options.signal,
        AbortSignal.timeout(options.timeout),
      ]);
    }
    if (options?.signal !== undefined) {
      return options.signal;
    }
    if (options?.timeout !== undefined) {
      return AbortSignal.timeout(options.timeout);
    }
    return undefined;
  }

  /**
   * コアリクエストメソッド
   */
  private async request<T>(
    url: string,
    init: RequestInit,
    options?: RequestOptions,
  ): Promise<T> {
    const headers: Record<string, string>
      = init.body !== undefined
        ? { 'Content-Type': 'application/json', ...options?.headers }
        : { ...options?.headers };

    const signal = this.createSignal(options);

    const response = await fetch(url, {
      ...init,
      headers,
      signal,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    // 204 No Content をハンドリング
    if (response.status === 204) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 204 returns no content
      return undefined as T;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- response.json() returns unknown
    return (await response.json()) as T;
  }
}

/**
 * IPC HTTP Client
 *
 * @picstash/api の HttpClient interface を IPC 経由で実装
 * プロダクションモードで使用し、メインプロセスの CoreContainer に直接アクセスする
 */

import type { GenericAPI } from '@desktop-app/shared/types.js';
import type { HttpClient, RequestOptions } from '@picstash/api';

/**
 * window.picstash.api を安全に取得
 * @throws IPC が利用できない場合
 */
function getPicstashApi(): GenericAPI {
  if (window.picstash?.api === undefined) {
    throw new Error('IpcHttpClient requires window.picstash.api to be available (Electron only)');
  }
  return window.picstash.api;
}

/**
 * IPC を使用した HttpClient 実装
 *
 * fetch API の代わりに getPicstashApi().request を使用して
 * メインプロセスの CoreContainer に直接リクエストを送信する。
 *
 * @example
 * ```typescript
 * const httpClient = new IpcHttpClient();
 * const apiClient = createApiClient(httpClient);
 * ```
 */
export class IpcHttpClient implements HttpClient {
  /**
   * GET リクエストを送信
   */
  async get<T>(url: string, _options?: RequestOptions): Promise<T> {
    return await this.request<T>('GET', url);
  }

  /**
   * POST リクエストを送信（JSON）
   */
  async post<T>(url: string, body?: unknown, _options?: RequestOptions): Promise<T> {
    return await this.request<T>('POST', url, body);
  }

  /**
   * PUT リクエストを送信（JSON）
   */
  async put<T>(url: string, body?: unknown, _options?: RequestOptions): Promise<T> {
    return await this.request<T>('PUT', url, body);
  }

  /**
   * PATCH リクエストを送信（JSON）
   */
  async patch<T>(url: string, body?: unknown, _options?: RequestOptions): Promise<T> {
    return await this.request<T>('PATCH', url, body);
  }

  /**
   * DELETE リクエストを送信
   */
  async delete(url: string, _options?: RequestOptions): Promise<void> {
    await this.request<undefined>('DELETE', url);
  }

  /**
   * FormData を POST リクエストで送信（ファイルアップロード用）
   *
   * FormData の最初のファイルフィールドを抽出してシリアライズする
   */
  async postFormData<T>(
    url: string,
    formData: FormData,
    _options?: RequestOptions,
  ): Promise<T> {
    // FormData からファイルを抽出
    const formDataEntry = this.extractFormDataFile(formData);

    const response = await getPicstashApi().request({
      method: 'POST',
      url,
      formData: formDataEntry,
    });

    if (response.error !== undefined) {
      throw new Error(`API Error: ${response.status} ${response.error}`);
    }

    // 204 No Content をハンドリング
    if (response.status === 204) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 204 returns no content
      return undefined as T;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- response.data is typed by API
    return response.data as T;
  }

  /**
   * FormData から最初のファイルを抽出してシリアライズ
   */
  private extractFormDataFile(formData: FormData): {
    fieldName: string;
    data: ArrayBuffer;
    filename: string;
    contentType: string;
  } | undefined {
    for (const [_fieldName, value] of formData.entries()) {
      if (value instanceof File) {
        // File から ArrayBuffer を同期的に取得できないため、
        // 呼び出し元で事前に処理する必要がある
        // ここでは postFormData を async で実装し直す
        throw new Error(
          'File objects in FormData are not supported. Use postFormDataWithFile instead.',
        );
      }
    }
    return undefined;
  }

  /**
   * コアリクエストメソッド
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    body?: unknown,
  ): Promise<T> {
    const response = await getPicstashApi().request({
      method,
      url,
      body,
    });

    if (response.error !== undefined) {
      throw new Error(`API Error: ${response.status} ${response.error}`);
    }

    // 204 No Content をハンドリング
    if (response.status === 204) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 204 returns no content
      return undefined as T;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- response.data is typed by API
    return response.data as T;
  }
}

/**
 * FormData 対応の IPC HTTP Client
 *
 * ファイルアップロードを ArrayBuffer に変換して送信する拡張版
 */
export class IpcHttpClientWithFormData extends IpcHttpClient {
  /**
   * FormData を POST リクエストで送信（ファイルアップロード用）
   *
   * File オブジェクトを ArrayBuffer に変換してシリアライズする
   */
  override async postFormData<T>(
    url: string,
    formData: FormData,
    _options?: RequestOptions,
  ): Promise<T> {
    // FormData からファイルを抽出
    const formDataEntry = await this.extractFormDataFileAsync(formData);

    const response = await getPicstashApi().request({
      method: 'POST',
      url,
      formData: formDataEntry,
    });

    if (response.error !== undefined) {
      throw new Error(`API Error: ${response.status} ${response.error}`);
    }

    // 204 No Content をハンドリング
    if (response.status === 204) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 204 returns no content
      return undefined as T;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- response.data is typed by API
    return response.data as T;
  }

  /**
   * FormData から最初のファイルを非同期で抽出してシリアライズ
   */
  private async extractFormDataFileAsync(formData: FormData): Promise<{
    fieldName: string;
    data: ArrayBuffer;
    filename: string;
    contentType: string;
  } | undefined> {
    for (const [fieldName, value] of formData.entries()) {
      if (value instanceof File) {
        const arrayBuffer = await value.arrayBuffer();
        return {
          fieldName,
          data: arrayBuffer,
          filename: value.name,
          contentType: value.type !== '' ? value.type : 'application/octet-stream',
        };
      }
    }
    return undefined;
  }
}

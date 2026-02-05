/**
 * HTTP Client Interface
 *
 * HTTP リクエストを抽象化するインターフェース。
 * クライアントパッケージ（web-client, desktop-app 等）はこのインターフェースを実装し、
 * API Client はこのインターフェースを通じて HTTP リクエストを行う。
 */

/**
 * HTTP リクエストのオプション
 */
export interface RequestOptions {
  /**
   * リクエストヘッダー
   */
  headers?: Record<string, string>;

  /**
   * タイムアウト（ミリ秒）
   */
  timeout?: number;

  /**
   * AbortSignal（リクエストキャンセル用）
   */
  signal?: AbortSignal;
}

/**
 * HTTP Client インターフェース
 *
 * URL ビルドは ApiClient の責務であり、HttpClient は与えられた URL に対して
 * HTTP リクエストを送信し、レスポンスを返す。
 */
export interface HttpClient {
  /**
   * GET リクエストを送信
   * @param url リクエスト先 URL
   * @param options リクエストオプション
   * @returns レスポンスボディ
   */
  get: <T>(url: string, options?: RequestOptions) => Promise<T>;

  /**
   * POST リクエストを送信
   * @param url リクエスト先 URL
   * @param body リクエストボディ
   * @param options リクエストオプション
   * @returns レスポンスボディ
   */
  post: <T>(url: string, body?: unknown, options?: RequestOptions) => Promise<T>;

  /**
   * PUT リクエストを送信
   * @param url リクエスト先 URL
   * @param body リクエストボディ
   * @param options リクエストオプション
   * @returns レスポンスボディ
   */
  put: <T>(url: string, body?: unknown, options?: RequestOptions) => Promise<T>;

  /**
   * PATCH リクエストを送信
   * @param url リクエスト先 URL
   * @param body リクエストボディ
   * @param options リクエストオプション
   * @returns レスポンスボディ
   */
  patch: <T>(url: string, body?: unknown, options?: RequestOptions) => Promise<T>;

  /**
   * DELETE リクエストを送信
   * @param url リクエスト先 URL
   * @param options リクエストオプション
   */
  delete: (url: string, options?: RequestOptions) => Promise<void>;

  /**
   * FormData を POST リクエストで送信（ファイルアップロード用）
   * @param url リクエスト先 URL
   * @param formData 送信する FormData
   * @param options リクエストオプション
   * @returns レスポンスボディ
   */
  postFormData: <T>(
    url: string,
    formData: FormData,
    options?: RequestOptions,
  ) => Promise<T>;
}

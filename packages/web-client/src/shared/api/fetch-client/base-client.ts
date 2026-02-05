/**
 * Base HTTP Client
 *
 * Shared fetch logic used by all FetchApiClient implementations.
 */

interface FetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
}

/**
 * Base HTTP client providing common fetch operations.
 */
export class BaseHttpClient {
  /**
   * Perform a GET request and return JSON response.
   */
  async get<T>(url: string): Promise<T> {
    return await this.request<T>(url, { method: 'GET' });
  }

  /**
   * Perform a POST request with JSON body.
   */
  async post<T>(url: string, body?: unknown): Promise<T> {
    return await this.request<T>(url, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Perform a PUT request with JSON body.
   */
  async put<T>(url: string, body?: unknown): Promise<T> {
    return await this.request<T>(url, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Perform a PATCH request with JSON body.
   */
  async patch<T>(url: string, body?: unknown): Promise<T> {
    return await this.request<T>(url, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Perform a DELETE request.
   */
  async delete(url: string): Promise<void> {
    await this.request<undefined>(url, { method: 'DELETE' });
  }

  /**
   * Perform a POST request with FormData body (for file uploads).
   * Content-Type header is not set to allow browser to set multipart boundary.
   */
  async postFormData<T>(url: string, formData: FormData): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- response.json() returns unknown
    return await (response.json() as Promise<T>);
  }

  /**
   * Core request method with common error handling.
   */
  private async request<T>(
    url: string,
    options: FetchOptions,
  ): Promise<T> {
    const headers: Record<string, string>
      = options.body !== undefined
        ? { 'Content-Type': 'application/json', ...options.headers }
        : { ...options.headers };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 204 returns no content
      return undefined as T;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- response.json() returns unknown
    return await (response.json() as Promise<T>);
  }
}

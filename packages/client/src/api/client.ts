const API_BASE_URL = '/api';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Only set Content-Type for requests with a body
  const headers: HeadersInit = fetchOptions.body !== undefined
    ? {
        'Content-Type': 'application/json',
        // eslint-disable-next-line @typescript-eslint/no-misused-spread -- HeadersInit spread is valid
        ...fetchOptions.headers,
      }
    : {
        // eslint-disable-next-line @typescript-eslint/no-misused-spread -- HeadersInit spread is valid
        ...fetchOptions.headers,
      };

  const response = await fetch(url, {
    ...fetchOptions,
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

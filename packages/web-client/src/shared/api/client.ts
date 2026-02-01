interface FetchOptions extends Omit<RequestInit, 'headers'> {
  params?: Record<string, string>;
  headers?: Record<string, string>;
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Only set Content-Type for requests with a body
  const headers: Record<string, string> = fetchOptions.body !== undefined
    ? {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      }
    : {
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

/**
 * URL ビルダーユーティリティ
 *
 * クエリパラメータ付き URL を構築するヘルパー関数
 */

/**
 * クエリパラメータ値型
 */
export type QueryParamValue = string | number | boolean | undefined | null;

/**
 * クエリパラメータ型
 */
export type QueryParams = {
  [key: string]: QueryParamValue;
};

/**
 * クエリパラメータ付き URL を構築する
 *
 * undefined/null のパラメータは自動的に除外される
 *
 * @param path - ベースパス (例: '/api/images')
 * @param params - クエリパラメータ
 * @returns クエリパラメータ付き URL
 *
 * @example
 * buildUrl('/api/images', { q: 'search', limit: 50 })
 * // => '/api/images?q=search&limit=50'
 *
 * buildUrl('/api/images', { q: undefined, limit: 50 })
 * // => '/api/images?limit=50'
 */
export function buildUrl<T extends Record<string, QueryParamValue>>(
  path: string,
  params?: T,
): string {
  if (params === undefined) {
    return path;
  }

  const filteredEntries = Object.entries(params).filter(
    (entry): entry is [string, string | number | boolean] =>
      entry[1] !== undefined && entry[1] !== null,
  );

  if (filteredEntries.length === 0) {
    return path;
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of filteredEntries) {
    searchParams.set(key, String(value));
  }

  return `${path}?${searchParams.toString()}`;
}

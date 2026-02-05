# T3: FetchHttpClient 実装

プロジェクト: [API Client Interface](../../projects/20260205-api-client-interface/README.md)

## 目的・ゴール

`@picstash/api` の `HttpClient` interface を実装した `FetchHttpClient` クラスを web-client に作成する。これにより、web-client は `createApiClient(httpClient)` で ApiClient を生成できるようになる。

## 現状分析

### 既存の実装

`packages/web-client/src/shared/api/fetch-client/base-client.ts` に `BaseHttpClient` クラスが存在:

- `get<T>(url)` — GET リクエスト
- `post<T>(url, body?)` — POST リクエスト（JSON）
- `put<T>(url, body?)` — PUT リクエスト（JSON）
- `patch<T>(url, body?)` — PATCH リクエスト（JSON）
- `delete(url)` — DELETE リクエスト
- `postFormData<T>(url, formData)` — FormData POST

### HttpClient interface との差異

- `HttpClient` は各メソッドに `RequestOptions` パラメータを持つ（headers, timeout, signal）
- `BaseHttpClient` は `RequestOptions` をサポートしていない

## 実装方針

1. `packages/web-client/src/shared/api/fetch-http-client.ts` を作成
2. `HttpClient` interface を実装
3. 既存の `BaseHttpClient` のロジックを参考に、`RequestOptions` をサポート
4. エラーハンドリング、204 No Content 対応を維持
5. タイムアウト機能を AbortController で実装

## 完了条件

- [ ] `FetchHttpClient` が `HttpClient` interface を満たす
- [ ] `RequestOptions`（headers, timeout, signal）をサポート
- [ ] 204 No Content の適切なハンドリング
- [ ] typecheck が通る
- [ ] lint が通る

## 作業ログ

### 2026-02-06

- タスク開始

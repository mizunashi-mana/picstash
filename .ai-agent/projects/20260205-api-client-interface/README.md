# API クライアントを api パッケージで提供する

GitHub Issue: https://github.com/mizunashi-mana/picstash/issues/159

## 目標

`@picstash/api` パッケージに HTTP Client interface と API Client 実装を提供し、web-client の各 API アダプター（14 ファイル・54 関数）を置き換える。クライアントパッケージでは URL 文字列を一切扱わず、HTTP Client interface の実装のみを提供する形にする。

### 完了条件

- `@picstash/api` に `HttpClient` interface が定義されている
- `@picstash/api` に `HttpClient` を受け取って API Client を生成する関数（`createApiClient`）が提供されている
- `@picstash/api` に DI トークン（`API_TYPES`）が定義されている
- web-client に inversify が導入され、`FetchHttpClient` 実装がコンテナにバインドされている
- React Context（`ContainerProvider`）+ hooks（`useApiClient`）で API クライアントが利用可能
- 既存の 14 API アダプターファイルが API Client 経由に移行されている
- 全テスト・型チェック・lint が通る
- Storybook が動作する

## アーキテクチャ

### 新しい設計

```
@picstash/api
├── HttpClient interface   — HTTP リクエストの抽象化
│   ├── get<T>(url, options?)
│   ├── post<T>(url, body?, options?)
│   ├── put<T>(url, body?, options?)
│   ├── patch<T>(url, body?, options?)
│   ├── delete(url, options?)
│   └── postFormData<T>(url, formData, options?)
│
├── ApiClient 実装         — HttpClient を受け取り、URL ビルド + API 呼び出しを行う
│   ├── images: ImageApiClient
│   ├── collections: CollectionApiClient
│   ├── labels: LabelApiClient
│   ├── ... (その他のリソース)
│   └── createApiClient(http: HttpClient): ApiClient
│
└── エンドポイント定義（内部で使用）
    └── URL 生成は ApiClient 内部で行い、外部には公開しない

web-client
├── shared/api/FetchHttpClient   — HttpClient interface の fetch ベース実装
├── shared/di/container.ts       — FetchHttpClient を HttpClient としてバインド
│                                  createApiClient(http) で ApiClient を生成
└── 各コンポーネント              — useApiClient() 経由で API Client を利用
```

### 利点

1. **URL 文字列の局所化**: URL ビルドのロジックは全て api パッケージに集約。クライアントパッケージでは URL を扱わない
2. **シンプルな責務分離**: web-client は HTTP Client の実装（fetch）のみ、api パッケージは API の抽象化を担当
3. **テスト容易性**: HttpClient をモックすれば API Client 全体をモック可能
4. **再利用性**: 他のクライアント（desktop-app 等）でも同じ ApiClient を使い、HttpClient のみ差し替え可能

### 型定義イメージ

```typescript
// @picstash/api

/** HTTP Client interface */
export interface HttpClient {
  get<T>(url: string, options?: RequestOptions): Promise<T>;
  post<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T>;
  put<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T>;
  patch<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T>;
  delete(url: string, options?: RequestOptions): Promise<void>;
  postFormData<T>(url: string, formData: FormData, options?: RequestOptions): Promise<T>;
}

/** API Client（HttpClient を受け取って生成） */
export interface ApiClient {
  readonly images: ImageApiClient;
  readonly imageAttributes: ImageAttributeApiClient;
  readonly collections: CollectionApiClient;
  readonly labels: LabelApiClient;
  readonly search: SearchApiClient;
  readonly stats: StatsApiClient;
  readonly viewHistory: ViewHistoryApiClient;
  readonly recommendations: RecommendationsApiClient;
  readonly archiveImport: ArchiveImportApiClient;
  readonly urlCrawl: UrlCrawlApiClient;
  readonly description: DescriptionApiClient;
  readonly jobs: JobsApiClient;
}

/** API Client 生成関数 */
export function createApiClient(http: HttpClient): ApiClient;

/** DI トークン */
export const API_TYPES = {
  HttpClient: Symbol.for('HttpClient'),
  ApiClient: Symbol.for('ApiClient'),
};
```

```typescript
// web-client

// FetchHttpClient は HttpClient interface を実装
export class FetchHttpClient implements HttpClient {
  async get<T>(url: string): Promise<T> {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  }
  // ... 他のメソッド
}

// コンテナ設定
const container = new Container();
const httpClient = new FetchHttpClient();
container.bind<HttpClient>(API_TYPES.HttpClient).toConstantValue(httpClient);
container.bind<ApiClient>(API_TYPES.ApiClient).toConstantValue(createApiClient(httpClient));
```

## スコープ

### やること

- `@picstash/api` に `HttpClient` interface を定義
- `@picstash/api` に `createApiClient(http: HttpClient): ApiClient` 関数を実装
- `@picstash/api` に各リソースの API Client 実装を追加
- `@picstash/api` に DI トークン定義を追加
- web-client に `FetchHttpClient` 実装を作成
- web-client の inversify コンテナで HttpClient と ApiClient をバインド
- 既存 14 API アダプターファイル（entities: 3, features: 11）を ApiClient 経由に移行

### やらないこと

- server パッケージへの ApiClient 導入（別プロジェクトで対応）
- desktop-app への適用（web-client 完了後に別途対応）
- OpenAPI スキーマ生成やコード生成ツールの導入
- inversify の API クライアント以外への活用拡大（段階的に別タスクで対応）

## 現状分析

### 現在のアーキテクチャ

```
@picstash/api
├── エンドポイント定義（URL 生成関数 + Fastify ルートパターン）
│   ├── imageEndpoints      (12 メソッド)
│   ├── collectionsEndpoints (7 メソッド)
│   ├── labelsEndpoints      (5 メソッド)
│   └── ...
└── 共有型定義（Label, ImageListQuery, StatsQueryOptions 等）

web-client
├── shared/api/client.ts      — apiClient<T>(endpoint, options) ジェネリック fetch ラッパー
├── shared/api/fetch-client/  — FetchApiClient 実装（現在の状態）
├── entities/*/api/*.ts        — 3 ファイル (image: 7関数, collection: 9関数, label: 5関数)
└── features/*/api/*.ts        — 11 ファイル (合計 33関数)
```

### 問題点

1. URL ビルドロジックが web-client の FetchApiClient に分散している
2. エンドポイント定義（URL 生成関数）を web-client が直接使用しており、依存が強い
3. クライアントパッケージごとに URL 文字列を扱うコードが必要になる

## タスク分解

| ID | タスク | 依存 | 優先度 | 状態 |
|----|--------|------|--------|------|
| T1 | `@picstash/api` に HttpClient interface を定義 | - | 高 | 完了 |
| T2 | `@picstash/api` に ApiClient 実装を追加 | T1 | 高 | 完了 |
| T3 | web-client に FetchHttpClient 実装を作成 | T1 | 高 | 未着手 |
| T4 | web-client の既存 FetchApiClient を削除し、api パッケージの ApiClient に移行 | T2, T3 | 高 | 未着手 |
| T5 | entities 層の API アダプター移行 | T4 | 中 | 未着手 |
| T6 | features 層の API アダプター移行 | T4 | 中 | 未着手 |
| T7 | テスト・Storybook 対応 | T5, T6 | 中 | 未着手 |
| T8 | クリーンアップ・ドキュメント更新 | T7 | 低 | 未着手 |

### 依存関係図

```
T1 (HttpClient interface)
├── T2 (ApiClient 実装 in @picstash/api)
│   └── T4 (web-client 移行)
│       ├── T5 (entities アダプター移行)
│       └── T6 (features アダプター移行)
│           │
│           T7 (テスト・Storybook)
│           └── T8 (クリーンアップ)
└── T3 (FetchHttpClient 実装)
    └── T4
```

### 各タスクの詳細

#### T1: `@picstash/api` に HttpClient interface を定義

- **概要**: HTTP リクエストを抽象化する `HttpClient` interface を定義
- **作業内容**:
  - `packages/api/src/client/http-client.ts` を作成
  - `HttpClient` interface を定義（get, post, put, patch, delete, postFormData）
  - `RequestOptions` 型を定義（必要に応じてヘッダー等を渡せるように）
  - `packages/api/src/index.ts` からエクスポート
- **完了条件**: `@picstash/api` から `HttpClient` interface がインポート可能

#### T2: `@picstash/api` に ApiClient 実装を追加

- **概要**: HttpClient を受け取り、URL ビルド + API 呼び出しを行う ApiClient を実装
- **作業内容**:
  - `packages/api/src/client/api-client.ts` に `createApiClient(http: HttpClient): ApiClient` を実装
  - 各リソースの ApiClient 実装:
    - `ImageApiClientImpl` — imageEndpoints を使って URL をビルドし、http に委譲
    - `CollectionApiClientImpl` — collectionsEndpoints を使用
    - `LabelApiClientImpl` — labelsEndpoints を使用
    - ... 他のリソースも同様
  - 既存の interface 定義（`ImageApiClient` 等）はそのまま使用
  - `API_TYPES` に `HttpClient` シンボルを追加
- **完了条件**: `createApiClient(http)` が動作し、全リソースの API Client が利用可能

#### T3: web-client に FetchHttpClient 実装を作成

- **概要**: `HttpClient` interface の fetch ベース実装を作成
- **作業内容**:
  - `packages/web-client/src/shared/api/fetch-http-client.ts` を作成
  - `FetchHttpClient` クラスを実装（既存の `BaseHttpClient` を参考に）
  - エラーハンドリング、204 No Content 対応等を含める
- **完了条件**: `FetchHttpClient` が `HttpClient` interface を満たす

#### T4: web-client の既存 FetchApiClient を削除し、api パッケージの ApiClient に移行

- **概要**: web-client の FetchApiClient を削除し、api パッケージの ApiClient を使用するように変更
- **作業内容**:
  - `packages/web-client/src/shared/api/fetch-client/` ディレクトリを削除
  - `shared/di/container.ts` を更新:
    - FetchHttpClient を HttpClient としてバインド
    - `createApiClient(httpClient)` で ApiClient を生成してバインド
  - `useApiClient()` hook は変更なし（ApiClient を返す）
- **完了条件**: web-client が api パッケージの ApiClient を使用、既存のテストが通る

#### T5: entities 層の API アダプター移行

- **概要**: entities の API アダプター（image, collection, label）を `ApiClient` 経由に移行
- **作業内容**:
  - 各 entity の `api/*.ts` ファイルを `useApiClient()` 経由に変更
  - または: entities の API モジュールを廃止し、直接 `useApiClient()` を使用
- **完了条件**: entities の API 呼び出しが全て ApiClient 経由

#### T6: features 層の API アダプター移行

- **概要**: features の API アダプター（11 ファイル）を `ApiClient` 経由に移行
- **作業内容**:
  - 各 feature の `api/*.ts` ファイルを ApiClient 経由に移行
- **完了条件**: features の API 呼び出しが全て ApiClient 経由

#### T7: テスト・Storybook 対応

- **概要**: 移行後のテスト・Storybook の動作を確保
- **作業内容**:
  - 既存ユニットテストの更新（API モック方法の変更）
  - HttpClient をモックしたテスト用コンテナの作成
  - Storybook decorator の更新
- **完了条件**: 全テスト・lint・Storybook テストが通る

#### T8: クリーンアップ・ドキュメント更新

- **概要**: 不要になったコードの削除とドキュメント更新
- **作業内容**:
  - `shared/api/client.ts`（旧 `apiClient` 関数）の削除
  - 不要になった直接インポート（`imageEndpoints` 等）の削除
  - dependency-cruiser ルールの更新
- **完了条件**: 不要コードが削除され、ドキュメントが最新状態

## 設計上のポイント

1. **HttpClient の責務**: HTTP リクエストの送信と基本的なエラーハンドリングのみ。URL ビルドは ApiClient の責務
2. **URL 生成関数の扱い**: エンドポイント定義（imageEndpoints 等）は api パッケージ内部でのみ使用。外部からは ApiClient 経由でアクセス
3. **FormData アップロード**: `postFormData` メソッドで対応。ApiClient 内で FormData を構築し、HttpClient に渡す
4. **inversify の活用**: HttpClient と ApiClient の両方をコンテナで管理。テスト時は MockHttpClient を注入可能
5. **段階的移行**: 既存の関数エクスポートを一時的にラッパーとして維持し、段階的に直接 `useApiClient()` 使用に移行

## 進捗

- 2026-02-05: プロジェクト開始、計画策定
- 2026-02-05: web-client に inversify を導入（PR #164 でマージ済み）
- 2026-02-05: 方針変更 — HttpClient interface を api パッケージで定義し、ApiClient 実装も api パッケージで提供する方向に変更
- 2026-02-05: T1 完了 — HttpClient interface を定義（PR #167 でマージ済み）
- 2026-02-06: T2 完了 — createApiClient 関数と 12 リソースの API Client 実装を追加

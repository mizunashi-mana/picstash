# API クライアントインターフェースを api パッケージで提供する

GitHub Issue: https://github.com/mizunashi-mana/picstash/issues/159

## 目標

`@picstash/api` パッケージに高レベルの API クライアントインターフェースを定義し、web-client の各 API アダプター（14 ファイル・54 関数）を inversify コンテナで管理される実装に置き換える。React Context + hooks で各コンポーネントから利用できるようにする。

### 完了条件

- `@picstash/api` にリソース単位の API クライアントインターフェース（`ImageApiClient`, `LabelApiClient` 等）と統合 `ApiClient` インターフェースが定義されている
- `@picstash/api` に DI トークン（`API_TYPES`）が定義されている
- web-client に inversify が導入され、`FetchApiClient` 実装がコンテナにバインドされている
- React Context（`ContainerProvider`）+ hooks（`useApiClient`）で API クライアントが利用可能
- 既存の 14 API アダプターファイルが `ApiClient` インターフェース経由に移行されている
- 全テスト・型チェック・lint が通る
- Storybook が動作する

## スコープ

### やること

- `@picstash/api` に API クライアントインターフェース群を追加
- `@picstash/api` に DI トークン定義を追加
- web-client に inversify を導入（`reflect-metadata` 含む）
- `FetchApiClient` 実装（fetch ベース）を作成
- inversify コンテナの React Context + hooks 連携
- 既存 14 API アダプターファイル（entities: 3, features: 11）を ApiClient 経由に移行
- 各 feature/entity の API モジュールのエクスポート更新

### やらないこと

- server パッケージへの ApiClient 導入（別プロジェクトで対応）
- desktop-app への適用（web-client 完了後に別途対応）
- OpenAPI スキーマ生成やコード生成ツールの導入
- inversify の API クライアント以外への活用拡大（段階的に別タスクで対応）
- `inversify-react` ライブラリの採用（自前の Context + hooks で十分）

## 現状分析

### 現在のアーキテクチャ

```
@picstash/api
├── エンドポイント定義（URL 生成関数 + Fastify ルートパターン）
│   ├── imageEndpoints      (12 メソッド)
│   ├── collectionsEndpoints (7 メソッド)
│   ├── labelsEndpoints      (5 メソッド)
│   ├── statsEndpoints       (4 メソッド)
│   ├── searchEndpoints      (4 メソッド)
│   ├── jobsEndpoints        (2 メソッド)
│   └── viewHistoryEndpoints (3 メソッド)
└── 共有型定義（Label, ImageListQuery, StatsQueryOptions 等）

web-client
├── shared/api/client.ts      — apiClient<T>(endpoint, options) ジェネリック fetch ラッパー
├── entities/*/api/*.ts        — 3 ファイル (image: 7関数, collection: 9関数, label: 5関数)
└── features/*/api/*.ts        — 11 ファイル (合計 33関数)
```

### 現在のパターン（各アダプターで繰り返されるボイラープレート）

```typescript
import { imageEndpoints } from '@picstash/api';
import { apiClient } from '@/shared/api/client';

export async function fetchImage(id: string): Promise<Image> {
  return await apiClient<Image>(imageEndpoints.detail(id));
}

export async function deleteImage(id: string): Promise<void> {
  await apiClient<undefined>(imageEndpoints.detail(id), { method: 'DELETE' });
}
```

### 問題点

1. 各アダプターで `apiClient(endpoint.xxx(...), { method, body })` のボイラープレートが重複
2. HTTP メソッド・ヘッダー・ボディのシリアライズ設定を各呼び出し箇所で手動指定
3. テスト時のモック化が困難（各関数を個別にモックする必要がある）
4. upload（FormData 直接 fetch）や duplicates（一部ハードコード URL）等の不整合

### 移行対象の API アダプター一覧（14 ファイル・54 関数）

| レイヤー | ファイル | 関数数 | 主な操作 |
|---------|---------|--------|---------|
| entities | image/api/image.ts | 7 | CRUD + URL生成 |
| entities | collection/api/collection.ts | 9 | CRUD + 画像管理 |
| entities | label/api/label.ts | 5 | CRUD |
| features | find-duplicates/api/duplicates.ts | 2 | 重複検出 + 削除 |
| features | find-similar-images/api/similar.ts | 1 | 類似画像取得 |
| features | import-archive/api/archive.ts | 7 | アーカイブインポート |
| features | import-url/api/crawl.ts | 6 | URL クロール |
| features | manage-image-attributes/api/attributes.ts | 5 | 属性管理 |
| features | manage-image-description/api/description.ts | 2 | 説明文生成 |
| features | search-images/api/search.ts | 5 | 検索 + 履歴 |
| features | track-view-history/api/view-history.ts | 4 | 閲覧履歴 |
| features | upload-image/api/upload.ts | 1 | アップロード |
| features | view-recommendations/api/recommendations.ts | 3 | レコメンド |
| features | view-stats/api/stats.ts | 4 | 統計 |

## タスク分解

| ID | タスク | 依存 | 優先度 | 状態 |
|----|--------|------|--------|------|
| T1 | `@picstash/api` にインターフェース定義を追加 | - | 高 | 未着手 |
| T2 | web-client に inversify を導入 | - | 高 | 完了 |
| T3 | FetchApiClient 実装（entities 系） | T1, T2 | 高 | 未着手 |
| T4 | FetchApiClient 実装（features 系） | T1, T2 | 高 | 未着手 |
| T5 | React Context + hooks 連携 | T2 | 高 | 未着手 |
| T6 | entities 層の API アダプター移行 | T3, T5 | 中 | 未着手 |
| T7 | features 層の API アダプター移行 | T4, T5 | 中 | 未着手 |
| T8 | テスト・Storybook 対応 | T6, T7 | 中 | 未着手 |
| T9 | クリーンアップ・ドキュメント更新 | T8 | 低 | 未着手 |

### 依存関係図

```
T1 (@picstash/api インターフェース)
│
├── T3 (FetchApiClient: entities)
│   └── T6 (entities アダプター移行)
│
├── T4 (FetchApiClient: features)
│   └── T7 (features アダプター移行)
│
T2 (inversify 導入)
├── T3
├── T4
└── T5 (React Context + hooks)
    ├── T6
    └── T7
        │
        T8 (テスト・Storybook)
        └── T9 (クリーンアップ)
```

### 各タスクの詳細

#### T1: `@picstash/api` にインターフェース定義を追加

- **概要**: リソース単位の API クライアントインターフェースと統合 `ApiClient` インターフェース、DI トークンを `@picstash/api` に追加する
- **作業内容**:
  - `packages/api/src/client/` ディレクトリを作成
  - リソース単位のインターフェース定義:
    - `ImageApiClient` — list, listPaginated, detail, update, delete, getImageUrl, getThumbnailUrl, fetchSimilar, fetchDuplicates, fetchSuggestedAttributes, generateDescription, fetchCollections, upload
    - `ImageAttributeApiClient` — list, create, update, delete
    - `CollectionApiClient` — list, detail, create, update, delete, addImage, removeImage, updateImageOrder, fetchImageCollections
    - `LabelApiClient` — list, detail, create, update, delete
    - `SearchApiClient` — suggestions, saveHistory, fetchHistory, deleteHistory, deleteAllHistory
    - `StatsApiClient` — overview, viewTrends, recommendationTrends, popularImages
    - `ViewHistoryApiClient` — recordStart, recordEnd, list, imageStats
    - `RecommendationsApiClient` — fetch, recordImpressions, recordClick
    - `ArchiveImportApiClient` — upload, getSession, deleteSession, getThumbnailUrl, getImageUrl, import, getJobStatus
    - `UrlCrawlApiClient` — crawl, getSession, deleteSession, getThumbnailUrl, getImageUrl, import
    - `DescriptionApiClient` — generateJob, getJobStatus
    - `JobsApiClient` — list, detail
  - 統合インターフェース `ApiClient`:
    ```typescript
    export interface ApiClient {
      images: ImageApiClient;
      imageAttributes: ImageAttributeApiClient;
      collections: CollectionApiClient;
      labels: LabelApiClient;
      search: SearchApiClient;
      stats: StatsApiClient;
      viewHistory: ViewHistoryApiClient;
      recommendations: RecommendationsApiClient;
      archiveImport: ArchiveImportApiClient;
      urlCrawl: UrlCrawlApiClient;
      description: DescriptionApiClient;
      jobs: JobsApiClient;
    }
    ```
  - DI トークン定義: `API_TYPES = { ApiClient: Symbol.for('ApiClient') }`
  - `packages/api/src/index.ts` からエクスポート
- **完了条件**: `@picstash/api` から `ApiClient` インターフェースと `API_TYPES` がインポート可能

#### T2: web-client に inversify を導入

- **概要**: web-client パッケージに inversify と reflect-metadata を導入し、DI コンテナの基盤を構築する
- **作業内容**:
  - `npm install inversify reflect-metadata -w @picstash/web-client`
  - `packages/web-client/src/shared/di/` ディレクトリを作成
  - `container.ts` — inversify Container の作成・設定
  - `index.ts` — Public API
  - `main.tsx` のエントリポイントで `import 'reflect-metadata'` を追加
  - tsconfig.json に `"experimentalDecorators": true`, `"emitDecoratorMetadata": true` を追加（必要な場合）
- **完了条件**: inversify Container が web-client で利用可能、typecheck が通る

#### T3: FetchApiClient 実装（entities 系）

- **概要**: `ApiClient` インターフェースの entities 関連部分（images, collections, labels）の fetch ベース実装を作成する
- **作業内容**:
  - `packages/web-client/src/shared/api/fetch-client/` ディレクトリを作成
  - `FetchImageApiClient` — 既存の `entities/image/api/image.ts` のロジックを移植
  - `FetchCollectionApiClient` — 既存の `entities/collection/api/collection.ts` のロジックを移植
  - `FetchLabelApiClient` — 既存の `entities/label/api/label.ts` のロジックを移植
  - 各クラスに `@injectable()` デコレータ（または inversify 7.x の場合は関数ベース API）
  - コンテナにバインド
- **完了条件**: entities 系の FetchApiClient 実装がコンテナから取得可能、typecheck が通る

#### T4: FetchApiClient 実装（features 系）

- **概要**: `ApiClient` インターフェースの features 関連部分の fetch ベース実装を作成する
- **作業内容**:
  - `FetchSearchApiClient` — search-images/api/search.ts のロジックを移植
  - `FetchStatsApiClient` — view-stats/api/stats.ts のロジックを移植
  - `FetchViewHistoryApiClient` — track-view-history/api/view-history.ts のロジックを移植
  - `FetchRecommendationsApiClient` — view-recommendations/api/recommendations.ts のロジックを移植
  - `FetchArchiveImportApiClient` — import-archive/api/archive.ts のロジックを移植
  - `FetchUrlCrawlApiClient` — import-url/api/crawl.ts のロジックを移植
  - `FetchImageAttributeApiClient` — manage-image-attributes/api/attributes.ts のロジックを移植
  - `FetchDescriptionApiClient` — manage-image-description/api/description.ts のロジックを移植
  - `FetchDuplicatesApiClient` — find-duplicates/api/duplicates.ts のロジックを移植（ハードコード URL を修正）
  - `FetchSimilarImagesApiClient` — find-similar-images/api/similar.ts のロジックを移植
  - `FetchJobsApiClient` — widgets/job-status のジョブ API のロジックを移植
  - `FetchUploadApiClient` — upload-image/api/upload.ts のロジックを移植（FormData 対応）
  - 統合 `FetchApiClient` クラスでまとめてコンテナにバインド
- **完了条件**: 全 FetchApiClient 実装がコンテナから取得可能、typecheck が通る

#### T5: React Context + hooks 連携

- **概要**: inversify コンテナを React Context で提供し、hooks 経由で API クライアントを利用できるようにする
- **作業内容**:
  - `packages/web-client/src/shared/di/react.tsx` を作成:
    - `ContainerContext` — React.createContext
    - `ContainerProvider` — コンテナを提供するプロバイダーコンポーネント
    - `useContainer()` — コンテナを取得する hook
    - `useApiClient()` — `ApiClient` を取得する hook（ショートカット）
  - `app/providers/index.tsx` に `ContainerProvider` を追加
  - Storybook の decorator にも `ContainerProvider` を追加（モック or 実コンテナ）
- **完了条件**: `useApiClient()` がコンポーネントから利用可能、Storybook でも動作

#### T6: entities 層の API アダプター移行

- **概要**: entities の API アダプター（image, collection, label）を `ApiClient` インターフェース経由に移行する
- **作業内容**:
  - `entities/image/api/image.ts` の各関数を `useApiClient().images.xxx()` 経由に変更
    - 注意: 既存の関数エクスポートを維持しつつ、内部実装を ApiClient に委譲する方法を検討
    - または: entities の API モジュールを廃止し、各呼び出し元で直接 `useApiClient()` を使用する
  - `entities/collection/api/collection.ts` — 同様
  - `entities/label/api/label.ts` — 同様
  - `getImageUrl()`, `getThumbnailUrl()` 等の URL 生成関数も ApiClient 経由に統一
  - 各 entity の `index.ts` エクスポートを更新
- **完了条件**: entities の API 呼び出しが全て ApiClient 経由、既存の動作が維持される
- **設計判断**: 移行方法は T3 実装時に決定（関数ラッパー維持 vs 直接 hook 使用）

#### T7: features 層の API アダプター移行

- **概要**: features の API アダプター（11 ファイル）を `ApiClient` インターフェース経由に移行する
- **作業内容**:
  - 各 feature の `api/*.ts` ファイルを ApiClient 経由に移行
  - 特殊ケースの対応:
    - `upload-image/api/upload.ts` — FormData を使う特殊パターン。FetchUploadApiClient 内で対応
    - `find-duplicates/api/duplicates.ts` — ハードコード URL を imageEndpoints に修正しつつ移行
    - `import-archive/api/archive.ts` — multipart upload + session 管理。FetchArchiveImportApiClient 内で対応
  - 各 feature の `index.ts` エクスポートを更新
  - useViewProps フックや各コンポーネントで `useApiClient()` を使用するように更新
- **完了条件**: features の API 呼び出しが全て ApiClient 経由、既存の動作が維持される

#### T8: テスト・Storybook 対応

- **概要**: 移行後のテスト・Storybook の動作を確保する
- **作業内容**:
  - 既存ユニットテストの更新（API モック方法の変更）
  - Storybook decorator の `ContainerProvider` 設定
    - Stories では API を呼ばない View コンポーネントが主なので影響は限定的
    - Container 子コンポーネントを含む Stories（ImageDetailPageView 等）への対応
  - `npm run typecheck`
  - `npm run lint`（ESLint + dependency-cruiser）
  - `npm run test -w @picstash/web-client`
  - `npm run test:storybook -w @picstash/web-client`
- **完了条件**: 全テスト・lint・Storybook テストが通る

#### T9: クリーンアップ・ドキュメント更新

- **概要**: 不要になったコードの削除とドキュメント更新
- **作業内容**:
  - `shared/api/client.ts`（旧 `apiClient` 関数）の削除（FetchApiClient 内に吸収済み）
  - 不要になった直接インポート（`imageEndpoints` 等）の削除
  - dependency-cruiser ルールの更新（必要な場合）
  - vitest.config.ts のカバレッジパス更新（必要な場合）
- **完了条件**: 不要コードが削除され、ドキュメントが最新状態

## 設計上のポイント

1. **インターフェースの粒度**: リソース単位（`ImageApiClient`, `LabelApiClient` 等）で分割。既存のエンドポイント定義と 1:1 対応させる
2. **URL 生成関数の扱い**: `getImageUrl()`, `getThumbnailUrl()` 等の同期 URL 生成関数も ApiClient に含める。これにより全ての API 関連ロジックが ApiClient に集約される
3. **FormData アップロード**: `FetchUploadApiClient` と `FetchArchiveImportApiClient` 内で `Content-Type` を設定せず、ブラウザに `multipart/form-data` boundary を自動設定させる
4. **inversify バージョン**: inversify 7.x では decorator ベースではなく関数ベース API（`injectable()` 関数）を使用する可能性がある。T2 で実際のバージョンに合わせて決定
5. **移行戦略**: 既存の関数エクスポートを一時的にラッパーとして維持し、段階的に直接 `useApiClient()` 使用に移行する。これにより大量の呼び出し元を一度に変更する必要がない
6. **Storybook**: View コンポーネントは props のみに依存するため、API クライアントの移行による影響は Container コンポーネントを含む Stories のみ
7. **`@picstash/core` の TYPES との共存**: API クライアント用の `API_TYPES` は `@picstash/api` で定義し、サーバー側の `TYPES`（リポジトリ・サービス用）とは別の名前空間にする

## 進捗

- 2026-02-05: プロジェクト開始、計画策定
- 2026-02-05: T2 完了 — web-client に inversify を導入
  - inversify 7.11.0 + reflect-metadata 導入済み
  - `shared/di/` モジュール作成（container.ts, react.tsx, index.ts）
  - ContainerProvider と useContainer hook 提供
  - app/providers に ContainerProvider 統合

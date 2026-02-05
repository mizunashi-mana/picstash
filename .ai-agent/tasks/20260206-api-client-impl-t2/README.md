# T2: createApiClient 関数の実装

プロジェクト: [API Client Interface](../../projects/20260205-api-client-interface/README.md)

## 目的・ゴール

`@picstash/api` パッケージに `createApiClient(http: HttpClient): ApiClient` 関数を実装する。この関数は HttpClient を受け取り、各リソースの API Client 実装を含む統合 ApiClient を返す。

## 現状分析

### 定義済み

- `HttpClient` interface（`packages/api/src/client/http-client.ts`）
- `ApiClient` interface（`packages/api/src/client/api-client.ts`）
- 各リソースの API Client interface（12 種類）
- エンドポイント定義（`imageEndpoints`, `collectionsEndpoints` 等）

### 未実装

- `createApiClient(http: HttpClient): ApiClient` 関数
- 各リソースの API Client 実装クラス

## 実装方針

### ディレクトリ構成

```
packages/api/src/client/
├── index.ts                       # エクスポート
├── http-client.ts                 # HttpClient interface（既存）
├── types.ts                       # DI トークン（既存）
├── api-client.ts                  # ApiClient interface（既存）→ createApiClient 追加
├── impl/                          # 実装クラス（新規作成）
│   ├── index.ts                   # 内部エクスポート
│   ├── image-api-client-impl.ts
│   ├── collection-api-client-impl.ts
│   ├── label-api-client-impl.ts
│   ├── search-api-client-impl.ts
│   ├── stats-api-client-impl.ts
│   ├── view-history-api-client-impl.ts
│   ├── recommendations-api-client-impl.ts
│   ├── archive-import-api-client-impl.ts
│   ├── url-crawl-api-client-impl.ts
│   ├── description-api-client-impl.ts
│   ├── jobs-api-client-impl.ts
│   └── image-attribute-api-client-impl.ts
├── image-api-client.ts            # interface（既存）
├── collection-api-client.ts       # interface（既存）
└── ... (他のinterface)
```

### 実装パターン

各 API Client 実装は HttpClient を受け取り、エンドポイント定義を使って URL をビルドし、HttpClient に委譲する：

```typescript
// impl/image-api-client-impl.ts
import type { HttpClient } from '../http-client.js';
import type { ImageApiClient } from '../image-api-client.js';
import { imageEndpoints, type Image, type ImageListQuery } from '../../images.js';

export function createImageApiClient(http: HttpClient): ImageApiClient {
  return {
    list: (query) => http.get<Image[]>(imageEndpoints.list(query)),
    detail: (imageId) => http.get<Image>(imageEndpoints.detail(imageId)),
    // ... 他のメソッド
  };
}
```

### createApiClient 関数

```typescript
// api-client.ts に追加
import type { HttpClient } from './http-client.js';
import { createImageApiClient } from './impl/image-api-client-impl.js';
// ... 他の import

export function createApiClient(http: HttpClient): ApiClient {
  return {
    images: createImageApiClient(http),
    collections: createCollectionApiClient(http),
    labels: createLabelApiClient(http),
    // ... 他のリソース
  };
}
```

## 実装順序

1. `packages/api/src/client/impl/` ディレクトリ作成
2. entities 系の実装（images, collections, labels）
3. features 系の実装（search, stats, viewHistory, recommendations, archiveImport, urlCrawl, description, jobs, imageAttributes）
4. `createApiClient` 関数の実装
5. `index.ts` からのエクスポート
6. テスト追加
7. typecheck / lint 確認

## 完了条件

- [x] `packages/api/src/client/impl/` に全 12 リソースの実装が存在する
- [x] `createApiClient(http: HttpClient): ApiClient` が実装されている
- [x] `@picstash/api` から `createApiClient` がインポート可能
- [x] typecheck が通る
- [x] lint が通る
- [ ] ユニットテストが通る（既存テストのみ確認）

## 作業ログ

### 2026-02-06

- タスク開始
- impl/ ディレクトリ作成
- 12 リソースの API Client 実装を作成:
  - image-api-client-impl.ts
  - collection-api-client-impl.ts
  - label-api-client-impl.ts
  - search-api-client-impl.ts
  - stats-api-client-impl.ts
  - view-history-api-client-impl.ts
  - recommendations-api-client-impl.ts
  - archive-import-api-client-impl.ts
  - url-crawl-api-client-impl.ts
  - description-api-client-impl.ts
  - jobs-api-client-impl.ts
  - image-attribute-api-client-impl.ts
- create-api-client.ts を作成し、createApiClient 関数を実装
- index.ts を更新してエクスポートを追加
- ESLint の `@/` プレフィックス規約に対応
- typecheck / lint 通過確認

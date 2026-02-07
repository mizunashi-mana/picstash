# Picstash 技術概要

## 技術スタック

| カテゴリ | 技術 | バージョン | 備考 |
|---------|------|-----------|------|
| 言語 | TypeScript | 5.8+ | フロントエンド・バックエンド共通 |
| フロントエンド | React + Vite | React 19, Vite 7 | SPA 構成 |
| ルーティング | React Router | 7.x | クライアントサイドルーティング |
| 状態管理 | TanStack Query | 5.x | サーバー状態のキャッシュ・同期 |
| UI ライブラリ | Mantine | 8.x | コンポーネント・スタイリング |
| バックエンド | Fastify | 5.x | 高速な Node.js フレームワーク |
| ORM | Prisma | 7.x | Driver Adapter パターン使用 |
| データベース | SQLite | - | better-sqlite3 アダプター経由 |
| ベクトル検索 | sqlite-vec | 0.1.x | SQLite 拡張で kNN 検索 |
| 画像ストレージ | ローカルファイル | - | サーバーのディスクに保存 |
| AI/埋め込み | @huggingface/transformers | 3.x | CLIP モデルで画像ベクトル生成 |
| AI/キャプション | @huggingface/transformers | 3.x | ViT-GPT2 でキャプション生成 |
| AI/翻訳 | @huggingface/transformers | 3.x | NLLB-200 で日本語翻訳 |
| バリデーション | Zod | 4.x | スキーマバリデーション（core, api） |
| テスト | Vitest | 4.x | Vite ネイティブで高速 |
| コンポーネント開発 | Storybook | 10.x | addon-vitest でインタラクティブテスト |
| 依存関係検証 | dependency-cruiser | - | FSD レイヤー間の依存方向を検証 |
| リンター | ESLint | 9.x | Flat Config 形式 |

## アーキテクチャ

### 全体構成

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   クライアント    │     │   API サーバー    │     │   データストア    │
│   React + Vite  │ ──▶ │   Fastify       │ ──▶ │   SQLite        │
│   Mantine       │     │   Prisma        │     │   sqlite-vec    │
└─────────────────┘     └─────────────────┘     │   ローカルFS     │
                                                └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │   埋め込み生成    │
                                                │   CLIP (ONNX)   │
                                                └─────────────────┘
```

### DI コンテナ

inversify を使用した DI コンテナで依存性を管理。core パッケージは Repository インターフェースと共通サービスのみを提供し、各消費パッケージ（server, desktop-app）が Prisma 実装をバインド：

```typescript
// server/src/infra/di/container.ts
import { createCoreContainer, type CoreConfig } from '@picstash/core';

export function createContainer(config: Config): Container {
  const container = createCoreContainer(config);
  bindRepositories(container);  // Prisma 実装をバインド
  bindControllers(container);
  return container;
}

// routes
export function imageRoutes(app: FastifyInstance, container: CoreContainer): void {
  const imageRepository = container.getImageRepository();
  const fileStorage = container.getFileStorage();
  // ...
}
```

**core パッケージ:**
```
packages/core/src/infra/di/
├── index.ts           # エクスポート（createCoreContainer, CoreContainer, TYPES）
├── core-container.ts  # createCoreContainer() + CoreContainer クラス + DatabaseService インターフェース
└── types.ts           # TYPES 定義（内部使用）
```

**server/desktop-app パッケージ:**
```
packages/{server,desktop-app}/src/*/infra/di/
├── container.ts       # createContainer() - Prisma 実装のバインド
└── types.ts           # 追加の TYPES 定義（必要に応じて）
```

### CQRS (Command Query Responsibility Segregation)

core パッケージの domain 層で CQRS パターンを採用。Entity（Command Model）と Read Model を分離：

| モデル種別 | 用途 | 命名規則 | 例 |
|-----------|------|---------|-----|
| Entity | 書き込み・更新操作 | `XxxEntity` | `ImageEntity`, `CollectionEntity`, `LabelEntity` |
| Read Model (List) | 一覧表示用 | `XxxListItem` | `ImageListItem`, `CollectionListItem` |
| Read Model (Detail) | 詳細表示用 | `XxxDetail` | `ImageDetail`, `CollectionDetail` |

#### 目的

1. **関心の分離**: 書き込み操作と読み取り操作で異なるデータ構造を使用
2. **パフォーマンス**: 一覧表示では必要最小限のフィールドのみ取得
3. **型安全性**: 操作の種類に応じた適切な型を強制

#### Repository の戻り値

| 操作 | 戻り値 |
|------|--------|
| Command（create, update, delete） | Entity |
| Query（findById, findAll, list） | Read Model |

#### ファイル構成例

```
packages/core/src/domain/image/
├── ImageEntity.ts      # Entity (Command Model)
├── ImageListItem.ts    # Read Model (一覧用)
├── ImageDetail.ts      # Read Model (詳細用)
└── index.ts            # エクスポート
```

### パッケージ構成

| パッケージ | 説明 | 状態 |
|-----------|------|------|
| `packages/web-client` | React フロントエンド | セットアップ済み |
| `packages/server` | Fastify バックエンド API | セットアップ済み |
| `packages/core` | コアロジック（domain, application, infra）(`@picstash/core`) | セットアップ済み |
| `packages/api` | 共有 API 型定義・エンドポイント (`@picstash/api`) | セットアップ済み |
| `packages/desktop-app` | Electron デスクトップアプリ (`@picstash/desktop-app`) | セットアップ済み |
| `packages/eslint-config` | 共有 ESLint 設定 | セットアップ済み |

詳細は [structure.md](../structure.md) を参照。

### フロントエンドアーキテクチャ（FSD）

web-client パッケージは Feature-Sliced Design (FSD) を採用：

```
app → pages → widgets → features → entities → shared
（依存方向: 右のレイヤーのみインポート可能）
```

- **app** — エントリポイント、プロバイダー、ルーティング
- **pages** — ページコンポーネント（View / State 分離パターン適用）
- **widgets** — 自己完結した UI ブロック（AppLayout, JobStatus）
- **features** — 機能単位のモジュール（ユーザーアクション）
- **entities** — ビジネスエンティティの型定義（`@picstash/api` から re-export のみ、UI・API 関数は持たない）
- **shared** — 共通部品（DI コンテナ、API クライアント、ヘルパー、フック）

dependency-cruiser（`.dependency-cruiser.mjs`）でレイヤー間の依存方向とスライス間の分離を自動検証。

### DI コンテナ（web-client / desktop-app）

web-client および desktop-app で inversify を使用した DI コンテナで API クライアントを管理。
`@picstash/api` パッケージで定義された `ApiClient` インターフェースと `API_TYPES.ApiClient` シンボルを使用：

```typescript
// shared/di/container.ts
import { Container } from 'inversify';
import { API_TYPES, createApiClient, type ApiClient } from '@picstash/api';

export function createContainer(): Container {
  const container = new Container();
  const httpClient = new FetchHttpClient();
  container.bind<ApiClient>(API_TYPES.ApiClient).toConstantValue(createApiClient(httpClient));
  return container;
}

// コンポーネントからの利用
import { useApiClient } from '@/shared';

function ImageList() {
  const apiClient = useApiClient();
  const { data } = useQuery({
    queryKey: ['images'],
    queryFn: () => apiClient.images.list(),
  });
}
```

**ApiClient のリソース:**
- `images` - 画像 CRUD、サムネイル/ファイル URL 取得
- `collections` - コレクション CRUD、画像追加/削除
- `labels` - ラベル CRUD
- `jobs` - ジョブ一覧・詳細取得
- `urlCrawl` - URL クロール、セッション管理、画像インポート
- `stats` - 統計情報取得
- `search` - 画像検索
- `recommendations` - おすすめ画像取得
- `archiveImport` - アーカイブインポート
- `descriptions` - 画像説明文管理
- `imageAttributes` - 画像属性管理
- `viewHistory` - 閲覧履歴管理

**ファイル構成（web-client / desktop-app 共通パターン）:**
```
packages/{web-client,desktop-app}/src/{,renderer/}shared/
├── di/
│   ├── index.ts           # エクスポート（ContainerProvider, useApiClient 等）
│   ├── container.ts       # createContainer() - inversify Container 設定
│   └── react.tsx          # ContainerContext, ContainerProvider, useContainer, useApiClient
└── api/
    ├── index.ts           # エクスポート
    └── fetch-http-client.ts # HttpClient 実装
```

### View / State 分離パターン

状態管理と描画を分離するパターンを全 pages および主要 features に適用。単に ViewProps を明示するだけでなく、**View / Handler / State / Selector の4要素への分解**が核心。

#### 4要素の役割

| 要素 | 責務 | 例 |
|------|------|-----|
| **State** | コンポーネントの状態（React State, URL State, Server State） | `images`, `isLoading`, `error`, `query` |
| **Selector** | State から派生する計算値 | `filteredImages`, `total`, `hasNextPage` |
| **Handler** | ユーザーアクションに応じた状態変更 | `onSearch`, `onDelete`, `onToggleExpand` |
| **View** | State/Selector/Handler を受け取り描画のみ行う純粋コンポーネント | `<GalleryPageView {...viewProps} />` |

#### 目的

1. **テスタビリティ**: View は props のみに依存するため、Storybook で全状態パターンを網羅できる
2. **関心の分離**: 「何を表示するか」と「どう状態を管理するか」を明確に分離
3. **再利用性**: 同じ View を異なる状態管理ロジックで再利用可能
4. **型安全性**: ViewProps インターフェースで View と Hook 間の契約を明示

#### ファイル構成

```
Xxx.tsx               — useViewProps + View の統合（Container、7 LOC 程度）
XxxView.tsx           — ViewProps のみを受け取る純粋な描画（View）
useXxxViewProps.ts    — State / Selector / Handler を提供（Hook）
XxxView.stories.tsx   — Storybook ストーリー（View に対して作成）
```

#### ViewProps インターフェース例

```typescript
// useGalleryPageViewProps.ts
export interface GalleryPageViewProps {
  // State（現在の状態）
  query: string;
  viewMode: 'grid' | 'carousel';
  isLoading: boolean;
  error: Error | null;

  // Selector（派生値）
  allImages: Image[];
  total: number;
  isFetchingNextPage: boolean;

  // Handler（アクション）
  onSearchChange: (query: string) => void;
  onViewModeChange: (mode: 'grid' | 'carousel') => void;
  onDeleteAllHistory: () => void;

  // 依存（外部から注入される関数）
  getThumbnailUrl: (imageId: string) => string;
}
```

#### 適用基準

- 状態遷移が複数あるか、ハンドラが2つ以上のコンポーネント
- 適用済み（Pages）: GalleryPage, ImageDetailPage, LabelsPage, CollectionsPage, StatsPage, DuplicatesPage, CollectionDetailPage, CollectionViewerPage
- 適用済み（Features）: ArchiveImportTab, UrlCrawlTab, ImageUploadTab, ImageCollectionsSection, RecommendationSection, CrawlPreviewGallery, ImageAttributeSection, ImageDescriptionSection, SimilarImagesSection

#### 実装ルール

- Stories は View コンポーネントに対してのみ作成
- Container は薄いグルーコード: `const viewProps = useXxxViewProps(); return <XxxView {...viewProps} />;`
- インライン sub-components（CollectionCard, RecommendationCard 等）は View ファイル内に配置
- View は `useApiClient()` 等の hooks を直接呼ばない（props 経由で受け取る）

### Storybook

Storybook 10 + `@storybook/addon-vitest` を使用：

```bash
# Storybook 開発サーバー起動
npm run storybook -w @picstash/web-client

# Storybook テスト（play 関数のインタラクティブテスト）
npm run test:storybook -w @picstash/web-client
```

- Stories は FSD レイヤーに対応した title（例: `Pages/Gallery/GalleryPageView`）で整理
- `play` 関数でユーザーインタラクションのテストを記述

### ESLint 設定

`@picstash/eslint-config` パッケージで ESLint 設定を一元管理：

```javascript
// packages/server/eslint.config.mjs
import { buildConfig } from '@picstash/eslint-config';

export default buildConfig({
  environment: 'node',      // Node.js 環境（デフォルト）
  ruleSets: ['common'],     // 共通ルール
});

// packages/web-client/eslint.config.mjs
import { buildConfig } from '@picstash/eslint-config';

export default buildConfig({
  environment: 'browser',   // ブラウザ環境（Node.js ルール除外）
  ruleSets: ['common', 'react'],
});
```

## 開発環境セットアップ

### 前提条件

- Node.js v21 以上
- npm

### セットアップ手順

```bash
# リポジトリをクローン
git clone https://github.com/mizunashi-mana/picstash
cd picstash

# 依存関係のインストール
npm install

# データベースのセットアップ
npm run db:migrate

# 開発サーバーの起動
npm run dev
```

### 設定ファイル

`packages/server/config.yaml` で設定を管理（環境変数は使用しない）:

```yaml
server:
  port: 3000
  host: 0.0.0.0

database:
  url: file:./prisma/data/picstash.db

storage:
  path: ../../storage
```

## 管理コマンド

### 開発

```bash
# 開発サーバー起動（フロント + バック + コア監視 + Ollama 同時）
npm run dev

# フロントエンドのみ
npm run dev:client

# バックエンドのみ
npm run dev:server

# コアパッケージの監視ビルド
npm run dev:core

# TypeScript 型チェック
npm run typecheck

# リンター実行（ESLint + pre-commit hooks + dependency-cruiser）
npm run lint

# 依存関係ルールのみ検証
npm run lint:deps
```

### ビルド

```bash
# 本番用ビルド
npm run build
```

### テスト

```bash
# テスト実行
npm run test

# カバレッジ付きテスト
npm run test:coverage

# Storybook インタラクティブテスト
npm run test:storybook -w @picstash/web-client

# E2E テスト
npm run test:e2e
```

### データベース

```bash
# Prisma Client 生成（server）
npm run db:generate -w @picstash/server

# Prisma Client 生成（desktop-app）
npm run db:generate -w @picstash/desktop-app

# マイグレーション作成・適用（開発）
npm run db:migrate -w @picstash/server

# マイグレーション適用（本番）
npm run db:migrate:deploy -w @picstash/server

# スキーマをDBに直接反映（開発用）
npm run db:push -w @picstash/server

# Prisma Studio（DB GUI）
npm run db:studio -w @picstash/server
```

### 埋め込み生成

```bash
# 埋め込み未生成の画像を処理
npm run embedding:generate -w @picstash/server

# Prisma から sqlite-vec へ同期
npm run embedding:sync -w @picstash/server

# 全画像の埋め込みを再生成
npm run embedding:regenerate -w @picstash/server

# 埋め込み状況の確認
npm run embedding:status -w @picstash/server
```

### ラベル埋め込み生成

```bash
# ラベル埋め込み未生成のラベルを処理
npm run label:embedding:generate -w @picstash/server

# 全ラベルの埋め込みを再生成
npm run label:embedding:regenerate -w @picstash/server

# ラベル埋め込み状況の確認
npm run label:embedding:status -w @picstash/server
```

#### Prisma 7.x Driver Adapter

Prisma 7.x では Driver Adapter パターンを使用。各パッケージ（server, desktop-app）が独自の Prisma スキーマと実装を管理：

```typescript
// packages/server/src/infra/database/prisma-service.ts
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@~generated/prisma/client.js';

const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
export const prisma = new PrismaClient({ adapter });
```

**パッケージ構成:**
- `packages/server/prisma/` - サーバー用 Prisma スキーマ・マイグレーション
- `packages/server/generated/prisma/` - 生成された Prisma Client
- `packages/desktop-app/prisma/` - デスクトップアプリ用 Prisma スキーマ
- `packages/desktop-app/generated/prisma/` - 生成された Prisma Client

## コーディング規約

- ESLint による自動フォーマット
- TypeScript strict モード有効
- コンポーネントは関数コンポーネントで記述
- ファイル名はケバブケース（例: `image-upload.tsx`）
- コンポーネント名はパスカルケース（例: `ImageUpload`）

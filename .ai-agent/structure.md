# Picstash ディレクトリ構成

## 全体概要

```
picstash/
├── .ai-agent/                  # AI エージェント用ドキュメント
│   ├── steering/               # ステアリングドキュメント
│   │   ├── product.md          # プロダクト概要
│   │   ├── tech.md             # 技術概要
│   │   ├── plan.md             # 実装計画
│   │   ├── market.md           # 市場分析
│   │   └── work.md             # 作業の進め方
│   ├── projects/               # プロジェクトドキュメント（長期目標）
│   ├── tasks/                  # タスクドキュメント（短期タスク）
│   └── structure.md            # ディレクトリ構成（本ファイル）
│
├── packages/                   # ソースコード
│   ├── web-client/             # フロントエンド（FSD アーキテクチャ）
│   ├── server/                 # バックエンド（HTTP API + Prisma）
│   ├── core/                   # コアロジック（ドメイン・ユースケース）
│   ├── api/                    # 共有 API 型定義
│   ├── desktop-app/            # Electron デスクトップアプリ
│   └── eslint-config/          # 共有 ESLint 設定
│
├── scripts/                    # ビルド・管理スクリプト
├── package.json                # ルート npm 設定（ワークスペース）
├── tsconfig.base.json          # 共通 TypeScript 設定
└── README.md
```

---

## packages/web-client/

フロントエンドパッケージ。Feature-Sliced Design (FSD) アーキテクチャを採用。

```
web-client/
├── src/
│   ├── app/                    # App レイヤー
│   │   ├── main.tsx            # エントリポイント
│   │   ├── App.tsx             # ルートコンポーネント（Providers）
│   │   ├── providers/          # プロバイダー設定
│   │   └── routes/             # React Router 設定
│   │
│   ├── pages/                  # Pages レイヤー（View Props パターン）
│   │   ├── gallery/            # ギャラリーページ
│   │   ├── image-detail/       # 画像詳細ページ
│   │   ├── collections/        # コレクション一覧・詳細ページ
│   │   ├── duplicates/         # 重複画像ページ
│   │   ├── home/               # ホームページ（おすすめ）
│   │   ├── import/             # インポートページ
│   │   ├── labels/             # ラベル管理ページ
│   │   └── stats/              # 統計ページ
│   │
│   ├── widgets/                # Widgets レイヤー
│   │   ├── app-layout/         # AppLayout
│   │   └── job-status/         # JobStatusButton + Provider
│   │
│   ├── features/               # Features レイヤー（ユーザーアクション単位）
│   │   ├── gallery/            # ギャラリー表示
│   │   ├── labels/             # ラベル管理
│   │   ├── import/             # インポート共通
│   │   ├── import-archive/     # アーカイブインポート
│   │   ├── import-url/         # URLクロール
│   │   ├── upload-image/       # 画像アップロード
│   │   ├── search-images/      # 画像検索
│   │   ├── find-duplicates/    # 重複画像検出
│   │   ├── find-similar-images/ # 類似画像検索
│   │   ├── manage-image-attributes/ # 画像属性管理
│   │   ├── manage-image-description/ # 画像説明文管理
│   │   ├── manage-image-collections/ # 画像コレクション管理
│   │   ├── view-recommendations/ # おすすめ表示
│   │   ├── track-view-history/ # 閲覧履歴追跡
│   │   └── view-stats/         # 統計表示
│   │
│   ├── entities/               # Entities レイヤー（型の re-export のみ）
│   │   ├── image/              # 画像エンティティ型
│   │   ├── label/              # ラベルエンティティ型
│   │   └── collection/         # コレクションエンティティ型
│   │
│   └── shared/                 # Shared レイヤー
│       ├── api/                # HttpClient 実装（FetchHttpClient）
│       ├── di/                 # DI コンテナ（ContainerProvider, useApiClient）
│       ├── lib/                # ヘルパー関数
│       └── hooks/              # 共通フック
│
├── public/                     # 静的ファイル
├── tests/
│   ├── setup.ts                # テストセットアップ
│   ├── unit/                   # ユニットテスト（Vitest）
│   ├── fixtures/               # テスト用フィクスチャ
│   └── e2e/                    # E2E テスト（Playwright）
├── playwright.config.ts
├── eslint.config.mjs           # ESLint 設定（browser 環境）
├── package.json
└── tsconfig.json
```

### FSD レイヤー構成

- **app/** - エントリポイント、プロバイダー、ルーティング
- **pages/** - ページコンポーネント（View Props パターン適用）
- **widgets/** - 自己完結した UI ブロック
- **features/** - 機能モジュール（各機能は ui/, api/ 等のセグメントを含む）
- **entities/** - `@picstash/api` からの型 re-export のみ（API 関数・UI は持たない）
- **shared/** - 共通部品（DI コンテナ、API クライアント、ヘルパー）

レイヤー間の依存方向: `shared ← entities ← features ← widgets ← pages ← app`

機能間は index.ts 経由でのみ依存可能（dependency-cruiser で検証）。

### テスト構成

- **tests/unit/** - ユニットテスト（Vitest + jsdom）
- **tests/e2e/** - E2E テスト（Playwright）
- **Storybook テスト** - `@storybook/addon-vitest` によるコンポーネントテスト

---

## packages/server/

バックエンドパッケージ。Fastify による HTTP API 提供に特化。

```
server/
├── src/
│   ├── index.ts                # サーバーエントリポイント
│   ├── app.ts                  # Fastify アプリ構成
│   ├── config.ts               # 設定読み込み
│   │
│   ├── cli/                    # CLI コマンド
│   │   ├── generate-embeddings.ts       # 画像埋め込み生成
│   │   └── generate-label-embeddings.ts # ラベル埋め込み生成
│   │
│   └── infra/                  # サーバー固有インフラ層
│       ├── adapters/           # Repository 実装（PrismaImageRepository 等）
│       ├── database/           # PrismaService、sqlite-vec
│       ├── di/                 # DI 設定（createContainer）
│       ├── http/               # Fastify 関連
│       │   ├── routes/         # API ルート
│       │   ├── controllers/    # コントローラー（@injectable）
│       │   └── plugins/        # Fastify プラグイン
│       └── logging/            # ロギングサービス
│
├── prisma/
│   ├── schema.prisma           # Prisma スキーマ
│   ├── data/                   # SQLite データベースファイル
│   └── migrations/             # マイグレーション
├── generated/prisma/           # Prisma Client（.gitignore）
├── tests/
├── eslint.config.mjs           # ESLint 設定（node 環境）
├── prisma.config.ts
├── package.json
└── tsconfig.json
```

### 主要コンポーネント

- **cli/** - 埋め込み生成などのバッチ処理コマンド
- **infra/adapters/** - core パッケージのポートに対する Prisma 実装
- **infra/http/routes/** - REST API エンドポイント定義
- **infra/http/controllers/** - リクエスト処理ロジック

---

## packages/core/

コアロジックパッケージ (`@picstash/core`)。クリーンアーキテクチャを採用。

```
core/
├── src/
│   ├── index.ts                # メインエクスポート
│   ├── config.ts               # 設定型定義
│   │
│   ├── domain/                 # ドメイン層
│   │   ├── archive/            # アーカイブ
│   │   ├── collection/         # コレクション
│   │   ├── embedding/          # 埋め込み
│   │   ├── image/              # 画像
│   │   ├── image-attribute/    # 画像属性
│   │   ├── label/              # ラベル
│   │   ├── recommendation-conversion/ # 推薦コンバージョン
│   │   ├── search-history/     # 検索履歴
│   │   ├── url-crawl/          # URL クロール
│   │   └── view-history/       # 閲覧履歴
│   │
│   ├── application/            # アプリケーション層
│   │   ├── ports/              # Repository インターフェース等
│   │   ├── attribute-suggestion/ # 属性推薦
│   │   ├── duplicate-detection/  # 重複画像検出
│   │   ├── embedding/          # 埋め込み生成
│   │   ├── image/              # 画像ユースケース
│   │   ├── image-attribute/    # 画像属性ユースケース
│   │   ├── label/              # ラベルユースケース
│   │   ├── recommendation/     # 画像推薦
│   │   ├── search/             # 検索ユースケース
│   │   └── url-crawl/          # URL クロールユースケース
│   │
│   ├── infra/                  # インフラ層（Prisma は含まない）
│   │   ├── adapters/           # 外部アダプター（ファイルストレージ等）
│   │   ├── caption/            # キャプション生成（ViT-GPT2 + NLLB）
│   │   ├── di/                 # DI コンテナ（createCoreContainer）
│   │   ├── embedding/          # CLIP 埋め込みサービス
│   │   ├── llm/                # LLM サービス（Ollama）
│   │   ├── ocr/                # OCR サービス（Tesseract.js）
│   │   ├── queue/              # ジョブキュー
│   │   └── workers/            # バックグラウンドワーカー
│   │
│   └── shared/                 # コア内共通
│
├── tests/
├── eslint.config.mjs           # ESLint 設定（node 環境）
├── package.json
└── tsconfig.json
```

### アーキテクチャ

- **domain/** - ビジネスルール、エンティティ、バリューオブジェクト
- **application/** - ユースケース実装、ポート定義（Repository インターフェース等）
- **infra/** - 外部システム連携（AI サービス、ファイルストレージ等）

**注意**: core パッケージは Prisma 依存を持たない。各消費パッケージ（server, desktop-app）が独自の Prisma スキーマと Repository 実装を管理する。

---

## packages/api/

共有 API 型定義パッケージ (`@picstash/api`)。フロントエンドとバックエンドで共有。

```
api/
├── src/
│   ├── index.ts                # メインエクスポート
│   │
│   ├── client/                 # ApiClient インターフェースと実装
│   │   ├── api-client.ts       # 統合 ApiClient インターフェース
│   │   ├── create-api-client.ts # ファクトリ関数
│   │   ├── http-client.ts      # HttpClient インターフェース
│   │   ├── types.ts            # DI 用 Symbol 定義（API_TYPES）
│   │   ├── image-api-client.ts
│   │   ├── collection-api-client.ts
│   │   ├── label-api-client.ts
│   │   ├── jobs-api-client.ts
│   │   ├── url-crawl-api-client.ts
│   │   ├── stats-api-client.ts
│   │   ├── search-api-client.ts
│   │   ├── recommendations-api-client.ts
│   │   ├── archive-import-api-client.ts
│   │   ├── description-api-client.ts
│   │   ├── image-attribute-api-client.ts
│   │   ├── view-history-api-client.ts
│   │   └── impl/               # 各クライアントの実装
│   │
│   ├── collections.ts          # コレクション API 型定義
│   ├── image-attributes.ts     # 画像属性 API 型定義
│   ├── images.ts               # 画像 API 型定義
│   ├── jobs.ts                 # ジョブ API 型定義
│   ├── labels.ts               # ラベル API 型定義
│   ├── search.ts               # 検索 API 型定義
│   ├── stats.ts                # 統計 API 型定義
│   ├── url.ts                  # URL ヘルパー
│   └── view-history.ts         # 閲覧履歴 API 型定義
│
├── package.json
└── tsconfig.json
```

### 主要コンポーネント

- **client/** - `ApiClient` インターフェースとリソース別クライアント実装
  - `api-client.ts` - 統合インターフェース（images, collections, labels 等を集約）
  - `create-api-client.ts` - HttpClient を受け取り ApiClient を生成するファクトリ
  - `http-client.ts` - fetch のラッパーインターフェース
- **各 API 定義ファイル** - エンドポイント URL ヘルパーと Zod スキーマ

---

## packages/desktop-app/

Electron デスクトップアプリパッケージ (`@picstash/desktop-app`)。

```
desktop-app/
├── src/
│   ├── main/                   # メインプロセス
│   │   ├── index.ts            # エントリポイント（BrowserWindow 作成）
│   │   ├── core-manager.ts     # CoreContainer 管理
│   │   ├── ipc-handlers.ts     # IPC ハンドラー
│   │   ├── storage-manager.ts  # ストレージ管理
│   │   ├── migration-runner.ts # マイグレーション実行
│   │   ├── protocol-handler.ts # カスタムプロトコル
│   │   ├── ipc/                # IPC チャンネル定義
│   │   ├── services/           # メインプロセスサービス
│   │   └── infra/              # メインプロセス固有インフラ層
│   │       ├── adapters/       # Repository 実装
│   │       ├── database/       # PrismaService、sqlite-vec
│   │       └── di/             # DI 設定（createDesktopContainer）
│   │
│   ├── preload/                # プリロードスクリプト
│   │   └── index.ts            # contextBridge による API 公開
│   │
│   ├── renderer/               # レンダラープロセス（React アプリ）
│   │   ├── index.html
│   │   ├── main.tsx            # エントリポイント
│   │   ├── App.tsx             # ルートコンポーネント
│   │   ├── routes/             # React Router 設定
│   │   ├── features/           # 機能モジュール
│   │   └── shared/             # 共通部品
│   │       ├── di/             # DI コンテナ
│   │       ├── api/            # FetchHttpClient 実装
│   │       ├── components/
│   │       ├── helpers/
│   │       └── hooks/
│   │
│   └── shared/                 # main/preload/renderer 共有
│
├── prisma/
│   └── schema.prisma           # Prisma スキーマ
├── generated/prisma/           # Prisma Client（.gitignore）
├── tests/
├── dist/                       # ビルド出力
├── electron-builder.json       # Electron Builder 設定
├── esbuild.config.ts           # esbuild 設定
├── playwright.config.ts
├── eslint.config.mjs
├── package.json
├── tsconfig.main.json          # メインプロセス用
├── tsconfig.preload.json       # プリロード用
└── tsconfig.test.json          # テスト用
```

### プロセス構成

- **main/** - メインプロセス（Node.js 環境、Prisma/ファイルシステムアクセス）
- **preload/** - contextBridge による安全な API 公開
- **renderer/** - レンダラープロセス（ブラウザ環境、React アプリ）

### テスト構成

- **tests/unit/** - ユニットテスト（Vitest）
- **tests/e2e/** - E2E テスト（Playwright + Electron）

---

## packages/eslint-config/

共有 ESLint 設定パッケージ。

```
eslint-config/
├── src/
│   ├── index.ts                # メインエクスポート
│   ├── js.config.ts            # JavaScript ルール
│   ├── ts.config.ts            # TypeScript ルール
│   ├── react.config.ts         # React ルール
│   ├── node.config.ts          # Node.js ルール
│   └── ...
├── dist/                       # ビルド出力
├── package.json
└── tsconfig.json
```

### 使い方

`buildConfig()` 関数で環境に応じた設定を生成:

- `environment: 'node'` - Node.js 環境（server, core）
- `environment: 'browser'` - ブラウザ環境（web-client）
- `ruleSets: ['common']` - 共通ルール
- `ruleSets: ['common', 'react']` - React ルール込み

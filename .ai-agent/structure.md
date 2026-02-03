# Picstash ディレクトリ構成

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
│   │   └── YYYYMMDD-プロジェクト名/
│   │       └── README.md       # プロジェクト詳細（目標・タスク分解・依存関係・進捗）
│   ├── tasks/                  # タスクドキュメント（短期タスク）
│   │   └── YYYYMMDD-タスク名/
│   │       └── README.md       # タスク詳細（目的・方針・完了条件・作業ログ）
│   └── structure.md            # ディレクトリ構成（本ファイル）
│
├── packages/                   # ソースコード
│   ├── web-client/             # フロントエンド（FSD アーキテクチャ）
│   │   ├── src/
│   │   │   ├── app/            # App レイヤー
│   │   │   │   ├── main.tsx    # エントリポイント
│   │   │   │   ├── App.tsx     # ルートコンポーネント（Providers）
│   │   │   │   ├── providers/  # プロバイダー設定
│   │   │   │   └── routes/     # React Router 設定
│   │   │   │
│   │   │   ├── pages/          # Pages レイヤー
│   │   │   │   ├── gallery/    # ギャラリーページ（View Props パターン）
│   │   │   │   └── image-detail/ # 画像詳細ページ（View Props パターン）
│   │   │   │
│   │   │   ├── widgets/        # Widgets レイヤー
│   │   │   │   ├── app-layout/ # AppLayout
│   │   │   │   └── job-status/ # JobStatusButton + Provider
│   │   │   │
│   │   │   ├── features/       # Features レイヤー（ユーザーアクション単位）
│   │   │   │   ├── gallery/        # ギャラリー表示
│   │   │   │   ├── labels/         # ラベル管理（UI + ページ）
│   │   │   │   ├── collections/    # コレクション管理
│   │   │   │   ├── upload-image/   # 画像アップロード
│   │   │   │   ├── import-archive/ # アーカイブインポート
│   │   │   │   ├── import-url/     # URLクロール
│   │   │   │   ├── search-images/  # 画像検索
│   │   │   │   ├── find-duplicates/ # 重複画像検出
│   │   │   │   ├── find-similar-images/ # 類似画像検索
│   │   │   │   ├── manage-image-attributes/ # 画像属性管理
│   │   │   │   ├── manage-image-description/ # 画像説明文管理
│   │   │   │   ├── manage-image-collections/ # 画像コレクション管理
│   │   │   │   ├── view-recommendations/ # おすすめ表示
│   │   │   │   ├── track-view-history/ # 閲覧履歴追跡
│   │   │   │   └── view-stats/     # 統計表示
│   │   │   │
│   │   │   ├── entities/       # Entities レイヤー（型定義 + API のみ）
│   │   │   │   ├── image/      # 画像エンティティ（api/, model/)
│   │   │   │   ├── label/      # ラベルエンティティ（api/, model/)
│   │   │   │   └── collection/ # コレクションエンティティ（api/, model/)
│   │   │   │
│   │   │   └── shared/         # Shared レイヤー
│   │   │       ├── api/        # 共通 API クライアント
│   │   │       ├── lib/        # ヘルパー関数
│   │   │       └── hooks/      # 共通フック
│   │   │
│   │   ├── public/             # 静的ファイル
│   │   ├── tests/              # web-client のテスト
│   │   ├── eslint.config.mjs   # ESLint 設定（browser 環境）
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── server/                 # バックエンド（HTTP 層）
│   │   ├── src/
│   │   │   ├── index.ts        # サーバーエントリポイント
│   │   │   ├── app.ts          # Fastify アプリ構成
│   │   │   ├── config.ts       # 設定読み込み
│   │   │   │
│   │   │   ├── cli/            # CLI コマンド
│   │   │   │   ├── generate-embeddings.ts       # 画像埋め込み生成コマンド
│   │   │   │   └── generate-label-embeddings.ts # ラベル埋め込み生成コマンド
│   │   │   │
│   │   │   └── infra/          # サーバー固有インフラ層
│   │   │       ├── di/         # サーバー用 DI 設定
│   │   │       ├── http/       # Fastify ルート、プラグイン
│   │   │       │   ├── routes/ # API ルート（images, labels, image-attributes, archives 等）
│   │   │       │   └── plugins/
│   │   │       └── logging/    # ロギングサービス
│   │   │
│   │   ├── tests/              # server のテスト
│   │   ├── eslint.config.mjs   # ESLint 設定（node 環境）
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── core/                   # コアロジック (@picstash/core)
│   │   ├── src/
│   │   │   ├── index.ts        # メインエクスポート
│   │   │   ├── config.ts       # 設定型定義
│   │   │   │
│   │   │   ├── domain/         # ドメイン層
│   │   │   │   ├── archive/    # アーカイブドメインモデル
│   │   │   │   ├── collection/ # コレクションドメインモデル
│   │   │   │   ├── embedding/  # 埋め込みドメインモデル
│   │   │   │   ├── image/      # 画像ドメインモデル
│   │   │   │   ├── image-attribute/ # 画像属性ドメインモデル
│   │   │   │   ├── label/      # ラベルドメインモデル
│   │   │   │   ├── recommendation-conversion/ # 推薦コンバージョンモデル
│   │   │   │   ├── search-history/ # 検索履歴ドメインモデル
│   │   │   │   ├── url-crawl/  # URLクロールドメインモデル
│   │   │   │   └── view-history/ # 閲覧履歴ドメインモデル
│   │   │   │
│   │   │   ├── application/    # アプリケーション層
│   │   │   │   ├── attribute-suggestion/ # 属性推薦
│   │   │   │   ├── duplicate-detection/ # 重複画像検出
│   │   │   │   ├── embedding/  # 埋め込み生成
│   │   │   │   ├── image/      # 画像ユースケース
│   │   │   │   ├── image-attribute/ # 画像属性ユースケース
│   │   │   │   ├── label/      # ラベルユースケース
│   │   │   │   ├── ports/      # ポート定義（インターフェース）
│   │   │   │   ├── recommendation/ # 画像推薦
│   │   │   │   ├── search/     # 検索ユースケース
│   │   │   │   └── url-crawl/  # URLクロールユースケース
│   │   │   │
│   │   │   ├── infra/          # インフラ層
│   │   │   │   ├── adapters/   # 外部アダプター実装
│   │   │   │   ├── caption/    # キャプション生成サービス
│   │   │   │   ├── database/   # Prisma Client、sqlite-vec
│   │   │   │   ├── di/         # 依存性注入コンテナ
│   │   │   │   ├── embedding/  # CLIP 埋め込みサービス
│   │   │   │   ├── llm/        # LLM サービス（Ollama 連携）
│   │   │   │   ├── ocr/        # OCR サービス（Tesseract.js）
│   │   │   │   ├── queue/      # ジョブキュー
│   │   │   │   └── workers/    # バックグラウンドワーカー
│   │   │   │
│   │   │   └── shared/         # コア内共通
│   │   │
│   │   ├── generated/          # Prisma 生成ファイル
│   │   │   └── prisma/         # Prisma Client
│   │   ├── prisma/             # Prisma スキーマ・マイグレーション
│   │   │   ├── schema.prisma
│   │   │   ├── data/           # SQLite データベースファイル
│   │   │   └── migrations/
│   │   ├── tests/              # core のテスト
│   │   ├── eslint.config.mjs   # ESLint 設定（node 環境）
│   │   ├── prisma.config.ts    # Prisma 設定
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── eslint-config/          # 共有 ESLint 設定
│   │   ├── src/
│   │   │   ├── index.ts        # メインエクスポート
│   │   │   ├── js.config.ts    # JavaScript ルール
│   │   │   ├── ts.config.ts    # TypeScript ルール
│   │   │   ├── react.config.ts # React ルール
│   │   │   ├── node.config.ts  # Node.js ルール
│   │   │   └── ...
│   │   ├── dist/               # ビルド出力
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── api/                    # 共有 API 型定義 (@picstash/api)
│   │   ├── src/
│   │   │   ├── index.ts        # メインエクスポート
│   │   │   ├── collections.ts  # コレクション API エンドポイント・型定義
│   │   │   ├── image-attributes.ts # 画像属性 API エンドポイント・型定義
│   │   │   ├── images.ts       # 画像 API エンドポイント定義
│   │   │   ├── jobs.ts         # ジョブ API エンドポイント・型定義
│   │   │   ├── labels.ts       # ラベル API エンドポイント・型定義
│   │   │   ├── search.ts       # 検索 API エンドポイント・型定義
│   │   │   ├── stats.ts        # 統計 API エンドポイント・型定義
│   │   │   ├── url.ts          # URL ヘルパー
│   │   │   └── view-history.ts # 閲覧履歴 API エンドポイント・型定義
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── desktop-app/            # Electron デスクトップアプリ (@picstash/desktop-app)
│   │   ├── src/
│   │   │   ├── main/           # メインプロセス
│   │   │   │   └── index.ts    # エントリポイント（BrowserWindow 作成）
│   │   │   ├── preload/        # プリロードスクリプト
│   │   │   │   └── index.ts    # contextBridge による API 公開
│   │   │   └── renderer/       # レンダラープロセス
│   │   │       ├── index.html
│   │   │       ├── styles.css
│   │   │       └── renderer.js
│   │   ├── tests/              # Playwright E2E テスト
│   │   │   └── app.spec.ts
│   │   ├── dist/               # ビルド出力
│   │   ├── electron-builder.json  # Electron Builder 設定
│   │   ├── playwright.config.ts
│   │   ├── eslint.config.mjs
│   │   ├── package.json
│   │   ├── tsconfig.main.json     # メインプロセス用
│   │   ├── tsconfig.preload.json  # プリロード用
│   │   └── tsconfig.test.json     # テスト用
│   │
│   └── e2e-test/               # E2E テスト
│       ├── tests/              # Playwright テストファイル
│       ├── fixtures/           # テスト用フィクスチャ
│       ├── playwright.config.ts
│       ├── eslint.config.mjs
│       ├── package.json
│       └── tsconfig.json
│
├── storage/                    # 画像ストレージ（ローカル）
│   ├── originals/              # オリジナル画像
│   └── thumbnails/             # サムネイル画像
│
├── scripts/                    # ビルド・管理スクリプト
│
├── package.json                # ルート npm 設定（ワークスペース）
├── tsconfig.base.json          # 共通 TypeScript 設定
├── README.md                   # プロジェクト README
└── LICENSE                     # ライセンスファイル
```

## 主要ディレクトリの説明

### `packages/web-client/`
フロントエンドのパッケージ。Feature-Sliced Design (FSD) を採用：
- **app/** - アプリケーションレイヤー（エントリポイント、プロバイダー、ルーティング）
- **pages/** - ページコンポーネント（View Props パターン適用）
- **widgets/** - 自己完結した UI ブロック（AppLayout, JobStatus 等）
- **features/** - 機能ごとのモジュール（ユーザーアクション単位）
  - 各機能は ui/, api/ 等のセグメントを含む
  - 機能間は index.ts 経由でのみ依存可能（dependency-cruiser で検証）
- **entities/** - ビジネスエンティティ（型定義 + API のみ、UI は持たない）
- **shared/** - 共通部品（API クライアント、ヘルパー、フック）
- レイヤー間の依存方向: shared ← entities ← features ← widgets ← pages ← app

### `packages/server/`
バックエンドの HTTP サーバーパッケージ。Fastify による API 提供に特化：
- **cli/** - CLI コマンド（埋め込み生成等）
- **infra/** - サーバー固有のインフラ層
  - **di/** - サーバー用 DI 設定
  - **http/** - Fastify ルート、プラグイン
  - **logging/** - ロギングサービス

### `packages/core/`
コアロジックパッケージ (`@picstash/core`)。クリーンアーキテクチャを採用：
- **domain/** - ドメイン層（ビジネスルール、エンティティ、バリューオブジェクト）
- **application/** - アプリケーション層（ユースケース、ポート定義）
- **infra/** - インフラ層（外部システム連携）
  - **adapters/** - 外部アダプター実装
  - **database/** - Prisma Client、sqlite-vec
  - **di/** - 依存性注入コンテナ
  - **caption/** - キャプション生成サービス（ViT-GPT2 + NLLB翻訳）
  - **embedding/** - CLIP 埋め込みサービス
  - **llm/** - LLM サービス（Ollama 連携）
  - **ocr/** - OCR サービス（Tesseract.js）
  - **queue/** - ジョブキュー
  - **workers/** - バックグラウンドワーカー

Prisma Client は `generated/prisma/` に出力され、`@~generated/prisma` エイリアスでインポート。

### `packages/eslint-config/`
共有 ESLint 設定パッケージ。`buildConfig()` 関数で環境に応じた設定を生成：
- `environment: 'node'` - Node.js 環境（サーバー）
- `environment: 'browser'` - ブラウザ環境（クライアント）
- `ruleSets: ['common']` - 共通ルール
- `ruleSets: ['common', 'react']` - React ルール込み

### `packages/api/`
フロントエンドとバックエンドで共有する API 型定義とエンドポイント定義 (`@picstash/api`)。
- **images.ts** - 画像 API のエンドポイント URL ヘルパー
- **stats.ts** - 統計 API の Zod スキーマと型定義
- **labels.ts** - ラベル API の Zod スキーマと型定義
- **image-attributes.ts** - 画像属性 API の Zod スキーマと型定義

### `packages/e2e-test/`
Playwright を使用した E2E テストパッケージ。アプリケーション全体の統合テストを実行。

### `storage/`
アップロードされた画像の保存先。オリジナル画像とサムネイルを分離して管理。

## テスト構成

各パッケージ内に `tests/` ディレクトリを配置し、ユニットテストと統合テストをパッケージ毎に管理。

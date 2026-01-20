# Picstash ディレクトリ構成

```
picstash/
├── .ai-agent/                  # AI エージェント用ドキュメント
│   ├── steering/               # ステアリングドキュメント
│   │   ├── product.md          # プロダクト概要
│   │   ├── tech.md             # 技術概要
│   │   ├── plan.md             # 実装計画
│   │   ├── work.md             # 作業の進め方
│   │   └── idea.md             # 改善アイデア
│   ├── tasks/                  # タスクドキュメント
│   │   └── YYYYMMDD-タスク名/   # 各タスクのディレクトリ
│   │       └── README.md       # タスク詳細（目的・方針・完了条件・作業ログ）
│   └── structure.md            # ディレクトリ構成（本ファイル）
│
├── packages/                   # ソースコード
│   ├── client/                 # フロントエンド
│   │   ├── src/
│   │   │   ├── main.tsx        # エントリポイント
│   │   │   ├── App.tsx         # ルートコンポーネント（Providers）
│   │   │   │
│   │   │   ├── features/       # 機能ごとのモジュール
│   │   │   │   ├── archive-import/ # アーカイブインポート機能
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── pages/
│   │   │   │   │   └── api.ts
│   │   │   │   ├── collections/ # コレクション機能
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── pages/
│   │   │   │   │   └── api.ts
│   │   │   │   ├── duplicates/ # 重複画像検出機能
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── pages/
│   │   │   │   │   └── api.ts
│   │   │   │   ├── gallery/    # ギャラリー機能
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── pages/
│   │   │   │   │   └── api.ts
│   │   │   │   ├── home/       # ホーム画面
│   │   │   │   │   └── pages/
│   │   │   │   ├── labels/     # 属性ラベル管理機能
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── pages/
│   │   │   │   │   └── api.ts
│   │   │   │   ├── recommendations/ # 画像推薦機能
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── pages/
│   │   │   │   │   └── api.ts
│   │   │   │   ├── stats/      # 統計ダッシュボード機能
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── pages/
│   │   │   │   │   └── api.ts
│   │   │   │   ├── upload/     # アップロード機能
│   │   │   │   │   ├── components/
│   │   │   │   │   └── api.ts
│   │   │   │   ├── url-crawl/  # URLクロール機能
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── pages/
│   │   │   │   │   └── api.ts
│   │   │   │   └── view-history/ # 閲覧履歴機能
│   │   │   │       ├── components/
│   │   │   │       ├── pages/
│   │   │   │       └── api.ts
│   │   │   │
│   │   │   ├── shared/         # 共通部品
│   │   │   │   ├── index.ts    # エクスポート
│   │   │   │   ├── components/ # 共通コンポーネント（AppLayout 等）
│   │   │   │   ├── helpers/    # ヘルパー関数
│   │   │   │   └── hooks/      # 共通フック
│   │   │   │
│   │   │   ├── api/            # 共通 API クライアント
│   │   │   │
│   │   │   └── routes/         # React Router 設定
│   │   │
│   │   ├── public/             # 静的ファイル
│   │   ├── tests/              # client のテスト
│   │   ├── eslint.config.mjs   # ESLint 設定（browser 環境）
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── server/                 # バックエンド
│   │   ├── src/
│   │   │   ├── index.ts        # サーバーエントリポイント
│   │   │   ├── app.ts          # Fastify アプリ構成
│   │   │   ├── config.ts       # 設定読み込み
│   │   │   │
│   │   │   ├── cli/            # CLI コマンド
│   │   │   │   ├── generate-embeddings.ts       # 画像埋め込み生成コマンド
│   │   │   │   └── generate-label-embeddings.ts # ラベル埋め込み生成コマンド
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
│   │   │   │   ├── stats/      # 統計ドメインモデル
│   │   │   │   ├── url-crawl/  # URLクロールドメインモデル
│   │   │   │   └── view-history/ # 閲覧履歴ドメインモデル
│   │   │   │
│   │   │   ├── application/    # アプリケーション層
│   │   │   │   ├── archive/    # アーカイブ処理
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
│   │   │   │   ├── http/       # Fastify ルート、プラグイン
│   │   │   │   │   ├── routes/ # API ルート（images, labels, image-attributes, archives 等）
│   │   │   │   │   └── plugins/
│   │   │   │   ├── llm/        # LLM サービス（Ollama 連携）
│   │   │   │   ├── logging/    # ロギングサービス
│   │   │   │   ├── queue/      # ジョブキュー
│   │   │   │   ├── storage/    # ファイルストレージ
│   │   │   │   └── workers/    # バックグラウンドワーカー
│   │   │   │
│   │   │   └── shared/         # サーバー内共通
│   │   │
│   │   ├── generated/          # Prisma 生成ファイル
│   │   │   └── prisma/         # Prisma Client
│   │   ├── prisma/             # Prisma スキーマ・マイグレーション
│   │   │   ├── schema.prisma
│   │   │   ├── data/           # SQLite データベースファイル
│   │   │   └── migrations/
│   │   ├── tests/              # server のテスト
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
│   ├── shared/                 # フロントエンド・バックエンド共通
│   │   ├── src/
│   │   │   ├── index.ts        # メインエクスポート
│   │   │   ├── image-attributes.ts # 画像属性の型定義
│   │   │   └── labels.ts       # ラベルの型定義
│   │   ├── package.json
│   │   └── tsconfig.json
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

### `packages/client/`
フロントエンドのパッケージ。feature-sliced アーキテクチャを採用：
- **features/** - 機能ごとのモジュール
  - 各機能は components/, pages/, api.ts を含む
  - 機能間は index.ts 経由でのみ依存可能（dependency-cruiser で検証）
- **shared/** - 共通部品
  - **components/** - 共通コンポーネント（AppLayout 等）
  - **helpers/** - ヘルパー関数
  - **hooks/** - 共通フック
- **api/** - 共通 API クライアント
- **routes/** - React Router 設定

### `packages/server/`
バックエンドのパッケージ。クリーンアーキテクチャを採用：
- **cli/** - CLI コマンド（埋め込み生成等）
- **domain/** - ドメイン層（ビジネスルール、エンティティ、バリューオブジェクト）
- **application/** - アプリケーション層（ユースケース、ポート定義）
- **infra/** - インフラ層（外部システム連携）
  - **adapters/** - 外部アダプター実装
  - **database/** - Prisma Client、sqlite-vec
  - **di/** - 依存性注入コンテナ
  - **caption/** - キャプション生成サービス（ViT-GPT2 + NLLB翻訳）
  - **embedding/** - CLIP 埋め込みサービス
  - **http/** - Fastify ルート、プラグイン
  - **storage/** - ファイルストレージ

Prisma Client は `generated/prisma/` に出力され、`@~generated/prisma` エイリアスでインポート。

### `packages/eslint-config/`
共有 ESLint 設定パッケージ。`buildConfig()` 関数で環境に応じた設定を生成：
- `environment: 'node'` - Node.js 環境（サーバー）
- `environment: 'browser'` - ブラウザ環境（クライアント）
- `ruleSets: ['common']` - 共通ルール
- `ruleSets: ['common', 'react']` - React ルール込み

### `packages/shared/`
フロントエンドとバックエンドで共有する型定義。API のレスポンス型などを一元管理。

### `packages/e2e-test/`
Playwright を使用した E2E テストパッケージ。アプリケーション全体の統合テストを実行。

### `storage/`
アップロードされた画像の保存先。オリジナル画像とサムネイルを分離して管理。

## テスト構成

各パッケージ内に `tests/` ディレクトリを配置し、ユニットテストと統合テストをパッケージ毎に管理。

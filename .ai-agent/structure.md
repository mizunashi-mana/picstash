# Picstash ディレクトリ構成

```
picstash/
├── .ai-agent/                  # AI エージェント用ドキュメント
│   ├── steering/               # ステアリングドキュメント
│   │   ├── product.md          # プロダクト概要
│   │   ├── tech.md             # 技術概要
│   │   ├── plan.md             # 実装計画
│   │   └── work.md             # 作業の進め方
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
│   │   │   │   └── [feature]/
│   │   │   │       ├── components/
│   │   │   │       ├── hooks/
│   │   │   │       ├── api/
│   │   │   │       └── pages/
│   │   │   │
│   │   │   ├── shared/         # 共通部品
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   └── helpers/
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
│   │   │   ├── application/    # ユースケース層
│   │   │   │   └── image/      # 画像関連ユースケース
│   │   │   │
│   │   │   ├── domain/         # ドメイン層（ビジネスロジック）
│   │   │   │   ├── image/      # 画像ドメイン
│   │   │   │   ├── tag/        # タグドメイン
│   │   │   │   └── collection/ # コレクションドメイン
│   │   │   │
│   │   │   ├── infra/          # インフラ層
│   │   │   │   ├── database/   # Prisma Client、リポジトリ実装
│   │   │   │   ├── storage/    # ファイルストレージ
│   │   │   │   └── http/       # Fastify ルート、プラグイン
│   │   │   │       ├── routes/
│   │   │   │       └── plugins/
│   │   │   │
│   │   │   └── shared/         # 共通ユーティリティ
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
│   └── shared/                 # フロントエンド・バックエンド共通（未作成）
│       ├── src/
│       │   ├── types/          # 型定義
│       │   └── constants/      # 定数
│       ├── tests/              # shared のテスト
│       ├── package.json
│       └── tsconfig.json
│
├── storage/                    # 画像ストレージ（ローカル）
│   ├── originals/              # オリジナル画像
│   └── thumbnails/             # サムネイル画像
│
├── scripts/                    # ビルド・管理スクリプト
│
├── docs/                       # ドキュメント
│
├── .env.example                # 環境変数テンプレート
├── package.json                # ルート npm 設定（ワークスペース）
├── README.md                   # プロジェクト README
└── LICENSE                     # ライセンスファイル
```

## 主要ディレクトリの説明

### `packages/client/`
フロントエンドのパッケージ。Feature-based ディレクトリ構造を採用：
- **features/** - 機能ごとのモジュール（components, hooks, api, pages を含む）
- **shared/** - 共通 UI コンポーネント、フック、ヘルパー
- **api/** - 共通 API クライアント
- **routes/** - React Router 設定

### `packages/server/`
バックエンドのパッケージ。レイヤードアーキテクチャを採用：
- **domain/** - ビジネスロジック、エンティティ（依存なし）
- **application/** - ユースケース（domain のみ依存）
- **infra/** - 外部システム連携（Fastify, Prisma, ファイルシステム）

domain 内は `image/`, `tag/`, `collection/` のように領域ごとにモジュール化。

Prisma Client は `generated/prisma/` に出力され、`@~generated/prisma` エイリアスでインポート。

### `packages/eslint-config/`
共有 ESLint 設定パッケージ。`buildConfig()` 関数で環境に応じた設定を生成：
- `environment: 'node'` - Node.js 環境（サーバー）
- `environment: 'browser'` - ブラウザ環境（クライアント）
- `ruleSets: ['common']` - 共通ルール
- `ruleSets: ['common', 'react']` - React ルール込み

### `packages/shared/`（未作成）
フロントエンドとバックエンドで共有する型定義や定数。API のレスポンス型などを一元管理。

### `storage/`
アップロードされた画像の保存先。オリジナル画像とサムネイルを分離して管理。

## テスト構成

各パッケージ内に `tests/` ディレクトリを配置し、ユニットテストと統合テストをパッケージ毎に管理。

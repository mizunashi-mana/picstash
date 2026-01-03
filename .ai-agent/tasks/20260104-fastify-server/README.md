# Fastify サーバー基盤

## 目的・ゴール

API サーバーの基盤を構築する。Fastify を使って、今後の画像管理 API を実装するための土台を整える。

## ディレクトリ構造

レイヤードアーキテクチャを採用：

```
src/
├── index.ts                    # エントリポイント（サーバー起動）
├── app.ts                      # Fastify アプリ構成
├── config.ts                   # 設定読み込み
│
├── application/                # ユースケース層
│   └── image/                  # 画像関連ユースケース
│
├── domain/                     # ドメイン層（ビジネスロジック）
│   ├── image/                  # 画像ドメイン
│   │   ├── image.ts            # エンティティ/値オブジェクト
│   │   ├── image-repository.ts # リポジトリインターフェース
│   │   └── index.ts
│   ├── tag/                    # タグドメイン（将来）
│   └── collection/             # コレクションドメイン（将来）
│
├── infra/                      # インフラ層
│   ├── database/
│   │   ├── prisma.ts           # Prisma Client
│   │   └── image-repository-impl.ts
│   ├── storage/
│   │   └── file-storage.ts
│   └── http/
│       ├── routes/
│       │   ├── index.ts
│       │   └── health.ts
│       └── plugins/
│           └── cors.ts
│
└── shared/                     # 共通ユーティリティ
    └── errors.ts
```

### レイヤー間の依存関係

| 層 | 責務 | 依存方向 |
|---|------|---------|
| **domain** | ビジネスルール、エンティティ | 何にも依存しない |
| **application** | ユースケース調整 | domain のみ依存 |
| **infra** | 外部システム連携 | domain, application に依存 |

## 実装方針

### 1. Fastify のインストールと初期化
- `fastify` と関連パッケージをインストール
- TypeScript 対応の設定

### 2. プラグイン構成
- CORS 設定（`@fastify/cors`）
- 静的ファイル配信（`@fastify/static`）- 画像配信用
- マルチパート対応（`@fastify/multipart`）- ファイルアップロード用

### 3. ルーティング基盤
- ヘルスチェック API（`GET /health`）
- API ルートのプレフィックス（`/api/v1`）

### 4. Prisma 統合
- Prisma Client をサーバーに統合
- DB 接続の確認

### 5. 設定管理
- 既存の `config.ts` を拡張（server.port/host を追加）

## 完了条件

- [x] Fastify がインストールされている
- [x] レイヤードアーキテクチャのディレクトリ構造が作成されている
- [x] `npm run dev` でサーバーが起動する
- [x] `GET /health` が動作する
- [x] CORS が設定されている
- [x] Prisma Client が統合されている
- [x] 型チェック（`npm run typecheck`）が通る

## 作業ログ

### 2026-01-04
- structure.md を新しいレイヤードアーキテクチャ構造に更新
- Fastify 関連パッケージをインストール:
  - `fastify`, `@fastify/cors`, `@fastify/static`, `@fastify/multipart`
  - `pino-pretty`（開発用ログ）
  - `tsx`（TypeScript 実行）
- Prisma 7.x 対応:
  - `@prisma/adapter-better-sqlite3`, `better-sqlite3` をインストール
  - Driver Adapter 方式で Prisma Client を設定
- ディレクトリ構造を作成:
  - `application/` - ユースケース層
  - `domain/` - ドメイン層
  - `infra/` - インフラ層（database, storage, http）
  - `shared/` - 共通ユーティリティ
- 実装ファイル:
  - `src/app.ts` - Fastify アプリ構成
  - `src/index.ts` - サーバーエントリポイント
  - `src/infra/database/prisma.ts` - Prisma Client
  - `src/infra/http/plugins/cors.ts` - CORS 設定
  - `src/infra/http/routes/health.ts` - ヘルスチェック API
- config.yaml に server.port/host を追加
- 動作確認: `GET /health` が正常にレスポンスを返す

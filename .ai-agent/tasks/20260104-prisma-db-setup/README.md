# Prisma・DB セットアップ

## 目的・ゴール

データ永続化の基盤を整備する。SQLite + Prisma を使って、今後の画像管理機能に必要なデータベース環境を構築する。

## 実装方針

### 1. Prisma のインストールと初期化
- `@prisma/client` と `prisma` を server パッケージにインストール
- Prisma 初期化（SQLite プロバイダー）
- データベースファイルは `packages/server/prisma/data/` に配置

### 2. スキーマ定義
tech.md の要件に従い、最初は最小限のスキーマを定義：
- `Image` モデル（画像の基本情報）

### 3. マイグレーション
- 初回マイグレーション作成・適用
- npm scripts に DB 関連コマンドを追加

### 4. 動作確認
- Prisma Client が正常に生成されること
- TypeScript で型安全にアクセスできること

## 完了条件

- [x] Prisma がインストールされている
- [x] `schema.prisma` が作成されている
- [x] 初回マイグレーションが適用されている
- [x] `npm run db:migrate` 等のコマンドが使える
- [x] Prisma Client が生成され、TypeScript から利用可能
- [x] 型チェック（`npm run typecheck`）が通る

## 作業ログ

### 2026-01-03
- Prisma 7.2.0 をインストール（`@prisma/client`, `prisma`）
- SQLite プロバイダーで `schema.prisma` を作成
- `Image` モデルを定義（uuid ID, filename, path, mimeType, size, width, height, timestamps）
- `prisma.config.ts` で DB URL を `config.ts` から取得するよう設定
- 初回マイグレーション `20260103175301_init` を作成

### 2026-01-04
- DB関連の npm scripts を追加:
  - `db:generate` - Prisma Client 生成
  - `db:migrate` - マイグレーション実行（開発用）
  - `db:migrate:deploy` - マイグレーション適用（本番用）
  - `db:push` - スキーマをDBに反映
  - `db:studio` - Prisma Studio 起動
- Prisma Client を `generated/prisma` に生成
- 型チェック通過を確認

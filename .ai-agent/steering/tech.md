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
| ベクトル検索 | sqlite-vec | - | SQLite 拡張で類似検索（未実装） |
| 画像ストレージ | ローカルファイル | - | サーバーのディスクに保存 |
| AI/ML | 未定 | - | CLIP モデルでタグ推薦・類似検索 |
| テスト | Vitest | - | Vite ネイティブで高速（未セットアップ） |
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
                                                │   AI サービス    │
                                                │   CLIP (未定)   │
                                                └─────────────────┘
```

### パッケージ構成

| パッケージ | 説明 | 状態 |
|-----------|------|------|
| `packages/client` | React フロントエンド | セットアップ済み |
| `packages/server` | Fastify バックエンド API | セットアップ済み |
| `packages/eslint-config` | 共有 ESLint 設定 | セットアップ済み |
| `packages/shared` | 共有型定義・定数 | 未作成 |

詳細は [structure.md](../structure.md) を参照。

### ESLint 設定

`@picstash/eslint-config` パッケージで ESLint 設定を一元管理：

```javascript
// packages/server/eslint.config.mjs
import { buildConfig } from '@picstash/eslint-config';

export default buildConfig({
  environment: 'node',      // Node.js 環境（デフォルト）
  ruleSets: ['common'],     // 共通ルール
});

// packages/client/eslint.config.mjs
import { buildConfig } from '@picstash/eslint-config';

export default buildConfig({
  environment: 'browser',   // ブラウザ環境（Node.js ルール除外）
  ruleSets: ['common', 'react'],
});
```

## 開発環境セットアップ

### 前提条件

- Node.js v20 以上
- npm

### セットアップ手順

```bash
# リポジトリをクローン
git clone <repository-url>
cd picstash

# 依存関係のインストール
npm install

# データベースのセットアップ
npm run db:migrate

# 開発サーバーの起動
npm run dev
```

### 環境変数

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `PORT` | サーバーポート番号 | `3000` |
| `DATABASE_URL` | SQLite データベースパス | `file:./data/picstash.db` |
| `STORAGE_PATH` | 画像保存先パス | `./storage` |

## 管理コマンド

### 開発

```bash
# 開発サーバー起動（フロント + バック同時）
npm run dev

# フロントエンドのみ
npm run dev:client

# バックエンドのみ
npm run dev:server

# TypeScript 型チェック
npm run typecheck

# リンター実行
npm run lint

# フォーマッター実行
npm run format
```

### ビルド・本番

```bash
# 本番用ビルド
npm run build

# 本番サーバー起動
npm run start
```

### テスト

```bash
# テスト実行
npm run test

# ウォッチモード
npm run test:watch

# カバレッジ付きテスト
npm run test:coverage
```

### データベース

```bash
# Prisma Client 生成
npm run db:generate -w @picstash/server

# マイグレーション作成・適用（開発）
npm run db:migrate -w @picstash/server

# マイグレーション適用（本番）
npm run db:migrate:deploy -w @picstash/server

# スキーマをDBに直接反映（開発用）
npm run db:push -w @picstash/server

# Prisma Studio（DB GUI）
npm run db:studio -w @picstash/server
```

#### Prisma 7.x Driver Adapter

Prisma 7.x では Driver Adapter パターンを使用：

```typescript
// packages/server/src/infra/database/prisma.ts
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@generated/prisma/client.js';

const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
export const prisma = new PrismaClient({ adapter });
```

## コーディング規約

- ESLint による自動フォーマット
- TypeScript strict モード有効
- コンポーネントは関数コンポーネントで記述
- ファイル名はケバブケース（例: `image-upload.tsx`）
- コンポーネント名はパスカルケース（例: `ImageUpload`）

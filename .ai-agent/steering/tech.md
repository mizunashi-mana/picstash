# Picstash 技術概要

## 技術スタック

| カテゴリ | 技術 | 備考 |
|---------|------|------|
| 言語 | TypeScript | フロントエンド・バックエンド共通 |
| フロントエンド | React + Vite | SPA 構成 |
| 状態管理 | TanStack Query | サーバー状態のキャッシュ・同期 |
| UI ライブラリ | Mantine | コンポーネント・スタイリング |
| バックエンド | Fastify | 高速な Node.js フレームワーク |
| ORM | Prisma | 型安全なデータベースアクセス |
| データベース | SQLite | ファイルベースでシンプル |
| ベクトル検索 | sqlite-vec | SQLite 拡張で類似検索 |
| 画像ストレージ | ローカルファイル | サーバーのディスクに保存 |
| AI/ML | 未定 | CLIP モデルでタグ推薦・類似検索 |
| テスト | Vitest | Vite ネイティブで高速 |

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

- `packages/client` - React フロントエンド
- `packages/server` - Fastify バックエンド API
- `packages/shared` - 共有型定義・定数

詳細は [structure.md](../structure.md) を参照。

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
# マイグレーション作成
npm run db:migrate:dev

# マイグレーション実行（本番）
npm run db:migrate

# Prisma Studio（DB GUI）
npm run db:studio
```

## コーディング規約

- ESLint による自動フォーマット
- TypeScript strict モード有効
- コンポーネントは関数コンポーネントで記述
- ファイル名はケバブケース（例: `image-upload.tsx`）
- コンポーネント名はパスカルケース（例: `ImageUpload`）

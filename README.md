# Picstash

イラスト画像を管理するための Web アプリケーションです。

## 概要

Picstash は、イラストや画像作品を効率的に整理・管理するためのツールです。タグ付け、検索、コレクション機能により、大量のイラストを簡単に管理できます。

## 主な機能

- **画像管理**: イラストのアップロード・閲覧・削除
- **タグ付け**: 作品にタグを付けて分類
- **検索**: タグやキーワードで素早く検索
- **コレクション**: お気に入りの作品をまとめて管理
- **サムネイル表示**: ギャラリー形式での一覧表示

## 技術スタック

- **言語**: TypeScript
- **フロントエンド**: React 19 + Vite 7, Mantine 8, TanStack Query
- **バックエンド**: Fastify 5, Prisma 7
- **データベース**: SQLite (better-sqlite3)
- **テスト**: Vitest
- **リンター**: ESLint 9 (Flat Config)

## セットアップ

```bash
# 依存関係のインストール
npm install

# データベースのセットアップ
npm run db:migrate

# 開発サーバーの起動（フロント + バック同時）
npm run dev
```

開発サーバー起動後:
- フロントエンド: http://localhost:5173
- バックエンド API: http://localhost:3000

## ライセンス表記

このリポジトリは、以下のライセンスからお好きなものを選択して利用できます：

- **Apache License, Version 2.0**
  [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0) の条項に基づき、このリポジトリを使用、変更、配布できます。

- **Mozilla Public License, Version 2.0**
  [Mozilla Public License 2.0](https://www.mozilla.org/MPL/2.0/) の条項に基づき、このリポジトリを使用、変更、配布できます。

注意：このリポジトリへの貢献または使用により、選択したライセンスの全文に同意したものとみなされます。

[LICENSE](./LICENSE) も併せてご確認ください。

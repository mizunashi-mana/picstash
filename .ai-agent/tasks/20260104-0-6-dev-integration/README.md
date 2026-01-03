# 0-6: 開発サーバー統合起動

## 目的・ゴール

ルートから `npm run dev` でフロントエンド（Vite）とバックエンド（Fastify）を同時に起動できるようにする。

## 実装方針

1. `concurrently` を使用してスクリプトを並列実行
2. ルート `package.json` に以下のスクリプトを追加:
   - `dev` - フロント + バック同時起動
   - `dev:client` - フロントエンドのみ
   - `dev:server` - バックエンドのみ
3. 動作確認

## 完了条件

- [x] `npm run dev` でフロント・バックが同時起動する
- [x] `npm run dev:client` でフロントエンドのみ起動する
- [x] `npm run dev:server` でバックエンドのみ起動する
- [x] Vite のプロキシ経由で API にアクセスできる

## 作業ログ

### 2026-01-04

- タスク開始
- `concurrently` をルートにインストール（npm-run-all より積極的にメンテされている）
- ルート `package.json` に dev スクリプトを追加
  - `dev`: client と server を並列起動（色分け表示）
  - `dev:client`: フロントエンドのみ
  - `dev:server`: バックエンドのみ
- 動作確認完了
  - Vite: http://localhost:5173
  - Fastify: http://localhost:3000
- **タスク完了**

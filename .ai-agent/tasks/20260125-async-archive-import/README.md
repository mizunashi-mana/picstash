# アーカイブインポート非同期化

## 目的・ゴール

アーカイブからの画像インポートを非同期化し、大量の画像をインポートする際のタイムアウトやユーザー体験の問題を解決する。

## 現状の問題

- `POST /api/archives/:sessionId/import` は同期的に全画像を処理
- 画像数が多いとリクエストがタイムアウトする可能性がある
- ユーザーは処理完了まで待たされ、進捗がわからない

### 現在の処理フロー

1. API がリクエストを受け取る
2. `importFromArchive()` が順次画像を処理
3. 全画像の処理完了後にレスポンスを返す

## 実装方針

### 1. ジョブキューを使用した非同期処理

既存の `JobQueue` インフラを活用:
- 新しいジョブタイプ `archive-import` を追加
- 各画像のインポートをジョブとして登録
- ジョブワーカーがバックグラウンドで処理

### 2. API の変更

`POST /api/archives/:sessionId/import`:
- 即座にジョブIDを含むレスポンスを返す
- ステータスコード 202 Accepted

新規エンドポイント `GET /api/import-jobs/:jobId`:
- インポートジョブの進捗状況を取得

### 3. フロントエンドの対応

- インポート開始後、ポーリングで進捗を確認
- 進捗表示UIの追加

## 完了条件

- [x] `archive-import` ジョブタイプの実装
- [x] API が非同期レスポンスを返す
- [x] 進捗確認エンドポイントの実装
- [x] フロントエンドの進捗表示対応
- [x] 既存のテストが通る
- [x] 新しいテストの追加

## 作業ログ

- 2026-01-25: タスク開始、現状分析
- 2026-01-25: `archive-import-worker.ts` を実装
- 2026-01-25: `archive-controller.ts` を非同期対応に更新
- 2026-01-25: `GET /api/import-jobs/:jobId` エンドポイント追加
- 2026-01-25: フロントエンドの `ArchiveImportTab` を非同期対応に更新
- 2026-01-25: テスト追加（archive-import-worker.test.ts: 6件）
- 2026-01-25: 全テスト通過を確認（server: 510件、web-client: 220件）

## 変更ファイル

### サーバー
- `packages/server/src/infra/workers/archive-import-worker.ts` (新規)
- `packages/server/src/infra/workers/index.ts`
- `packages/server/src/infra/http/controllers/archive-controller.ts`
- `packages/server/src/index.ts`
- `packages/server/tests/infra/workers/archive-import-worker.test.ts` (新規)

### フロントエンド
- `packages/web-client/src/features/archive-import/api.ts`
- `packages/web-client/src/features/archive-import/index.ts`
- `packages/web-client/src/features/import/components/ArchiveImportTab.tsx`
- `packages/web-client/tests/features/import/ArchiveImportTab.test.tsx`

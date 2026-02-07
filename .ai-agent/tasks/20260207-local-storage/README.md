# セグメント 1-4: ローカルストレージ対応

## 目的
デスクトップアプリで指定フォルダに画像・DB を保存し、ローカルファイルシステムでの永続化を実現する。

## ゴール
- ユーザーが選択したフォルダに画像ファイルと SQLite DB が保存される
- アプリ再起動後もデータが維持される
- 画像アップロード・表示・削除がローカルストレージで正常に動作する

## 現状分析

### 既に実装済み（基盤）
| コンポーネント | ファイル | 説明 |
|---------------|---------|------|
| StorageManager | `main/storage-manager.ts` | ストレージパスの管理、ファイル読み書き |
| CoreManager | `main/core-manager.ts` | @picstash/core の初期化・解放 |
| MigrationRunner | `main/migration-runner.ts` | Prisma マイグレーションの実行 |
| IPC ハンドラ | `main/ipc-handlers.ts` | ストレージ操作・API リクエスト |
| API ルーター | `main/ipc/api-router.ts` | CoreContainer を使った API |
| UploadService | `main/services/upload-service.ts` | 画像アップロード・サムネイル生成 |
| IpcHttpClient | `renderer/shared/api/ipc-http-client.ts` | IPC 経由の API 呼び出し |
| Protocol Handler | `main/protocol-handler.ts` | `picstash://storage/` URL でのファイル配信 |

### 未実装
1. **ストレージ選択 UI** - 初回起動時にストレージフォルダを選択する画面
2. **画像アップロード時の DB 登録** - アップロード後に ImageRepository に登録

## 実装方針

### 1. ストレージ選択画面の実装
- 初回起動時（ストレージ未設定時）に表示する専用画面
- フォルダ選択ボタンでダイアログを表示
- 選択後に @picstash/core を初期化してメイン画面へ遷移

### 2. 画像アップロードの完結
- 現在の UploadService は画像ファイルの保存のみ
- ImageRepository への登録を追加し、DB と連携

### 3. 動作確認
- アプリ起動 → ストレージ選択 → 画像アップロード → 表示 → 削除
- アプリ再起動後のデータ永続性確認

## 完了条件
- [x] 初回起動時にストレージフォルダ選択画面が表示される
- [x] フォルダ選択後にメイン画面に遷移する
- [x] 画像アップロードでファイルと DB 両方に保存される
- [x] アップロードした画像がギャラリーに表示される
- [x] 画像削除でファイルと DB 両方から削除される
- [x] アプリ再起動後もデータが維持される

## 作業ログ

### 2026-02-07
- 現状分析完了
- 基盤は既に実装済みであることを確認
- 残りは UI とアップロード時の DB 登録のみ

#### 実装内容
1. **ストレージ選択画面の実装**
   - `StorageSetupPage` コンポーネントを作成
   - `App.tsx` でストレージ初期化状態をチェックし、未初期化なら選択画面を表示
   - フォルダ選択後にメイン画面へ遷移

2. **画像アップロード時の DB 登録処理を追加**
   - `api-router.ts` に `POST /api/images/from-local` エンドポイントを追加
   - `local-api.ts` を修正して IPC 経由で API を呼び出すように変更

3. **E2E テストの追加**
   - ストレージ選択画面のテストを追加
   - 全 11 テストがパス

#### 変更ファイル
- `src/renderer/features/storage-setup/pages/StorageSetupPage.tsx` (新規)
- `src/renderer/features/storage-setup/pages/index.ts` (新規)
- `src/renderer/features/storage-setup/index.ts` (新規)
- `src/renderer/App.tsx` (修正)
- `src/main/ipc/api-router.ts` (修正)
- `src/renderer/features/upload/local-api.ts` (修正)
- `tests/e2e/app.spec.ts` (修正)

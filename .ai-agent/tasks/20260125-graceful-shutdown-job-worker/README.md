# ジョブワーカーにグレースフルシャットダウンを実装する

Issue: https://github.com/mizunashi-mana/picstash/issues/71

## 目的・ゴール

ジョブワーカープロセスにグレースフルシャットダウン機能を実装し、シャットダウン時に実行中のジョブを安全に完了させる。

## 現状の問題

- `JobWorker.stop()` は単に `setInterval` をクリアするだけ
- 実行中のジョブ（`isProcessing = true` の状態）を待たずに終了する
- デプロイ時やプロセス再起動時にジョブが途中で失敗する可能性がある

## 実装方針

### 1. JobWorker の改善

- `isShuttingDown` フラグを追加
- `stop()` メソッドを `Promise` を返すように変更
- シャットダウン要求時:
  1. `isShuttingDown = true` に設定
  2. 新規ジョブの取得を停止（`poll()` で早期リターン）
  3. 実行中のジョブが完了するまで待機
  4. タイムアウト後は強制終了

### 2. 設定の追加

`JobWorkerConfig` に以下を追加:
- `gracefulShutdownTimeout?: number` - グレースフルシャットダウンのタイムアウト（デフォルト: 30秒）

### 3. index.ts の更新

- `jobWorker.stop()` を `await` で待機
- 適切なエラーハンドリング

## 完了条件

- [x] `JobWorker.stop()` が Promise を返し、実行中のジョブ完了を待つ
- [x] シャットダウンタイムアウトが設定可能
- [x] タイムアウト時に適切なログが出力される
- [x] 既存のテストが通る
- [x] 新しいテストが追加されている

## 作業ログ

- 2026-01-25: タスク開始
- 2026-01-25: JobWorker に graceful shutdown 機能を実装
- 2026-01-25: index.ts のシャットダウン処理を更新
- 2026-01-25: テストを追加（10件）
- 2026-01-25: 全テスト通過を確認（server: 503件、web-client: 82件）

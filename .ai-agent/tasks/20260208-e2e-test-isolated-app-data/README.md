# E2E テスト時に Application データを分離する

## 目的・ゴール

E2E テスト実行時に、Application データ（設定ファイル、DB、ストレージ）を `~/Library/Application Support/` とは別の場所に保存することで、テストが本番データに影響を与えないようにする。

## 背景

現在の desktop-app の E2E テストは、本番と同じ `app.getPath('userData')` を使用している。これにより:
- テスト実行が本番データを破壊するリスクがある
- テストが本番の設定に依存してしまう（例: ストレージパス設定済みだとテストがスキップされる可能性）
- 並列テスト実行時にデータ競合が発生する可能性がある

## 実装方針

Electron の `app.setPath()` を使用して、E2E テスト時に `userData` パスをテスト専用ディレクトリに変更する。

### 方法

1. **環境変数で制御**: E2E テスト時に環境変数（例: `PICSTASH_E2E_TEST=true`）を設定
2. **テスト専用パス設定**: `app.whenReady()` の前に `app.setPath('userData', testDataPath)` を呼び出し
3. **テストデータディレクトリ**: プロジェクト内の `./tmp/e2e-data` または一時ディレクトリを使用
4. **テスト後のクリーンアップ**: テスト終了時にテストデータを削除

### 変更対象ファイル

- `packages/desktop-app/src/main/index.ts` - テスト時のパス設定追加
- `packages/desktop-app/tests/e2e/app.spec.ts` - 環境変数設定、クリーンアップ追加
- `packages/desktop-app/playwright.config.ts` - 環境変数設定

## 完了条件

- [x] E2E テスト実行時に `~/Library/Application Support/` 以外の場所にデータが保存される
- [x] テスト終了後にテストデータがクリーンアップされる
- [x] 既存の E2E テストが正常にパスする
- [x] 本番ビルド時には通常通り `~/Library/Application Support/` を使用する

## 作業ログ

### 2026-02-08

- タスク開始
- 現在の実装を調査
  - `storage-manager.ts`: `app.getPath('userData')` で設定ファイルパスを決定
  - `core-manager.ts`: ユーザー選択のストレージパス内に DB を保存
  - E2E テスト: 現状、パス分離の仕組みなし
- 実装完了
  - `src/main/index.ts`: `PICSTASH_E2E_DATA_DIR` 環境変数で userData パスを変更する機能を追加
  - `tests/e2e/app.spec.ts`: E2E テスト起動時に環境変数を設定、beforeAll/afterAll でクリーンアップを実行
- E2E テスト実行: 11 テストすべてパス
- 本番データディレクトリ (`~/Library/Application Support/@picstash/desktop-app/`) への影響なしを確認

# widgets 層の API アダプター移行

## 概要

プロジェクト「API クライアントインターフェース」の補完タスク。widgets 層の API アダプター（`job-status/api/jobs.ts`）を `ApiClient` インターフェース経由に移行し、旧 `apiClient` 関数を削除する。

関連プロジェクト: [20260205-api-client-interface](../../projects/20260205-api-client-interface/README.md)

## 目的・ゴール

- `widgets/job-status/api/jobs.ts` を `ApiClient` インターフェース経由に移行
- 旧 `apiClient` 関数（`shared/api/client.ts`）を削除
- プロジェクトの T7/T8（テスト・クリーンアップ）に相当する作業を完了

## 現状分析

### 対象ファイル

| ファイル | 関数数 | 使用パターン |
|---------|--------|-------------|
| `widgets/job-status/api/jobs.ts` | 2 | `apiClient` + `jobsEndpoints` |

### 対応する ApiClient メソッド

| Widget | ApiClient プロパティ | メソッド |
|--------|---------------------|----------|
| job-status | `jobs` | `list`, `detail` |

## 実装方針

T5/T6 と同様に **方針 B**（API モジュールを削除し、直接 `useApiClient()` を使用）を採用。

### 移行パターン

1. `widgets/job-status/api/jobs.ts` の利用箇所を特定
2. 利用側で `useApiClient()` を使用し、`apiClient.jobs.xxx()` 形式に変更
3. 不要になった API ファイルを削除
4. `shared/api/client.ts` と関連エクスポートを削除

## 完了条件

- [x] `widgets/job-status/api/jobs.ts` の利用箇所が `useApiClient()` 経由に移行
- [x] `widgets/job-status/api/jobs.ts` を削除
- [x] `shared/api/client.ts` を削除
- [x] `shared/api/index.ts` から `apiClient` エクスポートを削除
- [x] typecheck が通る
- [x] lint が通る
- [x] ユニットテスト通過
- [x] Storybook 動作確認

## 作業ログ

### 2026-02-07

- タスク開始
- 現状分析完了
- `@picstash/api` の `Job` 型に `payload` フィールドを追加
- `@picstash/api` の `JobsApiClient.list` の戻り値を `ListJobsResponse` 型に修正
- `widgets/job-status/model/context.tsx` を `useApiClient()` 経由に移行
- `widgets/job-status/lib/utils.ts` の `Job` 型インポートを `@picstash/api` から取得
- `widgets/job-status/ui/JobStatusButton.tsx` の `Job` 型インポートを `@picstash/api` から取得
- `widgets/job-status/api/jobs.ts` を削除
- `shared/api/client.ts` を削除
- 関連テストファイルを更新（DI コンテナ mock パターンに移行）
- 不要なテストファイルを削除（`client.test.ts`, `api.test.ts`）
- Storybook の mock に `jobs` を追加
- 全テスト通過確認（192 tests）
- Storybook テスト通過確認（170 tests）
- **タスク完了**

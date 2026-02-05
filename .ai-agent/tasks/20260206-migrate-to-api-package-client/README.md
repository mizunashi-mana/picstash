# web-client を api パッケージの ApiClient に移行

## 目的

web-client の既存 FetchApiClient を削除し、`@picstash/api` パッケージの `createApiClient` + `FetchHttpClient` を使用するように変更する。

## ゴール

- DI container で `FetchHttpClient` + api パッケージの `createApiClient` を使用
- `shared/api/fetch-client/` ディレクトリを削除
- 既存のテスト・Storybook が動作する

## 完了条件

- [x] DI container を更新（`createApiClient(new FetchHttpClient())` を使用）
- [x] fetch-client ディレクトリを削除
- [x] 型チェック・lint 通過
- [x] ユニットテスト通過
- [ ] E2E テスト・Storybook 確認

## 実装方針

1. `container.ts` を更新
   - `createFetchApiClient()` の代わりに `createApiClient(new FetchHttpClient())` を使用
2. `fetch-client` ディレクトリを削除
3. `shared/api/index.ts` から fetch-client のエクスポートを削除
4. テスト実行・動作確認

## 作業ログ

### 2026-02-06

- タスク開始

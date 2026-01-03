# テスト実行環境整備

## 目的・ゴール

Vitest をセットアップし、`packages/server` と `packages/client` でテストを実行できるようにする。

## 実装方針

1. 各パッケージに Vitest をインストール（devDependencies）
2. Vitest 設定ファイル（`vitest.config.ts`）を作成
   - server: Node.js 環境向け設定
   - client: jsdom 環境向け設定（React Testing Library 用）
3. テスト用ディレクトリ（`tests/`）を作成
4. サンプルテストを追加して動作確認
5. npm スクリプトを整備（`test`, `test:watch`, `test:coverage`）
6. ルートの `package.json` でワークスペース全体のテストを実行できるようにする

## 完了条件

- [x] server で `npm run test` が動作する
- [x] client で `npm run test` が動作する
- [x] ルートで `npm run test` が全パッケージのテストを実行する
- [x] カバレッジ出力ができる

## 作業ログ

### 2026-01-04

- タスク開始
- server に Vitest をインストール・設定
  - `vitest.config.ts` 作成（Node.js 環境）
  - `tests/sample.test.ts` サンプルテスト追加
- client に Vitest + Testing Library をインストール・設定
  - `vitest.config.ts` 作成（jsdom 環境）
  - `@testing-library/react`, `jsdom` インストール
  - `tests/setup.ts`, `tests/sample.test.tsx` 作成
- 各パッケージに npm スクリプト追加
  - `test`: テスト実行
  - `test:watch`: ウォッチモード
  - `test:coverage`: カバレッジ付きテスト
- `@vitest/coverage-v8` をインストール
- ルート `package.json` でワークスペース全体のテスト実行を設定
- shared パッケージは `--passWithNoTests` オプションで対応
- **タスク完了**

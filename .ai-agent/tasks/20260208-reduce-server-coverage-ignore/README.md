# server パッケージの coverage チェック無効化を減らす

## 目的・ゴール

server パッケージで coverage チェックの無効化方式を改善する：
- vitest.config.ts のファイル単位 exclude をやめる
- テスト困難な部分のみ v8 ignore コメントで部分的に無効化
- テスト可能な部分のカバレッジを正確に計測できるようにする

## 現状分析

### vitest.config.ts での exclude

| カテゴリ | ファイル | 除外理由 |
|---------|---------|---------|
| エントリーポイント | `index.ts`, `app.ts` | サーバー起動コード |
| 設定 | `config.ts` | 環境変数読み込み |
| CLI | `cli/generate-embeddings.ts`, `cli/generate-label-embeddings.ts` | CLI スクリプト |
| Database | `infra/database/**/*.ts` | DB 接続・Prisma |
| Adapters | `infra/adapters/**/*.ts` | Prisma リポジトリ |
| DI | `infra/di/app-container.ts`, `infra/di/container.ts` | DI コンテナ設定 |
| Controllers | 11 ファイル | HTTP コントローラー |
| Plugins | `cors.ts`, `multipart.ts`, `rate-limit.ts` | Fastify プラグイン |
| Routes | `routes/health.ts`, `routes/index.ts` | ルート定義 |

### 存在確認結果

- `src/index.ts` ✓
- `src/app.ts` ✓
- `src/config.ts` ✓
- `src/cli/generate-embeddings.ts` ✓
- `src/cli/generate-label-embeddings.ts` ✓
- `src/infra/database/prisma-service.ts` ✓
- `src/infra/database/index.ts` ✓
- `src/infra/adapters/*.ts` ✓（11 ファイル）
- `src/infra/di/app-container.ts` ✓
- `src/infra/di/container.ts` ✓
- Controllers（11 ファイル）✓
- Plugins（3 ファイル）✓
- Routes（2 ファイル）✓

## 実装方針

1. vitest.config.ts から exclude リストを削除
2. 各ファイルを確認し、テスト困難な部分に v8 ignore コメントを追加
3. テストを実行して確認

## 完了条件

- [x] vitest.config.ts の exclude を削除
- [x] 各ファイルに必要な v8 ignore コメントを追加
- [x] テストが全て pass すること

## 作業ログ

### 2026-02-08

1. **vitest.config.ts から exclude リストを削除**

2. **v8 ignore コメントを追加したファイル**:
   - エントリーポイント: `index.ts`, `app.ts`
   - CLI: `cli/generate-embeddings.ts`, `cli/generate-label-embeddings.ts`
   - DI: `di/app-container.ts`, `di/container.ts`
   - Database: `database/prisma-service.ts`, `database/index.ts`
   - Adapters: 全11ファイル
   - Plugins: `cors.ts`, `multipart.ts`, `rate-limit.ts`
   - Routes: `health.ts`, `index.ts`

3. **テストを新規作成したファイル**:
   - `tests/config.test.ts` (config.ts のテスト)
   - `tests/infra/http/controllers/archive-controller.test.ts`
   - `tests/infra/http/controllers/collection-controller.test.ts`
   - `tests/infra/http/controllers/image-attribute-controller.test.ts`
   - `tests/infra/http/controllers/job-controller.test.ts`
   - `tests/infra/http/controllers/label-controller.test.ts`
   - `tests/infra/http/controllers/recommendation-controller.test.ts`
   - `tests/infra/http/controllers/recommendation-conversion-controller.test.ts`
   - `tests/infra/http/controllers/search-controller.test.ts`
   - `tests/infra/http/controllers/stats-controller.test.ts`
   - `tests/infra/http/controllers/url-crawl-controller.test.ts`
   - `tests/infra/http/controllers/view-history-controller.test.ts`

4. **テスト結果**:
   - 全 432 テストが pass
   - カバレッジ: 97.39% (Statements), 95.63% (Branch), 97.81% (Funcs), 97.42% (Lines)
   - v8 ignore 対象ファイルは正しく 0% として表示

# テストカバレッジチェックのignore削減

## 目的・ゴール

現在、vitest のカバレッジ設定で多くのファイル・ディレクトリが exclude されている。
テスト未実装を理由に除外されているファイルにテストを追加し、exclude リストを削減する。

## 現状

### packages/server/vitest.config.ts

除外対象:
- エントリーポイント・CLI: `src/index.ts`, `src/app.ts`, `src/config.ts`, `src/cli/**/*.ts`
- インフラ層: `src/infra/di/**`, `database/**`, `http/**`, `queue/**`, `storage/**`, `workers/**`, `adapters/**`, `embedding/**`
- アプリケーション層: `src/application/image/**`, `image-attribute/**`, `label/**`, `url-crawl/**`, `ports/**`, `embedding/**`, `attribute-suggestion/**`, `archive/**`, `recommendation/**`
- ドメイン層: `src/domain/collection/**`, `image-attribute/**`, 一部個別ファイル
- 共有モジュール: `src/shared/**/*.ts`
- インデックスファイル: `src/**/index.ts`

### packages/web-client/vitest.config.ts

除外対象:
- エントリーポイント: `src/main.tsx`, `src/vite-env.d.ts`
- Storybook: `src/**/*.stories.tsx`
- 全 feature: `src/features/**/*.{ts,tsx}` (大きな範囲)
- API クライアント: `src/api/**/*.ts`
- ルーティング: `src/routes/**/*.tsx`
- 共有コンポーネント: `src/shared/**/*.{ts,tsx}`
- App コンポーネント: `src/App.tsx`
- インデックスファイル: `src/**/index.ts`

## 実装方針

1. **サーバー側ドメイン層のテスト追加** (優先度: 高)
   - 除外されているがビジネスロジックを含むドメインファイルにテストを追加
   - 例: `Image.ts`, `Label.ts`, `UrlCrawlConfig.ts` など

2. **サーバー側アプリケーション層の単純なユースケースにテスト追加** (優先度: 中)
   - 外部依存が少なく、モックしやすいユースケースから着手

3. **Web クライアント側のユーティリティ関数にテスト追加** (優先度: 中)
   - `shared/helpers/` 内のユーティリティ関数からテストを追加

4. **テスト追加後、対応する exclude を削除**

## 完了条件

- [x] vitest.config.ts の exclude リストが現状より少なくなっている
- [x] 追加したテストがすべてパスする
- [x] カバレッジ閾値（80%）を満たしている
- [x] `npm run test:coverage` が成功する

## 作業ログ

### 2026-01-24

#### 追加したテスト

1. **server: HtmlImageExtractor.ts** (34 tests)
   - `tests/domain/url-crawl/html-image-extractor.test.ts` を新規作成
   - `extractImageUrls`, `extractPageTitle`, `filterImageEntries` のテストを追加
   - カバレッジ: lines 97.29%, branches 91.42%

2. **server: UrlCrawlConfig.ts の追加テスト** (8 tests)
   - `tests/domain/url-crawl/url-crawl-config.test.ts` に追加
   - `isSupportedImageExtension`, `getMimeTypeFromExtension`, `isImageUrl` (エッジケース), `extractFilenameFromUrl` (エッジケース) のテストを追加

3. **web-client: buildUrl ヘルパー** (14 tests)
   - `tests/helpers/url.test.ts` を新規作成
   - カバレッジ: 100%

#### 除外リストから削除したファイル

**packages/server/vitest.config.ts:**
- `src/domain/url-crawl/HtmlImageExtractor.ts` - テスト追加により削除

**packages/web-client/vitest.config.ts:**
- `src/shared/**/*.{ts,tsx}` → `src/shared/components/**/*.{ts,tsx}` と `src/shared/hooks/**/*.{ts,tsx}` に限定
  - これにより `src/shared/helpers/url.ts` がカバレッジ対象に

#### 除外リストに残したファイル

- `src/domain/url-crawl/UrlCrawlConfig.ts`: `??` 演算子の到達困難な分岐により branch 閾値 80% 未満
- 型定義のみのファイル（interface）: テスト対象外
  - `CrawledImageEntry.ts`, `UrlCrawlSession.ts`, `ArchiveEntry.ts`, `ArchiveSession.ts`

#### 結果

- server: 306 tests passed, カバレッジ 97.94%
- web-client: 15 tests passed, カバレッジ 100%

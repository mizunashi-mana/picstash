# T6: features 層の API アダプター移行

## 概要

プロジェクト「API クライアントインターフェース」のタスク T6。features 層の API アダプター（11 ファイル）を `ApiClient` インターフェース経由に移行する。

関連プロジェクト: [20260205-api-client-interface](../../projects/20260205-api-client-interface/README.md)

## 目的・ゴール

- features 層の API アダプター（11 ファイル）を `ApiClient` インターフェース経由に移行
- `apiClient` 関数と endpoint 関数への直接依存を排除
- 型定義は `@picstash/api` から re-export

## 現状分析

### 対象ファイル

| ファイル | 関数数 | 使用パターン |
|---------|--------|-------------|
| `find-duplicates/api/duplicates.ts` | 2 | `apiClient` + URL 文字列 |
| `find-similar-images/api/similar.ts` | 1 | `apiClient` + `imageEndpoints` |
| `import-archive/api/archive.ts` | 7 | 直接 `fetch()` |
| `import-url/api/crawl.ts` | 6 | 直接 `fetch()` |
| `manage-image-attributes/api/attributes.ts` | 5 | `apiClient` + `imageEndpoints` |
| `manage-image-description/api/description.ts` | 2 | `apiClient` + `imageEndpoints`/`jobsEndpoints` |
| `search-images/api/search.ts` | 5 | `apiClient` + `searchEndpoints` |
| `track-view-history/api/view-history.ts` | 4 | `apiClient` + `viewHistoryEndpoints` |
| `upload-image/api/upload.ts` | 1 | 直接 `fetch()` |
| `view-recommendations/api/recommendations.ts` | 3 | `apiClient` + URL 文字列 |
| `view-stats/api/stats.ts` | 4 | `apiClient` + `statsEndpoints` |

### 対応する ApiClient メソッド

| Feature | ApiClient プロパティ | メソッド |
|---------|---------------------|----------|
| find-duplicates | `images` | `fetchDuplicates`, `delete` |
| find-similar-images | `images` | `fetchSimilar` |
| import-archive | `archiveImport` | `upload`, `getSession`, `deleteSession`, `getThumbnailUrl`, `getImageUrl`, `importImages`, `getImportJobStatus` |
| import-url | `urlCrawl` | `crawl`, `getSession`, `deleteSession`, `getThumbnailUrl`, `getImageUrl`, `importImages` |
| manage-image-attributes | `imageAttributes` | `list`, `create`, `update`, `delete` + `images.fetchSuggestedAttributes` |
| manage-image-description | `images`, `jobs` | `generateDescription`, `detail` |
| search-images | `search` | `suggestions`, `saveHistory`, `fetchHistory`, `deleteHistory`, `deleteAllHistory` |
| track-view-history | `viewHistory` | `recordStart`, `recordEnd`, `list`, `imageStats` |
| upload-image | `images` | `upload` |
| view-recommendations | `recommendations` | `fetch`, `recordImpressions`, `recordClick` |
| view-stats | `stats` | `overview`, `viewTrends`, `recommendationTrends`, `popularImages` |

## 実装方針

T5 と同様に **方針 B**（API モジュールを削除し、直接 `useApiClient()` を使用）を採用。

### 移行パターン

1. features API ファイルの関数を呼び出している箇所を特定
2. 呼び出し側で `useApiClient()` を使用し、`apiClient.xxx.method()` 形式に変更
3. 型定義は `@picstash/api` から re-export（feature index.ts で）
4. 不要になった API ファイルを削除

### 型定義の扱い

- `@picstash/api` に既に存在する型: そのまま使用または re-export
- `@picstash/api` に存在しない型: 必要であれば `@picstash/api` に追加

## 完了条件

- [ ] `find-duplicates/api/duplicates.ts` の利用箇所が `useApiClient()` 経由に移行
- [ ] `find-similar-images/api/similar.ts` の利用箇所が `useApiClient()` 経由に移行
- [ ] `import-archive/api/archive.ts` の利用箇所が `useApiClient()` 経由に移行
- [ ] `import-url/api/crawl.ts` の利用箇所が `useApiClient()` 経由に移行
- [ ] `manage-image-attributes/api/attributes.ts` の利用箇所が `useApiClient()` 経由に移行
- [ ] `manage-image-description/api/description.ts` の利用箇所が `useApiClient()` 経由に移行
- [ ] `search-images/api/search.ts` の利用箇所が `useApiClient()` 経由に移行
- [ ] `track-view-history/api/view-history.ts` の利用箇所が `useApiClient()` 経由に移行
- [ ] `upload-image/api/upload.ts` の利用箇所が `useApiClient()` 経由に移行
- [ ] `view-recommendations/api/recommendations.ts` の利用箇所が `useApiClient()` 経由に移行
- [ ] `view-stats/api/stats.ts` の利用箇所が `useApiClient()` 経由に移行
- [ ] 不要になった features API ファイルを削除
- [ ] typecheck が通る
- [ ] lint が通る
- [ ] ユニットテスト通過
- [ ] Storybook 動作確認

## 作業ログ

### 2026-02-06

- タスク開始
- 現状分析完了
- 11 ファイル・40 関数の移行が必要

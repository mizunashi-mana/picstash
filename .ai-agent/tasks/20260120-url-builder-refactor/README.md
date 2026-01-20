# encodeURIComponent の使用をやめ、URLビルダを利用する

## 目的・ゴール

手動での `encodeURIComponent` 使用をやめ、`qs` ライブラリを使用した `buildUrl` ヘルパー関数で URL 構築を安全かつ一貫性のある方法に統一する。

## 現状の問題

- `encodeURIComponent` を手動で呼び出している箇所が分散している
- テンプレートリテラルでの URL 構築はエスケープ漏れのリスクがある
- パスとクエリパラメータの構築方法が統一されていない

## 対象箇所

| ファイル | 行 | 用途 | 対応 |
|---------|-----|------|------|
| `features/gallery/api.ts` | 42 | 画像検索クエリ | `buildUrl` に置き換え |
| `features/gallery/api.ts` | 51-57 | ページネーション | `buildUrl` に置き換え |
| `features/gallery/api.ts` | 243 | 検索サジェストクエリ | `buildUrl` に置き換え |
| `features/recommendations/components/RecommendationSection.tsx` | 168 | conversionId パラメータ | `buildUrl` に置き換え |
| `features/stats/components/PopularImagesList.tsx` | 30 | サムネイルパス | 維持（パスパラメータ） |

## 実装方針

1. `qs` パッケージをインストール
2. `shared/helpers/url.ts` に `buildUrl` ヘルパー関数を作成
3. クエリパラメータを使う箇所を `buildUrl` に置き換え
4. パス内のパラメータ（`PopularImagesList` の thumbnailPath）は `encodeURIComponent` を維持

### 変更例

**Before:**
```typescript
`/images?q=${encodeURIComponent(query.trim())}`
```

**After:**
```typescript
buildUrl('/images', { q: query.trim() })
```

## 完了条件

- [x] `qs` パッケージをインストール
- [x] `buildUrl` ヘルパー関数を作成
- [x] クエリパラメータを使う3箇所を `buildUrl` に置き換え
- [x] パスパラメータ（1箇所）は `encodeURIComponent` を維持
- [x] 型チェック（`npm run typecheck`）がパス
- [x] リンターチェック（`npm run lint`）がパス
- [x] e2e テストがパス（10/10）

## 作業ログ

### 2026-01-20

1. `qs` と `@types/qs` を client パッケージにインストール
2. `shared/helpers/url.ts` に `buildUrl` ヘルパー関数を作成
   - `undefined`/`null` 値を自動フィルタリング
   - `qs.stringify` でクエリ文字列を生成
3. `gallery/api.ts` の3箇所をリファクタリング
   - `fetchImages`: `buildUrl` 使用
   - `fetchImagesPaginated`: `URLSearchParams` → `buildUrl`
   - `fetchSearchSuggestions`: `buildUrl` 使用
4. `RecommendationSection.tsx` をリファクタリング
   - conversionId パラメータを `buildUrl` で構築
5. 全チェック完了
   - typecheck: パス
   - lint: パス
   - e2e: 10/10 パス

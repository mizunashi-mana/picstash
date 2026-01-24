# 統計表示で画像サムネイルが表示されない

Issue: https://github.com/mizunashi-mana/picstash/issues/64

## 目的・ゴール

統計ダッシュボードの「よく閲覧された画像」でサムネイルを正常に表示する。

## 問題の原因

`PopularImagesList.tsx` の `getThumbnailUrl` 関数で誤った URL パターンを使用:

```typescript
// 現在（誤り）
return `/api/images/file/${encodeURIComponent(thumbnailPath)}`;

// 正しいパターン（他コンポーネントと同様）
return `/api/images/${imageId}/thumbnail`;
```

## 実装方針

1. `PopularImagesList.tsx` の `getThumbnailUrl` を修正
2. `thumbnailPath` ではなく `id` を使用して URL を生成

## 完了条件

- [x] サムネイルが正常に表示される
- [x] 型チェックが通る
- [x] リントが通る

## 作業ログ

### 2026-01-24

1. 問題の原因を特定
   - `PopularImagesList.tsx` で誤った URL パターンを使用
   - `/api/images/file/${thumbnailPath}` → `/api/images/${id}/thumbnail` に修正

2. 修正完了
   - `getThumbnailUrl` 関数を修正
   - 型チェック・リント通過

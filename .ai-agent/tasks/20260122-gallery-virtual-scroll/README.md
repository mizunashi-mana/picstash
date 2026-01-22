# ギャラリーページの仮想スクロール導入

## 目的・ゴール

ギャラリーページに仮想スクロール（Virtual Scroll）を導入し、大量の画像を表示する際のパフォーマンスを向上させる。

## 現状の問題

- `GalleryPage.tsx` は InfiniteQuery で画像をページネーション取得し、IntersectionObserver で無限スクロールを実現している
- しかし、取得した全画像を DOM にレンダリングするため、画像数が増えるとメモリ使用量と描画コストが増大する
- 数百〜数千枚の画像がある場合、スクロールのカクつきやメモリ圧迫が発生する可能性がある

## 実装方針

### ライブラリ選定

**採用: `@tanstack/react-virtual`**
- TanStack Query と同じエコシステムで相性が良い
- 軽量でシンプルな API
- カスタムレイアウト（グリッド）に対応
- TypeScript サポートが充実

**検討したが不採用:**
- `react-window`: 古く、グリッドレイアウトの実装が複雑
- `react-virtuoso`: 機能が豊富だが、今回の要件にはオーバースペック

### 変更対象

1. **`package.json`**
   - `@tanstack/react-virtual` をインストール

2. **`GalleryPage.tsx`**
   - `useVirtualizer` フックを使用して仮想スクロールを実装
   - グリッドレイアウトを維持しつつ、表示範囲外のアイテムは DOM から除外
   - IntersectionObserver と組み合わせて無限スクロールを継続

### 実装アプローチ

```
現在: SimpleGrid で全アイテムをレンダリング
    ↓
変更後: useVirtualizer で可視範囲のアイテムのみレンダリング
       - 行単位で仮想化（1行に複数カラム）
       - スクロールコンテナのサイズに応じてカラム数を計算
       - overscan で前後数行を先読みしてスムーズなスクロールを実現
```

## 完了条件

- [x] `@tanstack/react-virtual` をインストール
- [x] `GalleryPage.tsx` に仮想スクロールを実装
- [x] グリッドレイアウト（レスポンシブ対応）を維持
- [x] 無限スクロール（InfiniteQuery）との連携を維持
- [x] 型チェック（`npm run typecheck`）がパス
- [x] リンターチェック（`npm run lint`）がパス
- [x] ブラウザで動作確認（スクロール、検索、画像クリック）

## 作業ログ

### 2026-01-22

1. `@tanstack/react-virtual` をインストール
2. `GalleryPage.tsx` に仮想スクロールを実装
   - `useVirtualizer` フックで行単位の仮想化
   - `useElementSize` でコンテナ幅を監視しレスポンシブ対応
   - 無限スクロール（InfiniteQuery）との連携
   - overscan: 3 で前後3行を先読み
3. 型チェック・リンターチェックがパス
4. ブラウザで動作確認
   - 197件の画像が5列グリッドで表示
   - スクロール時に可視範囲のアイテムのみレンダリング
   - 画像クリックで詳細ページへナビゲーション
   - 検索機能も正常動作


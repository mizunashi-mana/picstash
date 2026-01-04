# 画像詳細表示 (1-4)

## 目的・ゴール

ギャラリーの画像をクリックすると、画像を大きく表示できる詳細画面に遷移する。

## 現状分析

### 既存実装
- **バックエンド**:
  - `GET /api/images` - 画像一覧取得
  - `GET /api/images/:id/file` - 画像ファイル取得（実装済み）
  - `GET /api/images/:id/thumbnail` - サムネイル取得
- **フロントエンド**:
  - `ImageGallery` - サムネイル一覧表示（クリックイベントなし）
  - React Router 設定済み
  - Mantine UI 使用

### 不足している実装
- `GET /api/images/:id` - 単一画像のメタデータ取得API
- 画像詳細ページコンポーネント
- ギャラリー → 詳細画面へのナビゲーション

## 実装方針

### 1. バックエンド
- `GET /api/images/:id` エンドポイント追加（メタデータ返却）

### 2. フロントエンド
- `packages/client/src/features/gallery/pages/ImageDetailPage.tsx` 作成
- `packages/client/src/features/gallery/api.ts` に `fetchImage(id)` 追加
- React Router にルート追加: `/images/:id`
- `ImageGallery` のカードをクリック可能に（Link or navigate）

### 3. 詳細画面の内容
- 大きな画像表示（オリジナルサイズ or 画面フィット）
- メタデータ表示:
  - ファイル名
  - サイズ（幅 x 高さ）
  - ファイルサイズ
  - アップロード日時
- 戻るボタン

## 完了条件

- [x] ギャラリーの画像をクリックすると詳細ページに遷移する
- [x] 詳細ページで画像が大きく表示される
- [x] 画像のメタデータ（ファイル名、サイズ、日時）が表示される
- [x] 戻るボタンでギャラリーに戻れる
- [x] 直接URL（/images/:id）でアクセスしても表示される

## 作業ログ

### 2026-01-04

#### 実装完了

**バックエンド**:
- `GET /api/images/:id` エンドポイント追加（`packages/server/src/infra/http/routes/images.ts`）

**フロントエンド**:
- `fetchImage(id)` API関数追加（`packages/client/src/features/gallery/api.ts`）
- `ImageDetailPage` コンポーネント作成（`packages/client/src/features/gallery/pages/ImageDetailPage.tsx`）
  - 大きな画像表示（画面フィット、最大高さ70vh）
  - メタデータ表示: ファイル名、サイズ（幅 x 高さ）、ファイルサイズ、形式、アップロード日時
  - 戻るボタン（Link コンポーネント使用）
- React Router にルート追加: `/images/:id`（`packages/client/src/routes/index.tsx`）
- `ImageGallery` のカードをクリック可能に変更（Link コンポーネント使用）

**依存関係**:
- `@tabler/icons-react` 追加（戻るボタンアイコン用）

**動作確認**:
- Playwright でブラウザ確認完了
- ギャラリーからの遷移、詳細表示、戻るボタン、直接URLアクセス全て正常動作

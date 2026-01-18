# 画像タイトル自動生成

## 目的・ゴール

画像を識別しやすくするために、IDではなく意味のあるタイトルを使用する。

**現状の問題:**
- alt属性などで `画像 ${id}` のようにUUIDを使用している
- スクリーンリーダーのユーザーが画像を識別しにくい
- 画像一覧やリストで内容を把握しにくい

**目標:**
- Imageエンティティに `title` フィールドを追加
- 画像インポート時に自動でタイトルを生成
- 既存のID表示をタイトル表示に置き換え

## 実装方針

### 1. タイトル生成ロジック

タイトルの生成優先順位:
1. **説明文がある場合**: 説明文の先頭部分を使用（最大50文字程度）
2. **説明文がない場合**: 「無題の画像」+ 作成日時

例:
- 説明あり: `青空の下で咲く桜の写真` → `青空の下で咲く桜の写真`
- 説明なし: `無題の画像 (2026/01/18 12:34)`

### 2. データベース変更

- Prisma スキーマに `title` フィールドを追加
- マイグレーションで既存画像にデフォルトタイトルを設定

### 3. 自動生成タイミング

- 画像アップロード時
- アーカイブからのインポート時
- URLクロールからのインポート時
- 説明文更新時（タイトルも連動更新するか選択可能）

### 4. クライアント側更新

- alt属性を `image.title` に変更
- IDを表示している箇所をタイトルに置き換え

## 完了条件

- [x] Prisma スキーマに `title` フィールド追加
- [x] Image エンティティ・API型に `title` 追加
- [x] 画像作成時にタイトル自動生成
- [x] 説明文更新時にタイトル連動更新
- [x] クライアント側のID表示をタイトル表示に変更
- [x] 既存画像へのマイグレーション
- [x] 型チェック・テスト通過

## 作業ログ

### 2026/01/18

**実装完了:**

1. **Prisma スキーマ更新** (`packages/server/prisma/schema.prisma`)
   - `title` フィールドを `@default("無題の画像")` で追加

2. **ドメイン層** (`packages/server/src/domain/image/`)
   - `Image` インターフェースに `title: string` 追加
   - `generateTitle()` ユーティリティ関数を作成
     - 説明文があれば50文字まで使用
     - なければ「無題の画像 (YYYY/MM/DD HH:mm)」形式

3. **アプリケーション層**
   - `upload-image.ts`: アップロード時にタイトル自動生成
   - `import-from-archive.ts`: アーカイブインポート時にタイトル自動生成
   - `import-from-url-crawl.ts`: URLクロールインポート時にタイトル自動生成
   - `generate-recommendations.ts`: `RecommendedImage` に `title` 追加
   - `find-duplicates.ts`: `DuplicateImageInfo` に `title` 追加
   - `stats/index.ts`: `PopularImage` に `title` 追加
   - `view-history/index.ts`: `ViewHistoryWithImage.image` に `title` 追加
   - `collection-repository.ts`: `CollectionImageInfo` に `title` 追加

4. **インフラ層**
   - `image-controller.ts`: PATCH エンドポイントで説明文更新時にタイトル連動更新
   - `prisma-stats-repository.ts`: SQL クエリに `title` 追加
   - `prisma-view-history-repository.ts`: 画像取得時に `title` 含める
   - `prisma-collection-repository.ts`: 画像取得時に `title` 含める

5. **クライアント側**
   - 全ての `Image` 型に `title` フィールド追加
   - alt属性を `image.id` から `image.title` に変更
     - `ImageGalleryView.tsx`
     - `ImageDetailPage.tsx`
     - `SimilarImagesSectionView.tsx`
     - `RecommendationSection.tsx`
     - `PopularImagesList.tsx`
     - `DuplicateGroupCard.tsx`
     - `CollectionDetailPage.tsx`

6. **テスト・Storybook**
   - モックデータに `title` フィールド追加
   - 全テスト通過確認

7. **マイグレーション**
   - `20260118000000_add_image_title/migration.sql` 作成


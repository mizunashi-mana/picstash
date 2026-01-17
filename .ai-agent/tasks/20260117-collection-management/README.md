# タスク 5-1: コレクション管理・画像追加

## 目的・ゴール

画像をシリーズや関連するグループとしてまとめて管理できる「コレクション」機能を実装する。

## 提供価値

- 関連する画像（シリーズもの、同じキャラクター等）をまとめて管理できる
- コレクション単位でブラウジングできる
- ライブラリの整理がしやすくなる

## 実装方針

### データモデル

```prisma
model Collection {
  id          String   @id @default(uuid())
  name        String
  description String?
  coverImageId String? @map("cover_image_id")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  images      CollectionImage[]
}

model CollectionImage {
  id           String     @id @default(uuid())
  collectionId String     @map("collection_id")
  imageId      String     @map("image_id")
  order        Int        @default(0)
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  createdAt    DateTime   @default(now()) @map("created_at")

  @@unique([collectionId, imageId])
  @@map("collection_image")
}
```

### バックエンド API

1. **コレクション CRUD**
   - `GET /api/collections` - コレクション一覧取得
   - `GET /api/collections/:id` - コレクション詳細取得（含む画像一覧）
   - `POST /api/collections` - コレクション作成
   - `PUT /api/collections/:id` - コレクション更新
   - `DELETE /api/collections/:id` - コレクション削除

2. **コレクション画像管理**
   - `POST /api/collections/:id/images` - 画像をコレクションに追加
   - `DELETE /api/collections/:id/images/:imageId` - 画像をコレクションから削除
   - `PUT /api/collections/:id/images/order` - 画像の順序変更

### フロントエンド

1. **コレクション一覧ページ** (`/collections`)
   - コレクションをカード形式で一覧表示
   - カバー画像（最初の画像 or 指定した画像）をサムネイルとして表示
   - 新規作成ボタン

2. **コレクション詳細ページ** (`/collections/:id`)
   - コレクション情報（名前、説明）の表示・編集
   - 含まれる画像のギャラリー表示
   - 画像の並び替え（ドラッグ&ドロップ）
   - 画像の追加・削除

3. **画像詳細ページへの統合**
   - 画像が所属するコレクションを表示
   - コレクションへの追加 UI

## 完了条件

- [x] コレクションの CRUD API がある
- [x] コレクションへの画像追加・削除ができる
- [x] コレクション一覧ページがある
- [x] コレクション詳細ページがある
- [x] 画像詳細から所属コレクションが確認できる
- [x] テストが通る

## 作業ログ

### 2026-01-17

#### 実装内容

**バックエンド:**
- Prisma スキーマに Collection と CollectionImage モデルを追加
- ドメインモデル・型定義を作成 (`packages/server/src/domain/collection/Collection.ts`)
- CollectionRepository インターフェースを定義 (`packages/server/src/application/ports/collection-repository.ts`)
- PrismaCollectionRepository を実装 (`packages/server/src/infra/adapters/prisma-collection-repository.ts`)
- DIコンテナに CollectionRepository を登録
- コレクション API ルートを実装 (`packages/server/src/infra/http/routes/collections.ts`)
  - CRUD エンドポイント
  - 画像追加・削除エンドポイント
  - 画像のコレクション取得エンドポイント

**フロントエンド:**
- API クライアントを作成 (`packages/client/src/features/collections/api.ts`)
- コレクション一覧ページを実装 (`packages/client/src/features/collections/pages/CollectionsPage.tsx`)
  - カード形式での一覧表示
  - 新規作成モーダル
  - 削除モーダル
- コレクション詳細ページを実装 (`packages/client/src/features/collections/pages/CollectionDetailPage.tsx`)
  - コレクション情報の表示・編集
  - 画像ギャラリー表示
  - 画像の削除機能
- 画像詳細ページにコレクションセクションを追加 (`packages/client/src/features/gallery/components/ImageCollectionsSection.tsx`)
  - 所属コレクションをバッジ表示
  - コレクションへの追加 UI
- ナビゲーションにコレクションリンクを追加

**動作確認:**
- API エンドポイントの動作確認完了（curl）
- コレクション作成・一覧取得
- 画像のコレクション追加・削除
- 画像のコレクション取得

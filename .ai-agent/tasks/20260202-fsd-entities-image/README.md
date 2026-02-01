# T2: Entities レイヤーの抽出（Image）

## 目的・ゴール

`features/gallery/api.ts` に混在している Image エンティティの基本型定義・CRUD API・URL ヘルパーを `entities/image/` に抽出し、FSD の Entities レイヤーを確立する。

## 実装方針

### 移動対象

`features/gallery/api.ts` から以下を `entities/image/` に抽出する:

| 現在の場所 | 移動先 | 種別 |
|-----------|--------|------|
| `Image` interface | `entities/image/model/types.ts` | 型定義 |
| `UpdateImageInput` interface | `entities/image/model/types.ts` | 型定義 |
| `PaginatedResult<T>` interface | `entities/image/model/types.ts` | 汎用型 |
| `PaginationOptions` interface | `entities/image/model/types.ts` | 汎用型 |
| `fetchImages()` | `entities/image/api/image.ts` | API |
| `fetchImagesPaginated()` | `entities/image/api/image.ts` | API |
| `fetchImage()` | `entities/image/api/image.ts` | API |
| `deleteImage()` | `entities/image/api/image.ts` | API |
| `updateImage()` | `entities/image/api/image.ts` | API |
| `getImageUrl()` | `entities/image/api/image.ts` | URL ヘルパー |
| `getThumbnailUrl()` | `entities/image/api/image.ts` | URL ヘルパー |

### gallery/api.ts に残すもの

以下は Image エンティティの基本操作ではなく、機能固有のロジックなので `features/gallery/api.ts` に残す:

- Image Attribute API (`fetchImageAttributes`, `createImageAttribute`, `updateImageAttribute`, `deleteImageAttribute`)
- Attribute Suggestion API (`fetchSuggestedAttributes` 等)
- Generate Description API (`generateDescriptionJob`, `getJobStatus`)
- Similar Images API (`fetchSimilarImages`)
- Search Suggestions API (`fetchSearchSuggestions` 等)
- Search History API (`saveSearchHistory`, `fetchSearchHistory` 等)

### ディレクトリ構成

```
src/entities/
└── image/
    ├── api/
    │   └── image.ts          # CRUD + URL ヘルパー
    ├── model/
    │   └── types.ts          # Image, UpdateImageInput, PaginatedResult, PaginationOptions
    ├── index.ts              # Public API
    └── README.md             # (任意) スライス説明
```

### import パスの更新対象

**外部フィーチャーからの参照（entities に変更）:**

- `features/recommendations/components/RecommendationSection.tsx`
  - `@/features/gallery` → `@/entities/image` (`getThumbnailUrl`)

**gallery 内部からの参照（gallery/api.ts → entities/image に変更）:**

- `features/gallery/pages/GalleryPage.tsx` — `fetchImagesPaginated`, `getThumbnailUrl`
- `features/gallery/pages/ImageDetailPage.tsx` — `deleteImage`, `fetchImage`, `getImageUrl`
- `features/gallery/components/ImageCarousel.tsx` — `getImageUrl`, `getThumbnailUrl`, `Image` 型
- `features/gallery/components/ImageGallery.tsx` — `fetchImages`
- `features/gallery/components/ImageGalleryView.tsx` — `getThumbnailUrl`, `Image` 型
- `features/gallery/components/ImageDescriptionSection.tsx` — `updateImage`
- `features/gallery/components/SimilarImagesSectionView.tsx` — `getThumbnailUrl`

**gallery/index.ts の更新:**

- `Image` 型と `fetchImages`, `getImageUrl`, `getThumbnailUrl` の export 元を entities に変更

**テストファイルの更新:**

- `tests/features/gallery/api.test.ts` — Image 基本 API テストを `tests/entities/image/` に移動
- `tests/features/gallery/components/*.test.tsx` — import パスを entities に変更

## 完了条件

- [x] `entities/image/` ディレクトリが作成され、型定義・API・Public API が配置されている
- [x] gallery/api.ts から Image 基本 CRUD・型定義が除去されている（re-export に変更）
- [x] gallery/api.ts に残った API が entities/image の型を利用している
- [x] recommendations の `getThumbnailUrl` が entities から import されている
- [x] gallery/index.ts から entities re-export を削除（外部消費者なし）
- [x] テストが entities 配下に移動・更新されている
- [x] `npm run typecheck` が通る
- [x] `npm run test` が通る（242 テスト全パス）
- [x] `npm run lint:eslint` が通る
- [x] `npm run lint:deps` が通る（125 modules, 366 deps, 違反なし）
- [x] `npm run build` が通る

## 作業ログ

- 2026-02-02: タスク開始
- 2026-02-02: 実装完了
  - `entities/image/` 作成: model/types.ts（4型定義）, api/image.ts（7関数）, index.ts（Public API）
  - gallery/api.ts 更新: Image 基本 CRUD/型を削除し entities から re-export
  - gallery 内部 import 更新: 7ファイルで `@/features/gallery/api` → `@/entities/image` に変更
  - 外部フィーチャー更新: recommendations の `getThumbnailUrl` を entities から import
  - gallery/index.ts 更新: entities re-export を削除（外部消費者がいないため不要と判断）
  - テスト分割: Image API テストを `tests/entities/image/api.test.ts` に移動、gallery テストから分離
  - テスト mock 更新: 6テストファイルで mock 対象を `@/entities/image` に変更
  - dependency-cruiser 更新: `entities-no-upper-deps`, `no-cross-entity-deps` ルール追加
  - 検証結果: typecheck OK, 242 tests 全パス, ESLint OK, dependency-cruiser 125 modules 違反なし, build OK

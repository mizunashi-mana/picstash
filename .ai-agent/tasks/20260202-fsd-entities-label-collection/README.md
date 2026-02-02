# T3: Entities レイヤーの抽出（Label, Collection）

## 目的・ゴール

`features/labels/` と `features/collections/` に混在している Label / Collection エンティティの型定義・CRUD API・UI コンポーネントを `entities/label/` と `entities/collection/` に抽出し、FSD の Entities レイヤーを拡充する。

## 実装方針

### Label エンティティ

#### 移動対象

| 現在の場所 | 移動先 | 種別 |
|-----------|--------|------|
| `Label` 型（@picstash/api） | `entities/label/model/types.ts` | 型 re-export |
| `CreateLabelInput` 型（@picstash/api） | `entities/label/model/types.ts` | 型 re-export |
| `UpdateLabelInput` 型（@picstash/api） | `entities/label/model/types.ts` | 型 re-export |
| `fetchLabels()` | `entities/label/api/label.ts` | API |
| `fetchLabel()` | `entities/label/api/label.ts` | API |
| `createLabel()` | `entities/label/api/label.ts` | API |
| `updateLabel()` | `entities/label/api/label.ts` | API |
| `deleteLabel()` | `entities/label/api/label.ts` | API |
| `LabelBadge` | `entities/label/ui/LabelBadge.tsx` | UI |
| `LabelBadge.stories.tsx` | `entities/label/ui/LabelBadge.stories.tsx` | Storybook |
| `LabelForm` | `entities/label/ui/LabelForm.tsx` | UI |
| `LabelForm.stories.tsx` | `entities/label/ui/LabelForm.stories.tsx` | Storybook |
| `LabelList` | `entities/label/ui/LabelList.tsx` | UI |
| `LabelList.stories.tsx` | `entities/label/ui/LabelList.stories.tsx` | Storybook |

**Note**: Label の型は `@picstash/api` で定義済みなので、`entities/label/model/types.ts` は re-export のみ。

#### features/labels/ に残すもの

- `pages/LabelsPage.tsx` — ページコンポーネント（T6/T7 で Pages レイヤーに移動予定）
- `features/labels/index.ts` — LabelsPage の export（+ entities re-export）

### Collection エンティティ

#### 移動対象

| 現在の場所 | 移動先 | 種別 |
|-----------|--------|------|
| `Collection` interface | `entities/collection/model/types.ts` | 型定義 |
| `CollectionWithCount` interface | `entities/collection/model/types.ts` | 型定義 |
| `CollectionImage` interface | `entities/collection/model/types.ts` | 型定義 |
| `CollectionWithImages` interface | `entities/collection/model/types.ts` | 型定義 |
| `CreateCollectionInput` interface | `entities/collection/model/types.ts` | 型定義 |
| `UpdateCollectionInput` interface | `entities/collection/model/types.ts` | 型定義 |
| `AddImageInput` interface | `entities/collection/model/types.ts` | 型定義 |
| `UpdateOrderInput` interface | `entities/collection/model/types.ts` | 型定義 |
| `fetchCollections()` | `entities/collection/api/collection.ts` | API |
| `fetchCollection()` | `entities/collection/api/collection.ts` | API |
| `createCollection()` | `entities/collection/api/collection.ts` | API |
| `updateCollection()` | `entities/collection/api/collection.ts` | API |
| `deleteCollection()` | `entities/collection/api/collection.ts` | API |
| `addImageToCollection()` | `entities/collection/api/collection.ts` | API |
| `removeImageFromCollection()` | `entities/collection/api/collection.ts` | API |
| `updateImageOrder()` | `entities/collection/api/collection.ts` | API |
| `fetchImageCollections()` | `entities/collection/api/collection.ts` | API |

**判断**: `addImageToCollection`, `removeImageFromCollection`, `updateImageOrder`, `fetchImageCollections` はコレクションの画像管理 API であり、Collection エンティティの基本操作として entities に含める。これらは Collection の API エンドポイントを直接操作するもので、機能固有のビジネスロジックは含まない。

#### features/collections/ に残すもの

- `pages/CollectionsPage.tsx` — ページコンポーネント
- `pages/CollectionDetailPage.tsx` — ページコンポーネント
- `pages/CollectionViewerPage.tsx` — ページコンポーネント
- `features/collections/index.ts` — ページ export（+ entities re-export）

**Note**: collections/components/ は空ディレクトリなので削除対象。

### ディレクトリ構成

```
src/entities/
├── image/                    # (T2 で作成済み)
├── label/
│   ├── api/
│   │   └── label.ts          # CRUD API（5関数）
│   ├── model/
│   │   └── types.ts          # Label, CreateLabelInput, UpdateLabelInput（@picstash/api re-export）
│   ├── ui/
│   │   ├── LabelBadge.tsx
│   │   ├── LabelBadge.stories.tsx
│   │   ├── LabelForm.tsx
│   │   ├── LabelForm.stories.tsx
│   │   ├── LabelList.tsx
│   │   └── LabelList.stories.tsx
│   └── index.ts              # Public API
└── collection/
    ├── api/
    │   └── collection.ts     # CRUD + 画像管理 API（9関数）
    ├── model/
    │   └── types.ts          # 8 型定義
    └── index.ts              # Public API
```

### import パスの更新対象

**Label — クロスフィーチャー参照の変更:**

- `features/gallery/components/ImageAttributeSection.tsx`
  - `@/features/labels` → `@/entities/label` (`fetchLabels`)

**Label — features/labels 内部の変更:**

- `features/labels/pages/LabelsPage.tsx`
  - `@/features/labels/api` → `@/entities/label` (CRUD API)
  - `@/features/labels/components` → `@/entities/label` (LabelForm, LabelList)
- `features/labels/index.ts`
  - `./api` の re-export を `@/entities/label` に変更
  - `./components` の re-export を `@/entities/label` に変更

**Collection — クロスフィーチャー参照の変更:**

- `features/gallery/components/ImageCollectionsSection.tsx`
  - `@/features/collections` → `@/entities/collection` (fetchCollections, fetchImageCollections, addImageToCollection, removeImageFromCollection)

**Collection — features/collections 内部の変更:**

- `features/collections/pages/CollectionsPage.tsx`
  - `@/features/collections/api` → `@/entities/collection`
- `features/collections/pages/CollectionDetailPage.tsx`
  - `@/features/collections/api` → `@/entities/collection`
- `features/collections/pages/CollectionViewerPage.tsx`
  - `@/features/collections/api` → `@/entities/collection`
- `features/collections/index.ts`
  - `./api` の re-export を `@/entities/collection` に変更

**Label UI コンポーネント内部 import:**

- `entities/label/ui/LabelList.tsx`
  - `./LabelBadge` → 同ディレクトリなのでそのまま
  - `./LabelForm` → 同ディレクトリなのでそのまま

**Storybook:**

- 3 story ファイルの title を `Features/Labels/` → `Entities/Label/` に変更

**テストファイルの更新:**

- `tests/features/labels/api.test.ts` → `tests/entities/label/api.test.ts` に移動
  - import を `@/features/labels/api` → `@/entities/label` に変更
- `tests/features/collections/api.test.ts` → `tests/entities/collection/api.test.ts` に移動
  - import を `@/features/collections/api` → `@/entities/collection` に変更
- `tests/features/gallery/components/ImageCollectionsSection.test.tsx`
  - mock 対象を `@/features/collections` → `@/entities/collection` に変更

## 完了条件

- [x] `entities/label/` が作成され、型 re-export・API・UI・Public API が配置されている
- [x] `entities/collection/` が作成され、型定義・API・Public API が配置されている
- [x] features/labels/api.ts が entities からの re-export に変更されている
- [x] features/collections/api.ts が entities からの re-export に変更されている
- [x] gallery の ImageAttributeSection が entities/label から import している
- [x] gallery の ImageCollectionsSection が entities/collection から import している
- [x] Label UI コンポーネント (LabelBadge, LabelForm, LabelList) が entities に移動している
- [x] Storybook story ファイルが entities に移動し、title が更新されている
- [x] テストが entities 配下に移動・更新されている
- [x] `npm run typecheck` が通る
- [x] `npm run test` が通る（242 テスト全パス）
- [x] `npm run lint:eslint` が通る
- [x] `npm run lint:deps` が通る（130 modules, 372 deps, 違反なし）
- [x] `npm run build` が通る

## 作業ログ

- 2026-02-02: タスク開始
- 2026-02-02: 実装完了
  - `entities/label/` 作成: model/types.ts（@picstash/api re-export）, api/label.ts（5関数）, ui/（LabelBadge, LabelForm, LabelList + 3 stories）, index.ts
  - `entities/collection/` 作成: model/types.ts（8型定義）, api/collection.ts（9関数）, index.ts
  - features/labels/api.ts 更新: entities からの re-export に変更
  - features/labels/components/ 削除: UI コンポーネントを entities に移動
  - features/labels/index.ts 更新: components を entities からの re-export に変更
  - features/collections/api.ts 更新: entities からの re-export に変更
  - features/collections/components/ 削除: 空ディレクトリ
  - gallery/ImageAttributeSection.tsx: fetchLabels を `@/entities/label` から import
  - gallery/ImageCollectionsSection.tsx: collection API を `@/entities/collection` から import
  - collection ページ3ファイル: `@/features/collections/api` → `@/entities/collection` に変更
  - labels ページ: `@/features/labels/api` + `@/features/labels/components` → `@/entities/label` に変更
  - テスト分割: labels/collections API テストを entities 配下に移動、gallery テストの mock 更新
  - Storybook story title: `Features/Labels/` → `Entities/Label/` に変更
  - 検証結果: typecheck OK, 242 tests 全パス, ESLint OK, dependency-cruiser 130 modules 違反なし, build OK

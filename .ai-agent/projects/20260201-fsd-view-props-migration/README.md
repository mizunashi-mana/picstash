# FSD + View/State 分離パターンへの移行

## 目標

web-client パッケージのフロントエンドアーキテクチャを Feature-Sliced Design (FSD) に移行し、複雑なコンポーネントに View Props パターンを適用する。

### 完了条件

- web-client の `src/` が FSD のレイヤー構造（app / pages / widgets / features / entities / shared）に移行されている
- レイヤー間の依存方向が ESLint ルールで強制されている
- 複雑なページコンポーネント（GalleryPage, ImageDetailPage 等）に View Props パターンが適用されている
- 全テスト・型チェック・lint が通る
- Storybook が動作する

## スコープ

### やること

- web-client の FSD レイヤー構造への移行
- Entities レイヤーの抽出（Image, Label, Collection）
- Pages レイヤーの分離
- Widgets レイヤーの導入
- App レイヤーの整理
- Shared レイヤーの再構成
- 依存関係ルールの ESLint 自動化
- 複雑なコンポーネントへの View Props パターン適用
- パス alias の更新

### やらないこと

- desktop-app の renderer 移行（web-client 完了後に別プロジェクトで対応）
- desktop-app と web-client のコード共有化（別プロジェクト）
- 機能追加・変更（純粋なリファクタリングのみ）
- 単純なコンポーネント（LabelBadge, ImageDropzone 等）への View Props パターン適用

## 現状分析

### 現在のディレクトリ構造

```
packages/web-client/src/
├── App.tsx
├── main.tsx
├── api/
│   └── client.ts
├── routes/
│   └── index.tsx
├── shared/
│   ├── components/   (AppLayout)
│   ├── hooks/         (useViewMode)
│   └── helpers/       (url builder)
└── features/          (15 モジュール)
    ├── gallery/       (api.ts, components/, pages/)
    ├── labels/        (api.ts, components/, pages/)
    ├── upload/        (api.ts, components/)
    ├── collections/   (api.ts, components/, pages/)
    ├── duplicates/    (api.ts, components/, pages/)
    ├── stats/         (api.ts, components/, pages/)
    ├── home/          (pages/)
    ├── import/        (components/, pages/)
    ├── archive-import/(api.ts, components/)
    ├── url-crawl/     (api.ts, components/)
    ├── recommendations/(api.ts, components/)
    ├── jobs/          (api.ts, context.tsx, components/)
    └── view-history/  (api.ts, hooks/)
```

### 現在のクロスフィーチャー依存関係

```
gallery ← recommendations (getThumbnailUrl)
gallery ← view-history を経由 → recommendations (recordClick)
labels  ← gallery/ImageAttributeSection (fetchLabels)
collections ← gallery/ImageCollectionsSection (CRUD)
jobs    ← gallery/ImageDescriptionSection (useJobs)
upload  ← home, import
archive-import ← import
url-crawl ← import
recommendations ← home, view-history
view-history ← gallery/ImageDetailPage
```

### FSD 移行後の目標構造

```
packages/web-client/src/
├── app/                          # App レイヤー
│   ├── providers/
│   │   └── index.tsx             # QueryClient, Mantine, Router, Jobs
│   ├── routes/
│   │   └── index.tsx
│   ├── App.tsx
│   └── main.tsx
│
├── pages/                        # Pages レイヤー
│   ├── home/
│   │   ├── ui/
│   │   │   └── HomePage.tsx
│   │   └── index.ts
│   ├── gallery/
│   │   ├── ui/
│   │   │   ├── GalleryPage.tsx
│   │   │   ├── GalleryPageView.tsx        # View Props パターン
│   │   │   └── useGalleryPageViewProps.ts
│   │   └── index.ts
│   ├── image-detail/
│   │   ├── ui/
│   │   │   ├── ImageDetailPage.tsx
│   │   │   ├── ImageDetailPageView.tsx    # View Props パターン
│   │   │   └── useImageDetailViewProps.ts
│   │   └── index.ts
│   ├── labels/
│   │   ├── ui/
│   │   │   └── LabelsPage.tsx
│   │   └── index.ts
│   ├── collections/
│   │   ├── ui/
│   │   │   ├── CollectionsPage.tsx
│   │   │   ├── CollectionDetailPage.tsx
│   │   │   └── CollectionViewerPage.tsx
│   │   └── index.ts
│   ├── duplicates/
│   │   ├── ui/
│   │   │   └── DuplicatesPage.tsx
│   │   └── index.ts
│   ├── import/
│   │   ├── ui/
│   │   │   └── ImportPage.tsx
│   │   └── index.ts
│   └── stats/
│       ├── ui/
│       │   ├── StatsPage.tsx
│       │   ├── StatsPageView.tsx          # View Props パターン
│       │   └── useStatsPageViewProps.ts
│       └── index.ts
│
├── widgets/                      # Widgets レイヤー
│   ├── app-layout/
│   │   ├── ui/
│   │   │   └── AppLayout.tsx
│   │   └── index.ts
│   └── job-status/
│       ├── ui/
│       │   └── JobStatusButton.tsx
│       ├── model/
│       │   └── context.tsx       # JobsProvider, useJobs
│       └── index.ts
│
├── features/                     # Features レイヤー
│   ├── upload-image/
│   │   ├── ui/
│   │   │   ├── ImageDropzone.tsx
│   │   │   └── ImageDropzoneView.tsx
│   │   ├── api/
│   │   │   └── upload.ts
│   │   └── index.ts
│   ├── search-images/
│   │   ├── ui/
│   │   │   └── SearchBar.tsx
│   │   ├── api/
│   │   │   └── search.ts
│   │   └── index.ts
│   ├── import-archive/
│   │   ├── ui/
│   │   │   ├── ArchiveDropzone.tsx
│   │   │   └── ArchivePreviewGallery.tsx
│   │   ├── api/
│   │   │   └── archive.ts
│   │   └── index.ts
│   ├── import-url/
│   │   ├── ui/
│   │   │   ├── UrlInputForm.tsx
│   │   │   └── CrawlPreviewGallery.tsx
│   │   ├── api/
│   │   │   └── crawl.ts
│   │   └── index.ts
│   ├── manage-image-attributes/
│   │   ├── ui/
│   │   │   ├── ImageAttributeSection.tsx
│   │   │   └── ImageAttributeSectionView.tsx
│   │   ├── api/
│   │   │   └── attributes.ts
│   │   └── index.ts
│   ├── manage-image-description/
│   │   ├── ui/
│   │   │   ├── ImageDescriptionSection.tsx
│   │   │   └── ImageDescriptionSectionView.tsx
│   │   ├── api/
│   │   │   └── description.ts
│   │   └── index.ts
│   ├── manage-image-collections/
│   │   ├── ui/
│   │   │   └── ImageCollectionsSection.tsx
│   │   ├── api/
│   │   │   └── image-collections.ts
│   │   └── index.ts
│   ├── find-similar-images/
│   │   ├── ui/
│   │   │   ├── SimilarImagesSection.tsx
│   │   │   └── SimilarImagesSectionView.tsx
│   │   ├── api/
│   │   │   └── similar.ts
│   │   └── index.ts
│   ├── find-duplicates/
│   │   ├── ui/
│   │   │   └── DuplicateGroupCard.tsx
│   │   ├── api/
│   │   │   └── duplicates.ts
│   │   └── index.ts
│   ├── view-recommendations/
│   │   ├── ui/
│   │   │   └── RecommendationSection.tsx
│   │   ├── api/
│   │   │   └── recommendations.ts
│   │   └── index.ts
│   ├── track-view-history/
│   │   ├── api/
│   │   │   └── view-history.ts
│   │   ├── lib/
│   │   │   └── useViewHistory.ts
│   │   └── index.ts
│   └── view-stats/
│       ├── ui/
│       │   ├── StatsOverviewCards.tsx
│       │   ├── ViewTrendsChart.tsx
│       │   ├── RecommendationTrendsChart.tsx
│       │   └── PopularImagesList.tsx
│       └── index.ts
│
├── entities/                     # Entities レイヤー
│   ├── image/
│   │   ├── ui/
│   │   │   ├── ImageCard.tsx
│   │   │   ├── ImageGallery.tsx
│   │   │   └── ImageCarousel.tsx
│   │   ├── api/
│   │   │   └── image.ts          # fetchImages, fetchImage, deleteImage, updateImage, getImageUrl, getThumbnailUrl
│   │   ├── model/
│   │   │   └── types.ts          # Image, PaginatedResult, PaginationOptions
│   │   └── index.ts
│   ├── label/
│   │   ├── ui/
│   │   │   ├── LabelBadge.tsx
│   │   │   ├── LabelForm.tsx
│   │   │   └── LabelList.tsx
│   │   ├── api/
│   │   │   └── label.ts          # fetchLabels, fetchLabel, createLabel, updateLabel, deleteLabel
│   │   ├── model/
│   │   │   └── types.ts          # Label 型（@picstash/api から re-export）
│   │   └── index.ts
│   └── collection/
│       ├── ui/
│       │   └── CollectionCard.tsx
│       ├── api/
│       │   └── collection.ts     # CRUD
│       ├── model/
│       │   └── types.ts          # Collection, CollectionWithCount 等
│       └── index.ts
│
└── shared/                       # Shared レイヤー
    ├── ui/
    │   └── (汎用 UI コンポーネント)
    ├── api/
    │   └── client.ts             # apiClient
    ├── lib/
    │   └── url.ts                # buildUrl
    ├── hooks/
    │   └── use-view-mode.ts
    └── config/
```

## タスク分解

| ID | タスク | 依存 | 優先度 | 状態 |
|----|--------|------|--------|------|
| T1 | Shared レイヤーと App レイヤーの整理 | - | 高 | 未着手 |
| T2 | Entities レイヤーの抽出（Image） | T1 | 高 | 未着手 |
| T3 | Entities レイヤーの抽出（Label, Collection） | T1 | 高 | 未着手 |
| T4 | Features レイヤーの再構成 | T2, T3 | 高 | 未着手 |
| T5 | Widgets レイヤーの導入 | T1 | 中 | 未着手 |
| T6 | Pages レイヤーの分離 + View Props 適用（Gallery, ImageDetail） | T4 | 高 | 未着手 |
| T7 | Pages レイヤーの分離 + View Props 適用（その他ページ） | T4, T5 | 中 | 未着手 |
| T8 | 依存関係ルールの ESLint 自動化 | T6, T7 | 高 | 未着手 |
| T9 | dependency-cruiser ルールの FSD 対応 | T6, T7 | 高 | 未着手 |

### 依存関係図

```
T1 (Shared + App)
├── T2 (Entities: Image)
│   └──┐
├── T3 (Entities: Label, Collection)
│   └──┤
│      T4 (Features 再構成)
│      ├── T6 (Pages: Gallery + ImageDetail + View Props)
│      │   └──┐
├── T5 (Widgets)                                         │
│   └── T7 (Pages: その他 + View Props)                  │
│       └──┤                                             │
│          T8 (ESLint 依存関係ルール)  ←─────────────────┤
│          T9 (dependency-cruiser ルール) ←──────────────┘
```

### 各タスクの詳細

#### T1: Shared レイヤーと App レイヤーの整理

- **概要**: 現在の `api/client.ts`, `shared/`, `main.tsx`, `App.tsx`, `routes/` を FSD の Shared / App レイヤーに再配置する
- **作業内容**:
  - `src/app/` ディレクトリを作成し、`main.tsx`, `App.tsx`, `routes/` を移動
  - `src/app/providers/` にプロバイダー設定（QueryClient, Mantine, Router）を抽出
  - `src/shared/api/client.ts` に API クライアントを移動
  - `src/shared/lib/url.ts` にヘルパーを移動
  - `src/shared/hooks/use-view-mode.ts` にフックを移動
  - パス alias `@/app`, `@/shared` 等の設定
  - tsconfig.json, vite.config.ts のパス alias 更新
- **完了条件**: App / Shared の2レイヤーが整理され、全テスト・型チェック・lint が通る

#### T2: Entities レイヤーの抽出（Image）

- **概要**: `features/gallery/api.ts` から Image エンティティの基本 CRUD・型定義・UI コンポーネントを `entities/image/` に抽出する
- **作業内容**:
  - `entities/image/model/types.ts` — Image, PaginatedResult, PaginationOptions 型を移動
  - `entities/image/api/image.ts` — fetchImages, fetchImage, deleteImage, updateImage, getImageUrl, getThumbnailUrl を移動
  - `entities/image/ui/` — ImageCard（gallery のグリッドアイテム）を移動（ImageGallery, ImageCarousel は gallery の表示ロジックを含むため Features 側に残すか判断）
  - `entities/image/index.ts` — Public API 定義
  - 既存の `features/gallery/api.ts` から移動分を削除し、entities からの re-import に変更
  - `features/recommendations` の `getThumbnailUrl` インポートを entities に変更
- **完了条件**: Image の基本 CRUD・型が entities に抽出され、gallery 等から正しく参照されている
- **依存理由**: T1 で Shared が整理されていることで、entities → shared の依存が明確になる

#### T3: Entities レイヤーの抽出（Label, Collection）

- **概要**: Label と Collection のエンティティを `entities/` に抽出する
- **作業内容**:
  - `entities/label/` — Label 型（@picstash/api から）、CRUD API、LabelBadge / LabelForm / LabelList コンポーネント
  - `entities/collection/` — Collection 型、CRUD API、CollectionCard 等の基本 UI
  - 既存の `features/labels/api.ts`, `features/collections/api.ts` から基本 CRUD を移動
  - クロスフィーチャー参照（gallery → labels, gallery → collections）を entities 参照に変更
- **完了条件**: Label / Collection の基本操作が entities に抽出され、features から正しく参照されている
- **依存理由**: T1 と同じ

#### T4: Features レイヤーの再構成

- **概要**: 既存の `features/` を FSD の Features レイヤーとして再構成する。機能単位（ユーザーアクション）でスライスを分割し、セグメント（ui / api / model / lib）を導入する
- **作業内容**:
  - `features/gallery/` からページコンポーネントを除去し、Features に残す機能を整理
    - `search-images/` — SearchBar, search API
    - `manage-image-attributes/` — ImageAttributeSection
    - `manage-image-description/` — ImageDescriptionSection
    - `find-similar-images/` — SimilarImagesSection
    - `manage-image-collections/` — ImageCollectionsSection
  - `features/upload/` → `features/upload-image/` に rename、セグメント分割
  - `features/archive-import/` → `features/import-archive/` に rename、セグメント分割
  - `features/url-crawl/` → `features/import-url/` に rename、セグメント分割
  - `features/duplicates/` → `features/find-duplicates/`、セグメント分割
  - `features/recommendations/` → `features/view-recommendations/`、セグメント分割
  - `features/view-history/` → `features/track-view-history/`、セグメント分割
  - `features/stats/` の UI コンポーネントを `features/view-stats/` に移動
  - 各スライスに `index.ts`（Public API）を定義
  - features → entities のみインポートするよう依存方向を整理
- **完了条件**: Features レイヤーが機能単位のスライスに分割され、セグメント構造を持ち、entities / shared のみに依存している
- **依存理由**: T2, T3 で entities が抽出されていないと features の依存先が定まらない

#### T5: Widgets レイヤーの導入

- **概要**: AppLayout や JobStatusButton など、自己完結した大きな UI ブロックを Widgets レイヤーに分離する
- **作業内容**:
  - `widgets/app-layout/` — AppLayout コンポーネント（ナビゲーション、サイドバー含む）
  - `widgets/job-status/` — JobStatusButton + JobsProvider/useJobs（コンテキスト）
  - `App.tsx` のインポートを widgets からに変更
- **完了条件**: Widgets レイヤーが存在し、App レイヤーから正しく参照されている
- **依存理由**: T1 で Shared / App が整理されている必要がある

#### T6: Pages レイヤーの分離 + View Props 適用（Gallery, ImageDetail）

- **概要**: Gallery 系のページコンポーネントを Pages レイヤーに分離し、同時に View Props パターンを適用する。最も複雑なページを先行して移行する
- **作業内容**:
  - `pages/gallery/` — GalleryPage を分離
    - `useGalleryPageViewProps.ts` — State（検索クエリ、ビューモード、ページネーション）/ Handler（検索実行、ビューモード切替、ページ遷移）/ Selector（表示用データ変換）
    - `GalleryPageView.tsx` — ViewProps のみを受け取る純粋な描画コンポーネント
    - `GalleryPage.tsx` — useViewProps + View の統合
  - `pages/image-detail/` — ImageDetailPage を分離
    - `useImageDetailViewProps.ts` — State（画像データ、編集モード、タブ状態）/ Handler / Selector
    - `ImageDetailPageView.tsx`
    - `ImageDetailPage.tsx`
  - routes の参照先を pages に変更
- **完了条件**: Gallery / ImageDetail ページが Pages レイヤーに存在し、View Props パターンが適用されている
- **依存理由**: T4 で features が整理されていないと、ページから参照する features の Public API が定まらない

#### T7: Pages レイヤーの分離 + View Props 適用（その他ページ）

- **概要**: 残りのページコンポーネントを Pages レイヤーに分離する。複雑なページには View Props パターンも適用する
- **作業内容**:
  - `pages/home/` — HomePage（単純なので View Props 不要）
  - `pages/labels/` — LabelsPage
  - `pages/collections/` — CollectionsPage, CollectionDetailPage, CollectionViewerPage
  - `pages/duplicates/` — DuplicatesPage
  - `pages/import/` — ImportPage
  - `pages/stats/` — StatsPage（View Props 適用: 期間選択、チャート切替の状態管理）
  - View Props 適用対象: StatsPage, CollectionDetailPage（状態が複雑な場合）
- **完了条件**: 全ページが Pages レイヤーに存在し、routes から正しく参照されている
- **依存理由**: T4 で features、T5 で widgets が整理されている必要がある

#### T8: 依存関係ルールの ESLint 自動化

- **概要**: FSD のレイヤー間依存方向を ESLint で自動的に強制する
- **作業内容**:
  - `eslint-plugin-boundaries` または `eslint-plugin-import` のカスタムルールを導入
  - レイヤー間ルール定義: shared ← entities ← features ← widgets ← pages ← app
  - 同一レイヤー内スライス間のインポート禁止ルール
  - `@picstash/eslint-config` にルールを追加
  - 既存の違反がないことを確認
- **完了条件**: ESLint で依存方向違反が検出される。CI でも実行される
- **依存理由**: T6, T7 で全レイヤーが移行完了している必要がある

#### T9: dependency-cruiser ルールの FSD 対応

- **概要**: 既存の `.dependency-cruiser.mjs` を FSD レイヤー構造に合わせて全面的に書き直す
- **作業内容**:
  - 既存ルールの置き換え:
    - `no-cross-feature-deps` → FSD レイヤー間の依存方向ルール + 同一レイヤー内スライス間禁止に拡張
    - `shared-no-deps` → 全レイヤーの依存方向ルールに拡張
    - `not-reachable-from-main` → エントリーポイントのパスを `src/app/main.tsx` に更新
  - 新規追加ルール:
    - `entities-no-upper-deps`: entities → features / widgets / pages / app へのインポート禁止
    - `features-no-upper-deps`: features → widgets / pages / app へのインポート禁止
    - `widgets-no-upper-deps`: widgets → pages / app へのインポート禁止
    - `pages-no-upper-deps`: pages → app へのインポート禁止
    - `no-cross-slice-deps`: 同一レイヤー内のスライス間の内部実装への直接インポート禁止（index.ts 経由のみ許可）
  - `no-circular` は維持
  - `npm run lint:deps` で全ルール通過を確認
- **完了条件**: FSD のレイヤー依存方向が dependency-cruiser で強制され、`npm run lint:deps` が通る
- **依存理由**: T6, T7 で全レイヤーの移行が完了していないとルールが正しく検証できない
- **参考**: 現在の設定は `packages/web-client/.dependency-cruiser.mjs` にある（`no-cross-feature-deps`, `shared-no-deps`, `not-reachable-from-main` の3ルール + `no-circular`）

## 進捗

- 2026-02-01: プロジェクト開始、計画策定

## メモ

- 調査レポート: [.ai-agent/surveys/20260201-react-frontend-architecture/README.md](../surveys/20260201-react-frontend-architecture/README.md)
- desktop-app の renderer は web-client と 85-90% のコードが重複しているが、本プロジェクトでは web-client のみ対象とする。desktop-app は別プロジェクトで対応する
- View Props パターンの適用基準: 「状態遷移が複数あり、ハンドラが3つ以上」のコンポーネント
- FSD の完全準拠は目指さず、プロジェクト規模に合った粒度で適用する
- 各タスクは機能的に動作する状態を維持しながら進める（ビッグバンリファクタリングは避ける）

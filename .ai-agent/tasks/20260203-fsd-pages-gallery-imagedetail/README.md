# T6: Pages レイヤーの分離 + View Props 適用（Gallery, ImageDetail）

## 目的・ゴール

Gallery 系のページコンポーネント（GalleryPage, ImageDetailPage）を `features/gallery/pages/` から FSD の `pages/` レイヤーに分離し、同時に View Props パターンを適用する。状態管理と描画を分離することでテスタビリティと保守性を向上させる。

## 実装方針

### 全体方針

- GalleryPage と ImageDetailPage を `features/gallery/pages/` から `pages/gallery/` と `pages/image-detail/` に移動
- 各ページに View Props パターンを適用（Container + View 分離）
- `features/gallery/` からページ関連コードを削除し、`components/` 内の ImageCarousel と ImageGallery のみ残す
- routes の参照先を `@/pages/*` に変更
- dependency-cruiser に pages レイヤーのルールを追加

### ディレクトリ構成

```
src/pages/
├── gallery/
│   ├── ui/
│   │   ├── GalleryPage.tsx              # Container: useGalleryPageState + View
│   │   └── GalleryPageView.tsx          # View: Props のみを受け取る純粋な描画
│   └── index.ts                         # Public API: GalleryPage
└── image-detail/
    ├── ui/
    │   ├── ImageDetailPage.tsx           # Container: hooks + View
    │   └── ImageDetailPageView.tsx       # View: Props のみを受け取る純粋な描画
    ├── lib/
    │   └── format.ts                    # formatFileSize, formatDate ユーティリティ
    └── index.ts                         # Public API: ImageDetailPage
```

### View Props パターンの適用

#### GalleryPage

**Container (GalleryPage.tsx)**:
- URL search params 管理
- useViewMode フック
- useInfiniteQuery で画像データ取得
- useVirtualizer で仮想スクロール
- useMutation で検索履歴の保存・削除
- レスポンシブグリッド計算（containerWidth, columns, cardWidth, rowHeight）
- ハンドラ: handleSearchChange, handleDeleteAllHistory, handleCarouselIndexChange

**View (GalleryPageView.tsx)**:
- ViewProps インターフェースで全ての状態・ハンドラを受け取る
- ローディング/エラー/空状態/グリッド/カルーセルの描画のみ
- 内部状態を持たない純粋なコンポーネント

#### ImageDetailPage

**Container (ImageDetailPage.tsx)**:
- useParams, useSearchParams, useNavigate
- useQuery で画像取得
- useMutation で画像削除
- useViewHistory で閲覧履歴記録
- useDisclosure でモーダル状態管理

**View (ImageDetailPageView.tsx)**:
- ViewProps インターフェースで全ての状態・ハンドラを受け取る
- 画像表示、各 Section コンポーネントの配置、ファイル情報表示
- 削除確認モーダルの描画

**lib/format.ts**:
- formatFileSize, formatDate を独立ユーティリティとして抽出

### import パスの更新対象

- `app/routes/index.tsx`:
  - `@/features/gallery` → `@/pages/gallery` (GalleryPage)
  - `@/features/gallery/pages/ImageDetailPage` → `@/pages/image-detail` (ImageDetailPage)
- `features/gallery/index.ts`: GalleryPage の export を削除（ImageGallery のみ残す）

### dependency-cruiser ルール追加

- `pages-no-upper-deps`: pages → app への依存禁止
- `no-cross-page-deps`: pages スライス間の内部実装への直接依存禁止
- 既存ルールの更新: shared, entities, features, widgets が pages に依存しないよう追加

### ImageCarousel の扱い

ImageCarousel は `features/gallery/components/` に残す。これはギャラリー機能のUI部品であり、ページではない。GalleryPage（pages レイヤー）からは `@/features/gallery` の公開 API 経由でインポートする。

## 完了条件

- [x] `pages/gallery/` が作成され、View Props パターンが適用されている
- [x] `pages/image-detail/` が作成され、View Props パターンが適用されている
- [x] `features/gallery/` から GalleryPage が削除されている
- [x] `features/gallery/` に ImageGallery と ImageCarousel が残っている
- [x] `app/routes/index.tsx` が pages からインポートしている
- [x] dependency-cruiser に pages レイヤーのルールが追加されている
- [x] `npm run typecheck` が通る
- [x] `npm run test` が通る
- [x] `npm run lint:eslint` が通る
- [x] `npm run lint:deps` が通る
- [x] `npm run build` が通る

## 作業ログ

- 2026-02-03: タスク開始
- 2026-02-03: タスク完了 — 全チェック通過

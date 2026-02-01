# React フロントエンドアーキテクチャ調査

## 調査の問い

- Feature-Sliced Design (FSD) と View Props パターンはそれぞれどのようなアーキテクチャ手法か
- Picstash の現在のフロントエンド構成にどの程度適用可能か
- 両手法を組み合わせることで保守性・拡張性を向上できるか

## 背景

Picstash の web-client は現在 13 のフィーチャーモジュールを持ち、Phase 1〜8 のロードマップに沿って機能拡充が続く。コードベースの成長に伴い、以下の課題が顕在化し得る:

- フィーチャー間の暗黙的な依存関係の増加
- コンポーネント内でのビューロジックと状態管理の混在
- 新規メンバーがコードベースを理解するまでのコスト

これらに対応するため、ディレクトリ構造レベルのアーキテクチャ（FSD）とコンポーネント設計レベルのパターン（View Props）を調査する。

## 調査方法

- Feature-Sliced Design 公式サイト（https://feature-sliced.design/）のドキュメント・チュートリアル・移行ガイドを精査
- ブログ記事「React の View / State 分離パターン」（https://mizunashi-mana.github.io/blog/posts/2026/02/react-view-props-pattern/）を精査
- Picstash web-client の現在のソースコード構造を調査

## 調査結果

### 1. Feature-Sliced Design (FSD)

#### 概要

FSD はフロントエンドプロジェクト向けのアーキテクチャ方法論。技術的な関心事ではなくビジネスドメインに基づいてコードを構造化する。React エコシステムで広く採用が進んでいる。

#### コア概念: レイヤー・スライス・セグメント

**レイヤー**（上位ほどアプリ固有、下位ほど汎用）:

| レイヤー | 役割 | 例 |
|---------|------|-----|
| App | エントリーポイント、プロバイダー、ルーティング設定 | ルーター設定、グローバルストア |
| ~~Processes~~ | ~~複雑なページ間シナリオ~~ | 非推奨 |
| Pages | ルーティングの各画面 | HomePage, GalleryPage |
| Widgets | 自己完結した大きな UI ブロック | ヘッダー、サイドバー |
| Features | ユーザーが実行する機能単位 | 画像アップロード、検索 |
| Entities | ビジネスエンティティの表現 | Image, Label, Collection |
| Shared | プロジェクト非依存の再利用コード | UI キット、API クライアント、ユーティリティ |

**依存関係ルール**: モジュールは**厳密に下位レイヤーからのみ**インポート可能。同一レイヤー内のスライス間のインポートも禁止。

**スライス**: レイヤー内でビジネスドメインに基づいて分割した単位（例: `entities/image/`, `features/upload/`）。

**セグメント**: スライス内を技術的な役割で分割（`ui/`, `api/`, `model/`, `lib/`, `config/`）。

**Public API**: 各スライスは `index.ts` で公開 API を定義し、外部はそこを通してのみアクセスする。

#### ディレクトリ構造の例

```
src/
├── app/                    # App レイヤー
│   ├── providers/          # QueryClient, Mantine, Router など
│   ├── routes/             # ルーティング設定
│   └── index.tsx           # エントリーポイント
├── pages/                  # Pages レイヤー
│   ├── home/
│   │   ├── ui/
│   │   └── index.ts
│   ├── gallery/
│   │   ├── ui/
│   │   ├── api/
│   │   └── index.ts
│   └── ...
├── widgets/                # Widgets レイヤー
│   ├── app-layout/
│   │   ├── ui/
│   │   └── index.ts
│   └── job-status/
│       ├── ui/
│       └── index.ts
├── features/               # Features レイヤー
│   ├── upload-image/
│   │   ├── ui/
│   │   ├── api/
│   │   ├── model/
│   │   └── index.ts
│   ├── search-images/
│   │   ├── ui/
│   │   ├── api/
│   │   └── index.ts
│   └── ...
├── entities/               # Entities レイヤー
│   ├── image/
│   │   ├── ui/             # ImageCard, ImageThumbnail
│   │   ├── api/            # fetchImage, fetchImages
│   │   ├── model/          # Image 型定義
│   │   └── index.ts
│   ├── label/
│   ├── collection/
│   └── ...
└── shared/                 # Shared レイヤー
    ├── ui/                 # 汎用 UI コンポーネント
    ├── api/                # apiClient
    ├── lib/                # ユーティリティ
    └── config/             # 設定
```

#### メリット

- **ビジネスドメインの可視化**: ディレクトリ構造がそのまま機能一覧になる
- **変更影響の局所化**: 依存関係ルールにより、変更が予期しない場所に波及しにくい
- **スケーラビリティ**: チーム拡大時にも構造が破綻しにくい
- **段階的採用**: 既存プロジェクトから漸進的に移行可能

#### デメリット・注意点

- **学習コスト**: レイヤー・スライス・セグメントの概念と分類判断が必要
- **初期の過剰設計リスク**: 小規模プロジェクトでは構造が重く感じる可能性
- **分類の曖昧さ**: Widget と Feature の境界、Entity と Feature の境界が判断しにくいケースがある
- **ボイラープレート**: 各スライスに `index.ts`（Public API）が必要

---

### 2. View Props パターン

#### 概要

React コンポーネントの内部を4つの責務に分離し、`useViewProps` カスタムフックで統合するデザインパターン。Flux/Redux 以来の「ビューと状態の分離」「単方向データフロー」の思想を、React Hooks 時代に再解釈したもの。

#### 4つのパーツ

| パーツ | 責務 | 実装手段 | 例 |
|--------|------|----------|-----|
| State | 状態の保存形式と遷移の定義 | `useReducer` | Todo 配列、フィルタモード |
| Handler | イベント処理とアクション発行 | `useCallback` | addTodo, toggleTodo, setFilter |
| Selector | 状態からビュー用データを計算 | `useMemo` | filteredTodos, activeCount |
| View | JSX による描画 | 関数コンポーネント | TodoList, FilterButtons |

#### コード構造の例

```typescript
// 1. State: 最小限の正規化された状態
type State = {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
};

type Action =
  | { type: 'ADD_TODO'; text: string }
  | { type: 'TOGGLE_TODO'; id: string }
  | { type: 'SET_FILTER'; filter: State['filter'] };

function reducer(state: State, action: Action): State {
  // 状態遷移ロジック
}

// 2. ViewProps 型: ビューが必要とするすべてのプロパティ
type TodoViewProps = {
  filteredTodos: Todo[];
  activeCount: number;
  currentFilter: State['filter'];
  onAddTodo: (text: string) => void;
  onToggleTodo: (id: string) => void;
  onSetFilter: (filter: State['filter']) => void;
};

// 3. useViewProps: State + Handler + Selector を統合
function useTodoViewProps(): TodoViewProps {
  // State
  const [state, dispatch] = useReducer(reducer, initialState);

  // Handler
  const onAddTodo = useCallback((text: string) => {
    dispatch({ type: 'ADD_TODO', text });
  }, []);
  // ...

  // Selector
  const filteredTodos = useMemo(() => {
    // state からビュー用データを計算
  }, [state.todos, state.filter]);

  return { filteredTodos, activeCount, currentFilter, onAddTodo, onToggleTodo, onSetFilter };
}

// 4. View: ViewProps のみを受け取って描画
function TodoView(props: TodoViewProps) {
  return <div>...</div>;
}

// 統合
function TodoApp() {
  const viewProps = useTodoViewProps();
  return <TodoView {...viewProps} />;
}
```

#### 適用判断基準

| 適用すべき場面 | 適用すべきでない場面 |
|---------------|-------------------|
| 状態遷移が複数ある | 単純な表示のみのコンポーネント |
| ハンドラが3つ以上 | ボタン、アイコンなど小さなコンポーネント |
| ビュー用のデータ変換が必要 | `useState` で十分な場合 |
| テスタビリティが重要 | プロトタイプ段階 |

#### 歴史的文脈と他パターンとの比較

| パターン | 時代 | 分離方法 | 課題 |
|---------|------|---------|------|
| Container/Presentational | クラスコンポーネント期 | 2つのコンポーネントに分離 | コンポーネント数の増大、HoC の複雑さ |
| Redux Connect | Redux 期 | mapState/mapDispatch | ボイラープレート、学習コスト |
| Custom Hooks | Hooks 期 | ロジックをフックに抽出 | フックの責務が曖昧になりがち |
| **View Props** | 現代 | 4つの責務に明示的分離 | 適度なボイラープレート |

#### メリット

- **明確な責務分離**: State / Handler / Selector / View の4層が構造的に定まる
- **テスト容易性**: `useViewProps` を単独でテストでき、View は純粋な描画コンポーネントになる
- **データフローの可読性**: 状態 → セレクタ → ビュー、イベント → ハンドラ → ディスパッチの流れが一貫
- **最小限の状態設計**: ビューの都合に左右されない正規化された状態を促す

#### デメリット・注意点

- **ボイラープレート増加**: 型定義・reducer・handler・selector が各コンポーネントに必要
- **状態のライフサイクル**: コンポーネントのマウント/アンマウントと状態のライフサイクルが一致する前提
- **グローバル状態には不向き**: アプリ横断的な状態には Zustand / Jotai 等と併用が必要
- **単純なコンポーネントには過剰**: 判断基準を設けて適用範囲を限定すべき

---

### 3. 両手法の関係性

FSD と View Props パターンは**異なるレベルの関心事**を扱っており、相互補完的に適用可能:

| 観点 | FSD | View Props |
|------|-----|------------|
| 対象レベル | ディレクトリ構造・モジュール間依存 | コンポーネント内部の設計 |
| 関心事 | どこにコードを置くか | コンポーネント内をどう構成するか |
| 単位 | レイヤー / スライス / セグメント | State / Handler / Selector / View |
| スケール | プロジェクト全体 | 個別コンポーネント |

**組み合わせの例**:
- FSD の `features/upload-image/ui/` 内のコンポーネントに View Props パターンを適用
- FSD の `entities/image/model/` に状態定義（reducer）を配置し、`ui/` の View コンポーネントから利用
- FSD の Public API で ViewProps 型をエクスポートし、上位レイヤーから利用

---

### 4. Picstash 現在の構造との比較

#### 現在の構造

```
src/
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
└── features/          (13 モジュール)
    ├── gallery/       (api.ts, components/, pages/)
    ├── labels/
    ├── upload/
    ├── collections/
    └── ...
```

#### FSD との対応関係

| Picstash 現在 | FSD レイヤー | 備考 |
|---------------|-------------|------|
| `main.tsx`, `App.tsx` | App | そのまま対応 |
| `routes/` | App | ルーティングは App レイヤー |
| `features/*/pages/` | Pages | ページコンポーネントは Pages レイヤーに分離可能 |
| `shared/components/AppLayout` | Widgets | 自己完結した大きな UI ブロック |
| `features/upload/`, `features/search/` | Features | 再利用可能な機能単位 |
| `features/gallery/api.ts`（Image CRUD） | Entities | ビジネスエンティティの操作 |
| `shared/`, `api/` | Shared | 汎用ユーティリティ |

#### 現在の構造の評価

**良い点**:
- Feature ベースの構造が既に採用されており、FSD の思想に近い
- 各フィーチャーが `api.ts`, `components/`, `pages/` で構造化されている
- Barrel export (`index.ts`) による Public API パターンが一部使われている
- Shared 層が存在し、汎用コードが分離されている

**改善余地**:
- Pages と Features が同じ `features/` ディレクトリに混在している
- Entities レイヤーが明示されていない（Image, Label, Collection のデータモデルが各 feature 内に散在）
- Widgets レイヤーが明示されていない（AppLayout が shared に配置）
- 依存関係ルールが構造的に強制されていない（eslint-plugin-boundaries 等の未導入）
- コンポーネント内の State/View 分離は場所によってまちまち

---

### 5. 本プロジェクトへの適用検討

#### FSD の段階的導入案

現在の構造が既に Feature ベースであるため、**完全移行ではなく段階的な改善**が現実的:

**Step 1: Entities レイヤーの抽出**（効果大・コスト中）
- `entities/image/` — Image 型、API（CRUD）、UI（ImageCard, ImageThumbnail）
- `entities/label/` — Label 型、API、UI（LabelBadge）
- `entities/collection/` — Collection 型、API

現在 `features/gallery/api.ts` に混在している画像の基本 CRUD を entities に分離することで、他の feature からの再利用が明確になる。

**Step 2: Pages レイヤーの分離**（効果中・コスト小）
- `features/gallery/pages/GalleryPage.tsx` → `pages/gallery/`
- `features/collections/pages/CollectionsPage.tsx` → `pages/collections/`

ページコンポーネントを features から分離し、ページ固有のレイアウト・データ取得を明確化。

**Step 3: Widgets レイヤーの導入**（効果小・コスト小）
- `shared/components/AppLayout` → `widgets/app-layout/`
- `features/jobs/` の JobStatusButton → `widgets/job-status/`

**Step 4: 依存関係ルールの自動化**（効果大・コスト中）
- `eslint-plugin-boundaries` 等でレイヤー間の依存方向を lint で強制

#### View Props パターンの導入案

全コンポーネントに適用するのではなく、**複雑なコンポーネントに限定して段階的に導入**:

**適用候補**（状態遷移・ハンドラが多いコンポーネント）:
- `GalleryPage` — 検索、フィルタ、ビューモード、無限スクロール、画像選択
- `ImageDetailPage` — 属性編集、説明文編集、類似画像、AI 生成
- `ArchivePreviewGallery` — プレビュー、選択、フィルタ、インポート
- `CollectionDetailPage` — 画像管理、並び替え、編集
- `StatsPage` — 期間選択、チャート切替、データ取得

**適用しない候補**（単純なコンポーネント）:
- `LabelBadge` — 表示のみ
- `ImageDropzone` — 単一ハンドラ
- `SearchBar` — 軽量な状態

## 結論

### 推奨アプローチ

**FSD と View Props パターンの段階的・選択的な導入を推奨する。**

1. **FSD**: 現在の Feature ベース構造を活かしつつ、**Entities レイヤーの抽出を最優先**で行う。Image / Label / Collection の基本的なデータモデル・API・UI パーツを entities に分離することで、feature 間の暗黙的な依存を解消し、コードの再利用性を向上させる。Pages の分離は次の優先度。完全な FSD 準拠を目指す必要はなく、プロジェクトの規模に合った粒度で適用すればよい。

2. **View Props**: 状態管理が複雑なページコンポーネント（GalleryPage, ImageDetailPage 等）に限定して導入する。全コンポーネントへの一律適用は過剰であり、「状態遷移が複数あり、ハンドラが3つ以上」という基準で判断する。TanStack Query によるサーバー状態管理は既に分離されているため、View Props パターンはクライアント側の UI 状態管理に適用する。

### 注意点・リスク

- FSD の完全準拠にこだわると、リファクタリングコストが大きくなる。段階的に進めること
- View Props パターンのボイラープレートが増えるため、チーム内でテンプレートやジェネレーターを用意すると効率的
- 依存関係ルールの lint 強制（eslint-plugin-boundaries）は早期に導入すると効果が高い
- 現在の Phase 1（デスクトップアプリ化）の進行を妨げないよう、リファクタリングは機能開発と並行して漸進的に行う

### 次のアクション候補

1. Entities レイヤー抽出の設計・タスク化（Image, Label, Collection）
2. 依存関係 lint ルールの検討（eslint-plugin-boundaries の調査）
3. GalleryPage への View Props パターン適用の PoC

## 参考リンク

- [Feature-Sliced Design 公式サイト](https://feature-sliced.design/)
- [FSD 概要](https://feature-sliced.design/docs/get-started/overview)
- [FSD レイヤーリファレンス](https://feature-sliced.design/docs/reference/layers)
- [FSD スライス・セグメント](https://feature-sliced.design/docs/reference/slices-segments)
- [FSD チュートリアル](https://feature-sliced.design/docs/get-started/tutorial)
- [FSD 移行ガイド](https://feature-sliced.design/docs/guides/migration/from-custom)
- [React の View / State 分離パターン](https://mizunashi-mana.github.io/blog/posts/2026/02/react-view-props-pattern/)

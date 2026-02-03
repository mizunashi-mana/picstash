# View / State 分離パターンと Storybook の組み合わせ

## 調査の問い

- View / State 分離パターン（View Props パターン）と Storybook はどのように組み合わせるのが効果的か
- 本プロジェクト（Picstash）での現在の適用状況と改善の余地はあるか
- View コンポーネントの Storybook 活用において推奨されるプラクティスは何か

## 背景

- 先行調査 `20260201-react-frontend-architecture` で FSD と View Props パターンの導入を推奨済み
- Picstash では既に一部コンポーネントで View / Container 分離と Storybook を活用しているが、パターンの適用基準や Storybook との組み合わせ方が体系化されていない
- Storybook 10.x 系への移行が完了しており、Vitest 統合によるインタラクティブテストも活用中

## 調査方法

- ブログ記事「React の View / State 分離パターン」の精査
- Storybook 公式ドキュメント「Building pages with Storybook」の精査
- Picstash 現在のコードベースの調査（11 ストーリーファイル、5 つの View コンポーネント）
- Container/Presentational パターンと Storybook のベストプラクティスに関するWeb調査

## 調査結果

### 1. View / State 分離パターンの概要

React コンポーネントの内部を4つの責務に分離するパターン:

| パーツ | 責務 | 実装手段 |
|--------|------|----------|
| State | 状態の保存形式と遷移の定義 | `useReducer` |
| Handler | イベント処理とアクション発行 | `useCallback` |
| Selector | 状態からビュー用データを計算 | `useMemo` |
| View | ViewProps を受け取り JSX を描画 | 関数コンポーネント |

`useViewProps` フックで State / Handler / Selector を統合し、View コンポーネントに ViewProps として渡す。

**適用基準**: 状態遷移が複数ある場合、ハンドラが3つ以上ある場合、ビュー用のデータ変換が必要な場合に適用する。単純な表示のみのコンポーネントには不要。

### 2. Storybook との相性が良い理由

View / State 分離パターンは Storybook と非常に相性が良い。その理由は以下の通り:

#### View コンポーネントが純粋なプレゼンテーションコンポーネントになる

View コンポーネントは ViewProps のみを受け取るため:

- **外部依存がない**: API 呼び出し、ルーティング、グローバル状態などへの依存がない
- **モック不要**: props にテストデータを渡すだけでストーリーが書ける
- **状態の全パターンを簡単に網羅**: Loading / Error / Empty / Default などの状態をストーリーで直接指定できる

#### Storybook 公式が推奨するアプローチと一致

Storybook 公式ドキュメントは以下を推奨している:

> コンポーネントを画面レベルまで完全にプレゼンテーショナルに保ち、複雑な接続ロジックはアプリ側の単一ラッパーコンポーネントで行う

これは View / State 分離パターンの「View はロジックを持たず ViewProps だけ受け取る」という思想と同じである。

### 3. 組み合わせの具体的な方法

#### 基本構成

```
features/upload-image/ui/
├── ImageDropzone.tsx          # Container: useViewProps + API呼び出し
├── ImageDropzoneView.tsx      # View: ViewProps → JSX
└── ImageDropzoneView.stories.tsx  # Story: View のストーリー
```

**ポイント**: ストーリーは **View コンポーネント**に対して書く。Container コンポーネントに対してストーリーを書く必要はない。

#### Step 1: ViewProps 型を定義する

```typescript
// ImageDropzoneView.tsx
export interface ImageDropzoneViewProps {
  onDrop: (files: FileWithPath[]) => void;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  errorMessage?: string;
}
```

ViewProps 型がストーリーの `args` の型と一致する。これにより Storybook の Controls パネルで各 prop を操作できる。

#### Step 2: View コンポーネントを実装する

```typescript
// ImageDropzoneView.tsx
export function ImageDropzoneView({
  onDrop,
  isPending,
  isError,
  isSuccess,
  errorMessage,
}: ImageDropzoneViewProps) {
  return (
    <Dropzone onDrop={onDrop} loading={isPending}>
      {/* JSX のみ。ロジックなし */}
    </Dropzone>
  );
}
```

#### Step 3: ストーリーを書く

```typescript
// ImageDropzoneView.stories.tsx
const meta = {
  title: 'Features/UploadImage/ImageDropzoneView',
  component: ImageDropzoneView,
  args: {
    onDrop: fn(),  // Storybook の action
  },
} satisfies Meta<typeof ImageDropzoneView>;

// 各状態のバリエーション
export const Default: Story = {
  args: { isPending: false, isError: false, isSuccess: false },
};
export const Loading: Story = {
  args: { isPending: true, isError: false, isSuccess: false },
};
export const Success: Story = {
  args: { isPending: false, isError: false, isSuccess: true },
};
export const Error: Story = {
  args: { isPending: false, isError: true, errorMessage: 'ファイルサイズが大きすぎます' },
};
```

#### Step 4: インタラクティブテストを追加する

```typescript
export const Default: Story = {
  args: { isPending: false, isError: false, isSuccess: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('ここに画像をドラッグ＆ドロップ')).toBeInTheDocument();
  },
};
```

Storybook 10 + `@storybook/addon-vitest` により、ストーリーの `play` 関数が Vitest で実行される。View コンポーネントは外部依存がないため、テストが安定する。

#### Step 5: Container コンポーネントで統合する

```typescript
// ImageDropzone.tsx
export function ImageDropzone({ onUploadSuccess }: ImageDropzoneProps) {
  const mutation = useMutation({ mutationFn: uploadImage });
  const handleDrop = (files: FileWithPath[]) => { /* ... */ };

  return (
    <ImageDropzoneView
      onDrop={handleDrop}
      isPending={mutation.isPending}
      isError={mutation.isError}
      isSuccess={mutation.isSuccess}
      errorMessage={mutation.error?.message}
    />
  );
}
```

Container は Storybook の対象外。実アプリでのみ使用される。

### 4. 複雑なコンポーネントでの応用

#### Args Composition パターン

複合的なページコンポーネントでは、子コンポーネントのストーリーから args を再利用できる:

```typescript
// GalleryPageView.stories.tsx
import { Default as GalleryDefault } from './ImageGalleryView.stories';
import { Default as DropzoneDefault } from './ImageDropzoneView.stories';

export const Default: Story = {
  args: {
    gallery: GalleryDefault.args,
    dropzone: DropzoneDefault.args,
  },
};
```

これにより、モックデータの重複を避け、子コンポーネントのストーリーと一貫したデータを使える。

#### 状態バリエーションの網羅

View / State 分離パターンでは「状態」が明示的に定義されるため、Storybook でカバーすべきバリエーションが自然に決まる:

| State のパターン | ストーリー名 | 目的 |
|-----------------|-------------|------|
| 初期状態 | `Default` | ベースラインの確認 |
| ローディング中 | `Loading` | スピナー/スケルトンの確認 |
| エラー | `Error` | エラーメッセージの確認 |
| 空データ | `Empty` | 空状態の UI 確認 |
| データあり | `WithData` | 通常表示の確認 |
| 折りたたみ | `Collapsed` | 折りたたみ状態の確認 |
| エッジケース | `SingleItem`, `ManyItems` | 境界値の確認 |

### 5. Picstash の現在の適用状況

#### 既に適用されているコンポーネント

| View コンポーネント | Container | ストーリー数 | 評価 |
|-------------------|-----------|-------------|------|
| `ImageGalleryView` | `ImageGallery` | 6 | 良好: 状態バリエーションが網羅されている |
| `ImageDropzoneView` | `ImageDropzone` | 5 | 良好: シンプルで明確 |
| `ImageAttributeSectionView` | `ImageAttributeSection` | あり | 良好 |
| `ImageDescriptionSectionView` | `ImageDescriptionSection` | あり | 良好 |
| `ArchiveDropzone` | - | あり | 単独コンポーネント |

#### 命名規則

本プロジェクトでは以下の命名規則が確立されている:

- View コンポーネント: `XxxView.tsx`
- Container コンポーネント: `Xxx.tsx`
- ストーリー: `XxxView.stories.tsx`

ストーリーは常に View コンポーネントに対して書かれており、パターンが一貫している。

#### 改善の余地

1. **`entities/label/ui/` のコンポーネント群**: `LabelBadge`, `LabelForm`, `LabelList` はストーリーがあるが View / Container 分離がされていない。これらは比較的シンプルなので現状で問題ない

2. **`AppLayout`**: ストーリーはあるが、レイアウト系コンポーネントなので View / State 分離の対象外で妥当

3. **未カバーのコンポーネント**: `SearchBar` はストーリーがあるが、今後状態管理が複雑化する場合は分離を検討

### 6. 推奨プラクティスまとめ

#### 分離すべきかの判断基準

| 条件 | 分離する | 分離しない |
|------|---------|-----------|
| ハンドラが3つ以上 | o | |
| API 呼び出しがある | o | |
| 状態遷移が複数ある | o | |
| 表示のみ / props through | | o |
| 単一の useState で十分 | | o |

#### ストーリーの書き方

1. **ストーリーは View に対して書く**: Container には書かない
2. **ViewProps の全パターンを網羅する**: Loading / Error / Empty / Default を最低限カバー
3. **`fn()` で action をモック**: ハンドラ系の props には `fn()` を使い、Storybook の Actions パネルで呼び出しを確認
4. **`play` 関数でインタラクティブテスト**: 表示内容の検証を `play` 関数で行い、`vitest run --project storybook` で CI 実行
5. **Args Composition を活用**: 複合コンポーネントでは子のストーリーから args を再利用

#### ファイル構成

```
features/{feature-name}/ui/
├── Xxx.tsx                 # Container（useViewProps / hooks + API）
├── XxxView.tsx             # View（ViewProps → JSX）
├── XxxView.stories.tsx     # Storybook ストーリー
└── index.ts                # Public API
```

## 結論

View / State 分離パターンと Storybook は相互補完的であり、本プロジェクトでは既にこの組み合わせが効果的に実践されている。

**組み合わせの核心**: View コンポーネントが ViewProps のみを受け取る純粋なプレゼンテーションコンポーネントになることで、Storybook でのストーリー作成・状態バリエーション網羅・インタラクティブテストがすべて容易になる。Container コンポーネントは Storybook の対象外とし、実アプリでのみ使用する。

**現状の評価**: Picstash の既存実装は命名規則・ファイル構成・ストーリーの書き方いずれも適切であり、大きな改善は不要。新規コンポーネント作成時に上記の判断基準に従って一貫した適用を続ければよい。

## 参考リンク

- [React の View / State 分離パターン](https://mizunashi-mana.github.io/blog/posts/2026/02/react-view-props-pattern/)
- [Building pages with Storybook（公式ドキュメント）](https://storybook.js.org/docs/writing-stories/build-pages-with-storybook)
- [Container-presentational pattern in React – why and how to use](https://tsh.io/blog/container-presentational-pattern-react)
- [10 Storybook Best Practices - DEV Community](https://dev.to/rafaelrozon/10-storybook-best-practices-5a97)
- [Fetch Data for Storybook Components With Container Pattern](https://www.newline.co/courses/storybook-for-react-apps/data-fetching-container-pattern)
- [Container/Presentational Pattern - patterns.dev](https://www.patterns.dev/react/presentational-container-pattern/)
- [先行調査: React フロントエンドアーキテクチャ調査](./../20260201-react-frontend-architecture/README.md)

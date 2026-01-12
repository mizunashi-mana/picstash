# Client Storybook リファクタリング

## 目的・ゴール

client パッケージのコンポーネントをリファクタリングし、Storybook でテスト可能な View コンポーネントに分離する。

現状:
- Storybook は既にセットアップ済み
- 2 つの View コンポーネント (ImageGalleryView, ImageDropzoneView) のみ Storybook 化されている
- 多くのコンポーネントは API 呼び出しやルーティングロジックを含んでおり、Storybook でテストしづらい

ゴール:
- 各機能のコンポーネントを Presentational (View) と Container に分離
- View コンポーネントは純粋な props ベースで動作
- 全ての View コンポーネントに Storybook stories を追加
- Interaction テストで UI 操作の動作を検証

## 実装方針

### 分離対象コンポーネント

| Feature | Component | 現状 | 対応 |
|---------|-----------|------|------|
| gallery | ImageGalleryView | ✅ View + Story あり | 完了 |
| gallery | SearchBar | View のみ | Story 追加 |
| gallery | ImageAttributeSection | 混在 | View 分離 + Story |
| gallery | ImageDescriptionSection | 混在 | View 分離 + Story |
| gallery | ImageDetailPage | Page | View 分離 + Story |
| upload | ImageDropzoneView | ✅ View + Story あり | 完了 |
| labels | LabelBadge | View のみ | Story 追加 |
| labels | LabelForm | 混在 | View 分離 + Story |
| labels | LabelList | 混在 | View 分離 + Story |
| labels | LabelsPage | Page | View 分離 + Story |
| archive-import | ArchiveDropzone | View のみ | Story 追加 |
| archive-import | ArchivePreviewGallery | View のみ | Story 追加 |
| archive-import | ArchiveImportPage | Page | View 分離 + Story |
| shared | AppLayout | Layout | Story 追加 |

### 分離パターン

```
Before:
ComponentA.tsx (API 呼び出し + 状態管理 + UI)

After:
ComponentAView.tsx (純粋な props ベースの UI)
ComponentA.tsx (API 呼び出し + 状態管理 → View に渡す)
ComponentAView.stories.tsx (Storybook stories)
```

### 命名規則

- View コンポーネント: `*View.tsx`
- Container コンポーネント: 元の名前を維持
- Story ファイル: `*View.stories.tsx`

### Interaction テスト

`@storybook/test` を使用して UI 操作の動作を検証する。

```tsx
import { expect, fn, userEvent, within } from '@storybook/test';

export const ClickTest: Story = {
  args: {
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button'));
    await expect(args.onClick).toHaveBeenCalled();
  },
};
```

対象となる Interaction:
- フォーム入力・送信
- ボタンクリック
- モーダル開閉
- 選択・チェック操作
- ドラッグ＆ドロップ（可能な範囲で）

## 完了条件

- [x] 全ての対象コンポーネントが View/Container に分離されている
- [x] 全ての View コンポーネントに Storybook stories がある
- [x] インタラクティブなコンポーネントに Interaction テストがある
- [x] Storybook でビルドが通る (`npm run build:storybook`)
- [x] Storybook テストが通る (`npm run test:storybook`)
- [x] 既存の機能が正常に動作する
- [x] ESLint エラーがない

## 作業ログ

### 2026-01-12

- タスク開始
- 現状調査完了
  - Storybook セットアップ済み
  - 2 つの View コンポーネントに Story あり
  - 残り 12 コンポーネントの対応が必要
- Story 追加 (View 分離不要):
  - SearchBar.stories.tsx
  - LabelBadge.stories.tsx
  - LabelForm.stories.tsx
  - LabelList.stories.tsx
  - ArchiveDropzone.stories.tsx
  - ArchivePreviewGallery.stories.tsx
  - AppLayout.stories.tsx
- View 分離 + Story 追加:
  - ImageDescriptionSection → ImageDescriptionSectionView
  - ImageAttributeSection → ImageAttributeSectionView
- 全 67 テストが通過
- ESLint、TypeCheck 通過
- Storybook ビルド成功
- Playwright MCP で動作確認完了:
  - ホーム画面: 画像一覧表示、検索機能 OK
  - 画像詳細画面: 説明編集機能 OK
  - Labels 画面: ラベル一覧、編集モーダル OK
  - Archive Import 画面: 表示 OK

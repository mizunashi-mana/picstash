# desktop-app の Storybook 対応拡大

## 目的・ゴール

desktop-app の UI コンポーネントに Storybook stories を追加し、コンポーネントのテスト・ドキュメント化を強化する。

## 現状

現在 desktop-app には 2 つの stories ファイルのみ：
- `LabelBadge.stories.tsx`
- `SettingsPageView.stories.tsx`

一方 web-client には 26 個の stories がある。

## 実装方針

### 優先順位

1. **純粋なView コンポーネント（props のみ依存）** - Storybook 向き
   - `ImageDropzoneView` - props のみ依存
   - `LabelForm` - props のみ依存
   - `LabelList` - props のみ依存（内部で useState 使用）

2. **API/hooks 依存コンポーネント** - View 分離が必要
   - `SearchBar` - useApiClient, useQuery 使用 → View 分離必要
   - `AppLayout` - useLocation 使用 → View 分離 or MemoryRouter でラップ

### 対象コンポーネント（Phase 1）

| コンポーネント | ファイル | 対応方法 |
|-------------|---------|---------|
| ImageDropzoneView | features/upload/components | そのまま stories 作成 |
| LabelForm | features/labels/components | そのまま stories 作成 |
| LabelList | features/labels/components | そのまま stories 作成 |

### 対象コンポーネント（Phase 2 - 要View分離）

| コンポーネント | ファイル | 対応方法 |
|-------------|---------|---------|
| AppLayout | shared/components | View 分離 or MemoryRouter ラップ |
| SearchBar | features/gallery/components | SearchBarView 分離 |

## 完了条件

- [x] ImageDropzoneView.stories.tsx 作成
- [x] LabelForm.stories.tsx 作成
- [x] LabelList.stories.tsx 作成
- [x] Storybook が正常に起動し、stories が表示される
- [x] テスト通過（npm test）

## 作業ログ

### 2026-02-08

1. **現状分析**
   - desktop-app: 2 stories（LabelBadge, SettingsPageView）
   - web-client: 26 stories

2. **Phase 1 実装（純粋 View コンポーネント）**
   - `ImageDropzoneView.stories.tsx` 作成（5 stories）
   - `LabelForm.stories.tsx` 作成（7 stories）
   - `LabelList.stories.tsx` 作成（7 stories）

3. **Storybook 設定修正**
   - `.storybook/main.ts` に `viteFinal` を追加してパスエイリアス（`@/`）を設定
   - ESM 対応のため `import.meta.url` を使用

4. **テスト結果**
   - Storybook テスト: 29 tests passed
   - ユニットテスト: 62 tests passed

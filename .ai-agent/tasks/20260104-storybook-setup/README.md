# Storybook 導入

## 目的・ゴール

- Storybook を導入し、コンポーネントを単体でプレビュー・開発できる環境を構築する
- 既存のコンポーネント（ImageGallery, ImageDropzone）のストーリーを作成する
- Mantine テーマとの統合を行う
- Storybook のインタラクションテスト機能を活用し、コンポーネントテストを実行できるようにする

## 実装方針

### 技術選定

- Storybook 10.x（最新版、ESM only）
- @storybook/react-vite（React + Vite フレームワーク統合パッケージ）
- @storybook/addon-vitest（Vitest ベースのテスト、test-runner の後継）
- Mantine テーマプロバイダを preview で設定

### v10 の特徴

- フレームワーク統合: `@storybook/react` は不要、`@storybook/react-vite` から直接インポート
- テスト: `@storybook/test-runner` → `@storybook/addon-vitest` に移行
- ESM only: 設定ファイルは ESM 形式必須
- Vitest 統合: 既存の Vitest と統合してテスト実行

### ディレクトリ構成

```
packages/client/
├── .storybook/
│   ├── main.ts          # Storybook 設定
│   ├── preview.tsx      # グローバル設定（Mantine Provider）
│   └── vitest.setup.ts  # Vitest 用のセットアップ
├── src/
│   └── features/
│       ├── gallery/
│       │   └── components/
│       │       ├── ImageGallery.tsx        # Container（データ取得）
│       │       ├── ImageGalleryView.tsx    # Presentation（UI）
│       │       └── ImageGalleryView.stories.tsx
│       └── upload/
│           └── components/
│               ├── ImageDropzone.tsx       # Container（ミューテーション）
│               ├── ImageDropzoneView.tsx   # Presentation（UI）
│               └── ImageDropzoneView.stories.tsx
```

### コンポーネント分離パターン

API 呼び出しを含むコンポーネントは、Presentation/Container パターンで分離：

- **Container**（ImageGallery, ImageDropzone）: React Query でデータ取得/ミューテーション
- **Presentation**（ImageGalleryView, ImageDropzoneView）: 純粋な UI コンポーネント、ストーリー対象

### 作業項目

1. Storybook 10.x パッケージのインストール（storybook, @storybook/react-vite, @storybook/addon-vitest）
2. .storybook 設定ファイルの作成（main.ts, preview.tsx）
3. Mantine テーマプロバイダの設定（preview.tsx）
4. Vitest 設定に Storybook 統合を追加
5. 既存コンポーネントのストーリー作成（play 関数によるテスト含む）
6. npm scripts の追加（storybook, build:storybook）
7. 動作確認（UI 表示・Vitest でテスト実行）

## 完了条件

- [x] `npm run storybook` で Storybook が起動する
- [x] ImageGallery, ImageDropzone のストーリーが表示される
- [x] Mantine スタイルが正しく適用されている
- [x] `npm run build:storybook` で静的ビルドができる
- [x] play 関数でインタラクションテストが動作する
- [x] Vitest でストーリーテストが CLI 実行できる（`npm run test:storybook`）

## npm scripts

```json
{
  "test": "vitest run --project unit",
  "test:storybook": "vitest run --project storybook",
  "storybook": "storybook dev -p 6006",
  "build:storybook": "storybook build"
}
```

## 作業ログ

### 2026-01-04

1. Storybook 10.x パッケージをインストール
   - storybook@^10.1.11
   - @storybook/react-vite@^10.1.11
   - @storybook/addon-vitest@^10.1.11
   - @vitest/browser@^4.0.16
   - @vitest/browser-playwright@^4.0.16
   - playwright@^1.57.0

2. 設定ファイルを作成
   - `.storybook/main.ts`: フレームワーク設定、addon-vitest 追加
   - `.storybook/preview.tsx`: MantineProvider, QueryClientProvider, MemoryRouter 統合
   - `.storybook/vitest.setup.ts`: setProjectAnnotations を使用したテストセットアップ

3. Vitest 設定を更新（`vitest.config.ts`）
   - `projects` オプションで unit/storybook プロジェクトを分離
   - Vitest 4.x では workspace ファイル非推奨、projects 設定に移行
   - `@vitest/browser-playwright` で Playwright ブラウザプロバイダを設定

4. コンポーネントを Presentation/Container パターンで分離
   - ImageGallery → ImageGalleryView（Presentation）
   - ImageDropzone → ImageDropzoneView（Presentation）

5. ストーリーファイルを作成
   - `ImageGalleryView.stories.tsx`: Default, Empty, Loading, ErrorState, SingleImage
   - `ImageDropzoneView.stories.tsx`: Default, Loading, Success, Error, ErrorWithDefaultMessage

6. テスト確認
   - `npm run test`: 1 passed（unit tests）
   - `npm run test:storybook`: 10 passed（browser tests with Playwright）

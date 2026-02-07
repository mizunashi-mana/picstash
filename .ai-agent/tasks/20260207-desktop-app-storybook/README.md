# desktop-app Storybook テスト環境追加

## 関連 Issue

- https://github.com/mizunashi-mana/picstash/issues/184

## 目的・ゴール

desktop-app パッケージに Storybook テスト環境を追加し、レンダラープロセスの UI コンポーネントをビジュアルテスト・インタラクションテスト可能にする。

## 背景

- web-client では Storybook 10 + `@storybook/addon-vitest` でコンポーネントテストが整備されている
- desktop-app のレンダラープロセスには `features/` や `shared/` に UI コンポーネントが存在するが、Storybook がセットアップされていない
- View/State 分離パターンを適用しているコンポーネントの Stories を追加することで、テストカバレッジと開発効率を向上させたい

## 実装方針

1. **Storybook セットアップ**
   - Storybook 10 + Vite を desktop-app に導入
   - web-client の `.storybook/` 設定を参考に構成
   - 必要な依存関係を devDependencies に追加

2. **テスト環境**
   - `@storybook/addon-vitest` によるインタラクションテスト
   - ApiClient モックの設定（web-client の preview.tsx を参考）
   - vitest.config.ts に Storybook テスト用プロジェクトを追加

3. **対象コンポーネント（サンプル Stories 追加）**
   - `renderer/shared/components/` 配下のコンポーネント
   - `renderer/features/` 配下の View コンポーネント

## 完了条件

- [x] `.storybook/` ディレクトリに main.ts, preview.tsx, vitest.setup.ts が作成されている
- [x] `npm run storybook` で Storybook が起動する
- [x] `npm run test:storybook` で Storybook テストが実行できる
- [x] サンプルとして少なくとも 1 つの Stories ファイルが動作する
- [x] CI に desktop-app Storybook テストジョブが追加されている

## 作業ログ

### 2026-02-07

1. **依存関係追加** (package.json)
   - `@storybook/addon-vitest`: ^10.1.11
   - `@storybook/react-vite`: ^10.1.11
   - `@vitest/browser`: ^4.0.16
   - `@vitest/browser-playwright`: ^4.0.16
   - `storybook`: ^10.1.11
   - `playwright`: ^1.57.0

2. **スクリプト追加** (package.json)
   - `storybook`: storybook dev -p 6007
   - `build:storybook`: storybook build
   - `test:storybook`: vitest run --project storybook
   - 既存の `test` を `--project unit` に変更

3. **.storybook/ 作成**
   - `main.ts`: Storybook 設定
   - `preview.tsx`: デコレーター（MantineProvider, ContainerProvider 等）
   - `vitest.setup.ts`: Storybook テスト用セットアップ

4. **vitest.config.ts 更新**
   - Storybook テスト用プロジェクトを追加（ブラウザモード）

5. **サンプル Stories 作成**
   - `LabelBadge.stories.tsx`: 4つのストーリー（Default, WithColor, Small, Large）

6. **CI ジョブ追加** (.github/workflows/ci-test.yml)
   - `test-storybook-desktop` ジョブを追加

7. **動作確認**
   - `npm run test:storybook` 成功（4 tests passed）
   - `npm run typecheck` 成功
   - `npm run lint` 成功（既存の warning のみ）

# TypeScript・ESLint 設定

## 目的・ゴール

モノレポ全体で統一された TypeScript と ESLint の設定を行い、型安全性とコード品質を保証する。

## 実装方針

### TypeScript 設定

1. **ルートに基本設定** (`tsconfig.base.json`)
   - TypeScript 5.x strict モード
   - ES2022 ターゲット
   - モジュール解決: bundler
   - パス解決の設定 (`@/*`)

2. **各パッケージに継承設定**
   - `packages/client/tsconfig.json` - React + Vite 用
   - `packages/server/tsconfig.json` - Node.js 用
   - `packages/shared/tsconfig.json` - ライブラリ用

### ESLint 設定

1. **専用パッケージ** (`packages/eslint-config`)
   - ESLint 9.x flat config 形式
   - モジュール分割による設定管理
   - Prettier を使わず `@stylistic/eslint-plugin` でフォーマット

2. **設定ファイル構成**
   - `globals.config.mjs` - グローバル変数・パーサー設定
   - `plugins.config.mjs` - プラグイン読み込み・recommended 設定
   - `eslint-comments.config.mjs` - ESLint コメントルール
   - `promise.config.mjs` - Promise 関連ルール
   - `node.config.mjs` - Node.js 関連ルール
   - `imports.config.mjs` - import 順序・未使用 import 検出
   - `react.config.mjs` - React/React Hooks ルール
   - `js.config.mjs` - JavaScript 品質ルール
   - `ts.config.mjs` - TypeScript 型安全性ルール

3. **主要プラグイン**
   - `@eslint/js` - ESLint 標準ルール
   - `@stylistic/eslint-plugin` - フォーマット (インデント 2、セミコロンあり、シングルクォート)
   - `typescript-eslint` - TypeScript 型チェック (recommendedTypeChecked)
   - `eslint-plugin-react` / `eslint-plugin-react-hooks` - React 対応
   - `eslint-plugin-import-x` - import 順序整理
   - `eslint-plugin-n` - Node.js ルール
   - `eslint-plugin-promise` - Promise ルール
   - `eslint-plugin-unused-imports` - 未使用 import 削除
   - `@eslint-community/eslint-plugin-eslint-comments` - ESLint コメント管理

4. **ルートに統一設定** (`eslint.config.mjs`)
   - `@picstash/eslint-config` を使用

## 完了条件

- [x] `npm run typecheck` が全パッケージで成功する
- [x] `npm run lint` が動作する
- [x] `npm run lint:check` が動作する
- [x] 各パッケージの tsconfig.json を整備する
- [ ] エディタ (VSCode) で ESLint が動作する

## 作業ログ

### 2026-01-02

- `packages/eslint-config` パッケージを作成
- 参考: https://github.com/mizunashi-mana/typescript-project-template
- Prettier を使わず `@stylistic/eslint-plugin` でフォーマットを実現
- ESLint 9.x flat config 形式で設定ファイルをモジュール分割
- ルートに `eslint.config.mjs` と `tsconfig.base.json` を作成
- `npm run lint` / `npm run lint:check` スクリプトを追加

### 2026-01-04

- 各パッケージに tsconfig.json を作成
  - `packages/client/tsconfig.json` - React + Vite 用 (DOM 型定義を含む)
  - `packages/server/tsconfig.json` - Node.js 用
  - `packages/shared/tsconfig.json` - ライブラリ用
- ルートの package.json に `npm run typecheck` スクリプトを追加
- 全パッケージで `npm run typecheck` が成功することを確認
- ルートの tsconfig を `tsconfig.base.json` にリネーム (継承用であることを明確化)

# T1: Electron プロジェクトセットアップ

## 目的・ゴール

`packages/desktop-app` に Electron プロジェクトをセットアップし、基本的なビルド環境を構築する。

## 完了条件

- [x] `packages/desktop-app` ディレクトリに Electron プロジェクトが作成される
- [x] `npm run dev -w @picstash/desktop-app` で空のウィンドウが起動する
- [x] Electron Builder がモノレポと統合される
- [x] ESLint 設定が追加される

## 実装方針

### ディレクトリ構成

```
packages/desktop-app/
├── src/
│   ├── main/           # メインプロセス（Node.js）
│   │   └── index.ts    # エントリポイント
│   ├── preload/        # プリロードスクリプト
│   │   └── index.ts    # contextBridge 設定
│   └── renderer/       # レンダラープロセス（将来 web-client を組み込み）
│       ├── index.html  # HTML
│       ├── styles.css  # スタイル
│       └── renderer.js # バージョン表示スクリプト
├── tests/                 # E2E テスト
│   └── electron.spec.ts
├── electron-builder.json  # Electron Builder 設定
├── eslint.config.mjs      # ESLint 設定
├── package.json
├── playwright.config.ts   # Playwright 設定
├── tsconfig.main.json     # メインプロセス用 TypeScript 設定
├── tsconfig.preload.json  # プリロード用 TypeScript 設定
└── tsconfig.test.json     # テスト用 TypeScript 設定
```

### 技術選定

- **Electron**: 最新安定版（v34.x）
- **Electron Builder**: パッケージング・配布用
- **Vite**: 開発サーバー（将来のレンダラー用）
- **TypeScript**: 型安全性確保

### npm scripts

```json
{
  "dev": "npm run build:main && npm run build:preload && electron .",
  "build": "npm run build:main && npm run build:preload",
  "build:main": "tsc -p tsconfig.main.json",
  "build:preload": "esbuild src/preload/index.ts --bundle --platform=node --format=esm --outfile=dist/preload/index.mjs --external:electron",
  "package": "npm run build && electron-builder",
  "typecheck": "tsc -p tsconfig.main.json --noEmit && tsc -p tsconfig.preload.json --noEmit",
  "test:e2e": "npm run build && playwright test"
}
```

## 作業ログ

- 2026-01-26: E2E テスト環境追加
  - Playwright + Electron 統合
  - 8 つのテストケース（起動、preload、セキュリティ、UI）
  - esbuild で preload を ESM バンドル
- 2026-01-26: タスク完了
  - Electron v34.x で `packages/desktop-app` を作成
  - メインプロセス: BrowserWindow 作成、セキュリティ設定（contextIsolation, sandbox）
  - プリロード: contextBridge による API 公開の基盤
  - Electron Builder: Windows/macOS/Linux 向けパッケージング設定
  - ESLint 設定追加
- 2026-01-26: タスク開始

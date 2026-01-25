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
│       └── index.html  # 仮の HTML
├── electron-builder.json  # Electron Builder 設定
├── eslint.config.mjs      # ESLint 設定
├── package.json
├── tsconfig.json
└── tsconfig.node.json     # main/preload 用 TypeScript 設定
```

### 技術選定

- **Electron**: 最新安定版（v34.x）
- **Electron Builder**: パッケージング・配布用
- **Vite**: 開発サーバー（将来のレンダラー用）
- **TypeScript**: 型安全性確保

### npm scripts

```json
{
  "dev": "electron .",
  "build": "tsc && electron-builder",
  "typecheck": "tsc --noEmit"
}
```

## 作業ログ

- 2026-01-26: タスク完了
  - Electron v34.x で `packages/desktop-app` を作成
  - メインプロセス: BrowserWindow 作成、セキュリティ設定（contextIsolation, sandbox）
  - プリロード: contextBridge による API 公開の基盤
  - Electron Builder: Windows/macOS/Linux 向けパッケージング設定
  - ESLint 設定追加
- 2026-01-26: タスク開始

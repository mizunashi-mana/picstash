# T2: 既存 Web アプリの Electron 組み込み

## 関連プロジェクト

[Desktop App プロジェクト](../../projects/20260125-desktop-app/README.md)

## 目的・ゴール

既存の React フロントエンド（`@picstash/web-client`）を Electron の BrowserWindow に組み込み、開発モードでのホットリロードと本番ビルドの両方で正常に動作させる。

## 現状

- `packages/desktop-app`: Electron プロジェクトがセットアップ済み（T1 完了）
- `packages/core`: コアロジックパッケージが分離済み
- `packages/web-client`: React + Vite + Mantine の SPA が動作中
- 現在の desktop-app は仮の HTML を読み込んでいる

## 実装方針

### アーキテクチャ

```
開発モード:
  Electron Main Process
       │
       └─→ BrowserWindow.loadURL('http://localhost:5173')
              │
              └─→ Vite Dev Server (web-client)

本番モード:
  Electron Main Process
       │
       └─→ BrowserWindow.loadFile('dist/renderer/index.html')
              │
              └─→ Vite ビルド済み静的ファイル
```

### 主要な変更点

1. **web-client のビルド出力を desktop-app に組み込み**
   - Vite の `base` 設定を調整（相対パス対応）
   - ビルド出力先を desktop-app の dist/renderer へ

2. **Electron メインプロセスの更新**
   - 開発モード: Vite dev server の URL を読み込み
   - 本番モード: ビルド済み HTML を読み込み

3. **開発時のホットリロード対応**
   - web-client の Vite dev server を起動
   - Electron が dev server の URL を読み込む
   - HMR が正常に動作する

4. **API 通信の調整**
   - 開発モード: localhost:4000 へのプロキシ
   - 本番モード: @picstash/core を直接利用（後続タスクで対応）

### npm scripts

```json
{
  "dev": "concurrently \"npm run dev:renderer\" \"npm run dev:main\"",
  "dev:renderer": "vite --config vite.renderer.config.ts",
  "dev:main": "wait-on http://localhost:5173 && npm run build:main && electron .",
  "build": "npm run build:renderer && npm run build:main",
  "build:renderer": "vite build --config vite.renderer.config.ts",
  "build:main": "tsc -p tsconfig.main.json"
}
```

## 完了条件

- [x] Vite のビルド出力が Electron に正しく読み込まれる
- [x] 開発モードでホットリロードが動作する
- [x] 本番ビルドでアプリが正常に動作する
- [x] 既存の E2E テストが引き続き動作する
- [x] `npm run typecheck` が通る
- [x] `npm run lint` が通る

## 作業ログ

- 2026-01-26: タスク完了
  - `vite.renderer.config.ts` を追加し、web-client のソースを参照
  - メインプロセスを開発/本番モードに対応
  - `concurrently` + `wait-on` で開発時の同時起動を実現
  - HashRouter を使用（file:// プロトコル対応）
  - E2E テストを更新（React アプリの読み込み確認）
- 2026-01-26: タスク開始

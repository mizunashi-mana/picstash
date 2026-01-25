# Tauri セットアップ

## 目的・ゴール

既存の Web アプリ（React + Fastify）を Tauri でラップし、デスクトップアプリとしてビルドできるようにする。Eagle からの移行先として選ばれるプロダクトにするための第一歩。

## 背景

- Phase 1: デスクトップアプリ化 の セグメント 1-1
- 現状: ブラウザで動作する Web アプリ
- 目標: exe/dmg/AppImage などのネイティブインストーラとして配布可能に

## 実装方針

### Tauri 2.x を採用

- Tauri 2.x は安定版がリリースされており、モバイル対応も視野に入れられる
- Rust ベースで軽量かつ高速

### アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│                    Tauri Shell                       │
│  ┌───────────────┐    ┌───────────────────────────┐ │
│  │ Webview       │    │ Rust Backend (Sidecar)    │ │
│  │ (React SPA)   │◀──▶│ - File System Access      │ │
│  │               │    │ - Native APIs             │ │
│  └───────────────┘    └───────────────────────────┘ │
│          │                        │                  │
│          ▼                        ▼                  │
│  ┌───────────────────────────────────────────────┐  │
│  │ Embedded Fastify Server (Node.js Sidecar)     │  │
│  │ - Existing API endpoints                      │  │
│  │ - SQLite database                             │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 実装ステップ

1. **Tauri プロジェクトセットアップ**
   - `packages/desktop-app/` に Tauri プロジェクトを作成（`@picstash/desktop-app`）
   - 既存の web-client をフロントエンドとして統合

2. **既存 Web アプリの組み込み**
   - Vite ビルド出力を Tauri に組み込み
   - 開発モードでは Vite dev server を使用

3. **サーバーサイドカー設定**
   - Node.js サイドカーとして Fastify サーバーを起動
   - Tauri 起動時にサーバーを自動起動

4. **デスクトップ用ビルド設定**
   - macOS/Windows/Linux 向けビルド設定
   - アプリアイコン設定

5. **インストーラ生成**
   - 各プラットフォーム向けインストーラ設定

## 完了条件

- [x] `npm run dev:desktop` で開発サーバーが起動する（server 別途起動が必要）
- [ ] `npm run build:desktop` でネイティブアプリがビルドされる
- [ ] macOS で dmg が生成される
- [ ] 生成されたアプリが正常に起動し、既存機能が動作する

## 技術的な考慮事項

- Tauri 2.x の sidecar 機能で Node.js サーバーを起動
- 開発時は既存の `npm run dev` と連携
- プロダクションビルドでは bundled な Node.js を使用

## 作業ログ

### 2026-01-26

**実施内容:**

1. **Tauri プロジェクト初期化**
   - `packages/desktop-app/` に Tauri 2.x プロジェクトを作成
   - パッケージ名: `@picstash/desktop-app`
   - Rust プロジェクト名: `picstash-desktop`

2. **設定ファイル作成**
   - `tauri.conf.json`: アプリ設定（ウィンドウサイズ、バンドル設定等）
   - `Cargo.toml`: Rust 依存関係（tauri, tauri-plugin-shell, tauri-plugin-log）
   - `capabilities/default.json`: 権限設定（shell プラグイン権限）

3. **Vite 統合設定**
   - `frontendDist`: `../../web-client/dist`
   - `devUrl`: `http://localhost:5173`
   - beforeDevCommand/beforeBuildCommand で web-client をビルド

4. **npm スクリプト追加**
   - `npm run dev:desktop`: Tauri 開発サーバー + server を並行起動
   - `npm run build:desktop`: プロダクションビルド

5. **ドキュメント更新**
   - `.ai-agent/structure.md` に desktop-app パッケージを追加

**残課題:**
- Node.js サイドカーの完全実装（プロダクションビルド用）
- プロダクションビルドの動作確認
- アプリアイコンのカスタマイズ


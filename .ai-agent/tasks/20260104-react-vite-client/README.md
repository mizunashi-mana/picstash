# React・Vite クライアント基盤

## 目的・ゴール

フロントエンドの基盤を構築する。React + Vite を使って、今後の UI 実装のための土台を整える。

## 技術スタック

- **React** - UI ライブラリ
- **Vite** - ビルドツール
- **React Router v7** - ルーティング
- **TanStack Query** - サーバー状態管理
- **Mantine** - UI コンポーネントライブラリ
- **TypeScript** - 型安全

## ディレクトリ構造

Feature-based ディレクトリ構造を採用：

```
packages/client/src/
├── main.tsx                    # エントリポイント
├── App.tsx                     # ルートコンポーネント（Providers）
│
├── features/                   # 機能ごとのモジュール
│   └── [feature-name]/
│       ├── components/         # feature 固有コンポーネント
│       ├── hooks/              # feature 固有フック
│       ├── api/                # feature 固有 API (TanStack Query)
│       └── pages/              # feature のページコンポーネント
│
├── shared/                     # 共通部品
│   ├── components/             # 共通 UI コンポーネント
│   ├── hooks/                  # 共通フック
│   └── helpers/                # ユーティリティ関数
│
├── api/                        # 共通 API クライアント
│   └── client.ts               # fetch wrapper, base URL 設定
│
└── routes/                     # React Router 設定
    └── index.tsx               # ルート定義
```

## 実装方針

### 1. Vite プロジェクト初期化
- `npm create vite` で React + TypeScript テンプレートを使用
- パッケージ名を `@picstash/client` に設定

### 2. 依存関係インストール
- Mantine UI（`@mantine/core`, `@mantine/hooks`）
- TanStack Query（`@tanstack/react-query`）
- React Router v7（`react-router`）

### 3. Feature-based 構造作成
- features/, shared/, api/, routes/ ディレクトリ作成
- 初期 feature として home/ を作成

### 4. Providers 設定
- Mantine Provider
- TanStack Query Provider
- React Router

### 5. ESLint 設定
- `@picstash/eslint-config` を使用

### 6. 動作確認
- `npm run dev` でクライアントが起動
- ブラウザで表示確認

## 完了条件

- [ ] `packages/client` が作成されている
- [ ] Feature-based ディレクトリ構造が整っている
- [ ] `npm run dev` でクライアントが起動する
- [ ] ブラウザでページが表示される
- [ ] Mantine コンポーネントが使える
- [ ] TanStack Query が設定されている
- [ ] React Router が設定されている
- [ ] ESLint が設定されている
- [ ] 型チェック（`npm run typecheck`）が通る

## 作業ログ

（実装時に記録）

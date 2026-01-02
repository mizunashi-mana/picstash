# 0-1 モノレポ構成・パッケージ初期化

## 目的・ゴール

npm workspaces を使用したモノレポ構成を作成し、3つのパッケージ（client, server, shared）の基本構造を整える。

## 実装方針

### ディレクトリ構成

```
packages/
├── client/          # フロントエンド（React + Vite）
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── server/          # バックエンド（Fastify）
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
└── shared/          # 共有コード
    ├── src/
    ├── package.json
    └── tsconfig.json
```

### 作業内容

1. ルート `package.json` に workspaces 設定を追加
2. 各パッケージの `package.json` を作成
3. 各パッケージの基本ディレクトリ構成を作成
4. パッケージ間の依存関係を設定（client, server → shared）

### 技術選択

- パッケージマネージャ: npm workspaces
- パッケージ命名: `@picstash/client`, `@picstash/server`, `@picstash/shared`

## 完了条件

- [x] ルート `package.json` に workspaces 設定がある
- [x] 3つのパッケージが作成されている
- [x] `npm install` が成功する
- [x] パッケージ間の参照が動作する

## 作業ログ

### 2026-01-02

- タスクドキュメント作成
- ルート package.json に workspaces 設定を追加
- packages/shared, server, client の package.json を作成
- 各パッケージに src ディレクトリとエントリポイントを作成
- npm install 成功、パッケージ間参照も動作確認
- **完了**

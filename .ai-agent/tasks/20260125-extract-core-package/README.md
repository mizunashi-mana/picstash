# T0: コアロジックの分離（@picstash/core）

## 関連プロジェクト

[Desktop App プロジェクト](../../projects/20260125-desktop-app/README.md)

## 目的・ゴール

`@picstash/server` からコアビジネスロジックを `@picstash/core` パッケージに分離し、Web 版と Desktop 版で共通利用できるようにする。

## 現状分析

### 現在の @picstash/server 構造

```
packages/server/src/
├── index.ts              # サーバーエントリポイント
├── app.ts                # Fastify アプリ構成
├── config.ts             # 設定読み込み
├── cli/                  # CLI コマンド
├── domain/               # ドメイン層（エンティティ、値オブジェクト）
├── application/          # アプリケーション層（ユースケース）
│   └── ports/            # ポート定義（インターフェース）
├── infra/                # インフラ層
│   ├── adapters/         # 外部アダプター実装
│   ├── caption/          # キャプション生成
│   ├── database/         # Prisma Client, sqlite-vec
│   ├── di/               # 依存性注入コンテナ
│   ├── embedding/        # CLIP 埋め込み
│   ├── http/             # Fastify ルート、プラグイン ← HTTP 固有
│   ├── llm/              # LLM サービス
│   ├── logging/          # ロギング
│   ├── ocr/              # OCR サービス
│   ├── queue/            # ジョブキュー
│   ├── storage/          # ファイルストレージ
│   └── workers/          # バックグラウンドワーカー
└── shared/               # サーバー内共通
```

## 実装方針

### 分離後の構造

```
packages/core/src/           # @picstash/core（新規）
├── domain/                  # ドメイン層（移動）
├── application/             # アプリケーション層（移動）
├── infra/                   # インフラ層（HTTP以外を移動）
│   ├── adapters/
│   ├── caption/
│   ├── database/
│   ├── di/
│   ├── embedding/
│   ├── llm/
│   ├── logging/
│   ├── ocr/
│   ├── queue/
│   ├── storage/
│   └── workers/
├── shared/                  # 共通ユーティリティ（移動）
└── index.ts                 # エクスポート

packages/server/src/         # @picstash/server（残留）
├── index.ts                 # サーバーエントリポイント
├── app.ts                   # Fastify アプリ構成
├── config.ts                # 設定読み込み
├── cli/                     # CLI コマンド（@picstash/core を使用）
└── infra/
    └── http/                # Fastify ルート、プラグイン
        ├── routes/
        ├── plugins/
        └── controllers/
```

### 移行ステップ

1. `packages/core` パッケージを作成（package.json, tsconfig.json）
2. Prisma スキーマと生成設定を `@picstash/core` に移動
3. `domain/` を移動
4. `application/` を移動
5. `infra/`（HTTP 以外）を移動
6. `shared/` を移動
7. DI コンテナを調整
8. `@picstash/server` から `@picstash/core` を参照するよう更新
9. インポートパスを修正
10. テストを移動・修正
11. 既存のテストが全て通ることを確認

## 完了条件

- [ ] `packages/core` ディレクトリに新パッケージが作成される
- [ ] リポジトリ層（ImageRepository, CollectionRepository 等）が分離される
- [ ] サービス層（画像処理、AI 解析等）が分離される
- [ ] `@picstash/server` は HTTP ルーティングとプラグインのみを保持
- [ ] 既存のテストが全て通る
- [ ] `npm run dev` で開発サーバーが正常に起動する
- [ ] 型チェック（`npm run typecheck`）が通る
- [ ] リンター（`npm run lint`）が通る

## 作業ログ

- 2026-01-25: タスク開始、現状分析完了

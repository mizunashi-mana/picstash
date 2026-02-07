# Repository Abstraction

core パッケージから DB 管理を切り離し、Repository インターフェースだけを残して DB 定義・マイグレーション管理は各パッケージで行うように変更する。

## 目標

- core パッケージが DB 実装に依存しないようにする
- server パッケージでは PostgreSQL、desktop-app パッケージでは SQLite を使えるようにする
- Prisma スキーマとマイグレーションを各パッケージで管理する

### 完了条件

- [ ] core パッケージから Prisma 関連ファイル（schema.prisma, migrations/, prisma.ts）が削除されている
- [ ] core パッケージは Repository インターフェースと UseCase のみを提供する
- [ ] server パッケージで Prisma スキーマとマイグレーションが動作する
- [ ] desktop-app パッケージで SQLite 対応の Prisma スキーマが動作する
- [ ] 既存の全テストがパスする

## スコープ

### やること

- core パッケージの `infra/adapters/prisma-*.ts` を server/desktop-app に移動
- core パッケージの `prisma/` ディレクトリを削除
- server パッケージに Prisma スキーマを作成（PostgreSQL 対応）
- desktop-app パッケージに Prisma スキーマを作成（SQLite 対応）
- DI コンテナ設定を各パッケージで行うように変更

### やらないこと

- server の PostgreSQL 対応（将来の拡張として設計のみ考慮）
- 新機能の追加
- パフォーマンス最適化

## 現状分析

### core パッケージの DB 関連ファイル

```
packages/core/
├── prisma/
│   ├── schema.prisma      # Prisma スキーマ（SQLite）
│   └── migrations/        # マイグレーションファイル
├── generated/
│   └── prisma/            # Prisma Client 生成物
└── src/infra/
    ├── database/
    │   ├── prisma.ts          # PrismaClient インスタンス
    │   └── prisma-service.ts  # PrismaService クラス
    ├── adapters/
    │   ├── prisma-image-repository.ts
    │   ├── prisma-collection-repository.ts
    │   ├── prisma-job-queue.ts
    │   ├── prisma-stats-repository.ts
    │   ├── prisma-view-history-repository.ts
    │   ├── prisma-search-history-repository.ts
    │   ├── prisma-image-attribute-repository.ts
    │   ├── prisma-recommendation-conversion-repository.ts
    │   └── sqlite-vec-embedding-repository.ts
    └── di/
        └── core-container.ts  # DI 設定（Prisma 依存）
```

### Repository インターフェース（残すもの）

```
packages/core/src/application/ports/
├── image-repository.ts
├── label-repository.ts
├── collection-repository.ts
├── image-attribute-repository.ts
├── view-history-repository.ts
├── search-history-repository.ts
├── stats-repository.ts
├── recommendation-conversion-repository.ts
├── embedding-repository.ts
└── job-queue.ts
```

## タスク分解

| ID | タスク | 依存 | 優先度 | 状態 |
|----|--------|------|--------|------|
| T1 | core から Prisma 実装を分離する設計ドキュメント作成 | - | 高 | 完了 |
| T2 | server パッケージに Prisma 設定を追加 | T1 | 高 | 完了 |
| T3 | server パッケージに Repository 実装を移動 | T2 | 高 | 完了 |
| T4 | desktop-app パッケージに Prisma 設定を追加 | T1 | 高 | 完了 |
| T5 | desktop-app パッケージに Repository 実装を移動 | T4 | 高 | 未着手 |
| T6 | core パッケージから Prisma 関連を削除 | T3, T5 | 中 | 未着手 |
| T7 | 全パッケージのテスト実行・修正 | T6 | 中 | 未着手 |

### 依存関係図

```
T1 ─┬→ T2 → T3 ─┬→ T6 → T7
    └→ T4 → T5 ─┘
```

### 各タスクの詳細

#### T1: core から Prisma 実装を分離する設計ドキュメント作成

- 概要: 移動するファイル、変更するインポートパス、DI コンテナの設計をドキュメント化
- 完了条件: 設計ドキュメントがレビューされ承認される

#### T2: server パッケージに Prisma 設定を追加

- 概要: server パッケージに prisma/ ディレクトリを作成し、schema.prisma を配置（現時点では SQLite）
- 完了条件: `npm run db:generate -w @picstash/server` が成功する
- 依存理由: T1 で設計が確定している必要がある

#### T3: server パッケージに Repository 実装を移動

- 概要: core の prisma-*-repository.ts を server に移動し、インポートを修正
- 完了条件: server パッケージのビルドが成功し、API が動作する
- 依存理由: T2 で Prisma Client が生成されている必要がある

#### T4: desktop-app パッケージに Prisma 設定を追加

- 概要: desktop-app パッケージに prisma/ ディレクトリを作成し、SQLite 用 schema.prisma を配置
- 完了条件: `npm run db:generate -w @picstash/desktop-app` が成功する
- 依存理由: T1 で設計が確定している必要がある

#### T5: desktop-app パッケージに Repository 実装を移動

- 概要: core の prisma-*-repository.ts を desktop-app に移動（SQLite 用に調整）
- 完了条件: desktop-app パッケージのビルドが成功し、アプリが動作する
- 依存理由: T4 で Prisma Client が生成されている必要がある

#### T6: core パッケージから Prisma 関連を削除

- 概要: prisma/, generated/, infra/database/, infra/adapters/prisma-* を削除
- 完了条件: core パッケージのビルドが成功する（Repository インターフェースのみ残る）
- 依存理由: T3, T5 で移動が完了している必要がある

#### T7: 全パッケージのテスト実行・修正

- 概要: 全テストを実行し、失敗するテストを修正
- 完了条件: `npm run test` が全パスする
- 依存理由: T6 で構造変更が完了している必要がある

## 進捗

- 2026-02-07: プロジェクト開始、現状分析完了
- 2026-02-07: T1 完了 - 設計ドキュメント作成 ([design.md](./design.md))
- 2026-02-07: T2 完了 - server に Prisma 設定追加（schema, migrations, prisma.config.ts）
- 2026-02-07: T3 完了 - server に Repository 実装を移動、DI container 更新
- 2026-02-07: T4 完了 - desktop-app に Prisma 設定追加（schema, prisma.config.ts）

## メモ

### 考慮事項

- sqlite-vec は SQLite 専用なので、PostgreSQL では pgvector を使用する必要がある
- マイグレーション履歴は各パッケージで独立して管理する
- desktop-app では既存の migration-runner.ts が core の prisma/migrations を参照しているため、修正が必要

### 代替案

1. **Prisma スキーマの共有**: core に schema.prisma を残し、各パッケージで provider だけ変更する
   - メリット: スキーマの重複を避けられる
   - デメリット: Prisma の制約で難しい（provider はビルド時に固定）

2. **Repository 実装の共有**: 共通の prisma-repository を作り、各パッケージで再利用
   - メリット: 実装の重複を避けられる
   - デメリット: PrismaClient の型が異なるため TypeScript で問題が発生する

# Repository Abstraction 設計ドキュメント

## 概要

core パッケージから Prisma 実装を分離し、Repository インターフェースのみを残す。
各パッケージ（server, desktop-app）で Prisma スキーマと Repository 実装を管理する。

## 現状の依存構造

```
┌─────────────────────────────────────────────────────────────┐
│                       core パッケージ                        │
├─────────────────────────────────────────────────────────────┤
│ application/ports/           │ infra/adapters/              │
│   ├─ image-repository.ts     │   ├─ prisma-image-repository │
│   ├─ label-repository.ts     │   ├─ prisma-label-repository │
│   ├─ collection-repository   │   ├─ prisma-collection-repo  │
│   ├─ job-queue.ts            │   ├─ prisma-job-queue        │
│   └─ ...                     │   └─ ...                     │
├──────────────────────────────┼──────────────────────────────┤
│ infra/database/              │ prisma/                      │
│   ├─ prisma-service.ts       │   ├─ schema.prisma           │
│   └─ prisma.ts               │   └─ migrations/             │
└─────────────────────────────────────────────────────────────┘
              ↑                              ↑
    ┌─────────┴─────────┐          ┌────────┴────────┐
    │   server          │          │   desktop-app   │
    │   (HTTP層のみ)     │          │   (Electron)    │
    └───────────────────┘          └─────────────────┘
```

## 目標の依存構造

```
┌─────────────────────────────────────────┐
│           core パッケージ                │
│  (Repository インターフェース + UseCase) │
├─────────────────────────────────────────┤
│ application/ports/                      │
│   ├─ image-repository.ts (interface)    │
│   ├─ label-repository.ts (interface)    │
│   ├─ collection-repository.ts           │
│   ├─ job-queue.ts (interface)           │
│   └─ ...                                │
├─────────────────────────────────────────┤
│ application/                            │
│   ├─ image/ (use cases)                 │
│   ├─ label/ (use cases)                 │
│   └─ ...                                │
├─────────────────────────────────────────┤
│ infra/adapters/ (DB 非依存のみ残す)      │
│   ├─ in-memory-*                        │
│   ├─ local-file-storage                 │
│   ├─ sharp-image-processor              │
│   ├─ zip-archive-handler                │
│   └─ rar-archive-handler                │
└─────────────────────────────────────────┘
              ↑
    ┌─────────┴───────────────────────────┐
    │                                     │
┌───┴───────────────────┐  ┌──────────────┴──────────────┐
│   server              │  │   desktop-app               │
├───────────────────────┤  ├─────────────────────────────┤
│ prisma/               │  │ prisma/                     │
│   ├─ schema.prisma    │  │   ├─ schema.prisma (SQLite) │
│   └─ migrations/      │  │   └─ migrations/            │
├───────────────────────┤  ├─────────────────────────────┤
│ src/infra/adapters/   │  │ src/main/infra/adapters/    │
│   ├─ prisma-*         │  │   ├─ prisma-*               │
│   └─ sqlite-vec-*     │  │   └─ sqlite-vec-*           │
├───────────────────────┤  ├─────────────────────────────┤
│ src/infra/di/         │  │ src/main/di/                │
│   └─ container.ts     │  │   └─ container.ts           │
│   (Repository bind)   │  │   (Repository bind)         │
└───────────────────────┘  └─────────────────────────────┘
```

## 移動対象ファイル

### core → server/desktop-app に移動

| core のパス | server のパス | desktop-app のパス |
|------------|--------------|-------------------|
| `prisma/schema.prisma` | `prisma/schema.prisma` | `prisma/schema.prisma` |
| `prisma/migrations/` | `prisma/migrations/` | `prisma/migrations/` |
| `generated/prisma/` | `generated/prisma/` | `generated/prisma/` |
| `src/infra/database/prisma-service.ts` | `src/infra/database/prisma-service.ts` | `src/main/infra/database/prisma-service.ts` |
| `src/infra/database/prisma.ts` | 削除（不要） | 削除（不要） |
| `src/infra/adapters/prisma-*.ts` (9ファイル) | `src/infra/adapters/prisma-*.ts` | `src/main/infra/adapters/prisma-*.ts` |
| `src/infra/adapters/sqlite-vec-*.ts` | `src/infra/adapters/sqlite-vec-*.ts` | `src/main/infra/adapters/sqlite-vec-*.ts` |

### core に残すファイル

| パス | 説明 |
|------|------|
| `src/application/ports/*.ts` | Repository インターフェース（全て残す） |
| `src/application/**/*.ts` | UseCase（全て残す） |
| `src/domain/**/*.ts` | ドメインモデル（全て残す） |
| `src/infra/adapters/in-memory-*.ts` | インメモリ実装（残す） |
| `src/infra/adapters/local-file-storage.ts` | ファイルストレージ（残す） |
| `src/infra/adapters/sharp-image-processor.ts` | 画像処理（残す） |
| `src/infra/adapters/*-archive-handler.ts` | アーカイブ（残す） |
| `src/infra/caption/` | キャプション生成（残す） |
| `src/infra/embedding/` | 埋め込み生成（残す） |
| `src/infra/llm/` | LLM サービス（残す） |
| `src/infra/ocr/` | OCR サービス（残す） |
| `src/infra/queue/` | ジョブキュー（※要検討） |
| `src/infra/workers/` | ワーカー（※要検討） |

## DI コンテナの変更

### 現状: core/src/infra/di/core-container.ts

```typescript
// 全ての Repository 実装を bind している
container.bind<ImageRepository>(TYPES.ImageRepository)
  .to(PrismaImageRepository).inSingletonScope();
container.bind<LabelRepository>(TYPES.LabelRepository)
  .to(PrismaLabelRepository).inSingletonScope();
// ... 他の Repository も同様
```

### 変更後: core からは Repository bind を削除

#### core/src/infra/di/core-container.ts（変更後）

```typescript
export function createCoreContainer(config: CoreConfig): Container {
  const container = new Container();

  // Config
  container.bind<CoreConfig>(TYPES.Config).toConstantValue(config);

  // DB 非依存のサービスのみ bind
  container.bind<FileStorage>(TYPES.FileStorage)
    .to(LocalFileStorage).inSingletonScope();
  container.bind<ImageProcessor>(TYPES.ImageProcessor)
    .to(SharpImageProcessor).inSingletonScope();
  container.bind<ArchiveHandler>(TYPES.ArchiveHandler).to(ZipArchiveHandler);
  container.bind<ArchiveHandler>(TYPES.ArchiveHandler).to(RarArchiveHandler);
  container.bind<ArchiveSessionManager>(TYPES.ArchiveSessionManager)
    .to(InMemoryArchiveSessionManager).inSingletonScope();
  container.bind<UrlCrawlSessionManager>(TYPES.UrlCrawlSessionManager)
    .to(InMemoryUrlCrawlSessionManager).inSingletonScope();

  // AI サービス
  container.bind<EmbeddingService>(TYPES.EmbeddingService)
    .to(ClipEmbeddingService).inSingletonScope();
  container.bind<CaptionService>(TYPES.CaptionService)
    .to(TransformersCaptionService).inSingletonScope();
  container.bind<OcrService>(TYPES.OcrService)
    .to(TesseractOcrService).inSingletonScope();

  // LLM (optional)
  if (config.ollama !== undefined) {
    container.bind<LlmService>(TYPES.LlmService)
      .to(OllamaLlmService).inSingletonScope();
  }

  return container;
}
```

#### server/src/infra/di/container.ts（変更後）

```typescript
import { createCoreContainer } from '@picstash/core';
import { PrismaService } from '../database/prisma-service.js';
import {
  PrismaImageRepository,
  PrismaLabelRepository,
  // ...他の Repository
} from '../adapters/index.js';
import { SqliteVecEmbeddingRepository } from '../adapters/sqlite-vec-embedding-repository.js';

export function createContainer(config: Config): Container {
  const container = createCoreContainer(config);

  // Database
  container.bind<PrismaService>(TYPES.PrismaService)
    .to(PrismaService).inSingletonScope();

  // Repositories (Prisma 実装)
  container.bind<ImageRepository>(TYPES.ImageRepository)
    .to(PrismaImageRepository).inSingletonScope();
  container.bind<LabelRepository>(TYPES.LabelRepository)
    .to(PrismaLabelRepository).inSingletonScope();
  container.bind<CollectionRepository>(TYPES.CollectionRepository)
    .to(PrismaCollectionRepository).inSingletonScope();
  // ... 他の Repository

  // Vector DB
  container.bind<EmbeddingRepository>(TYPES.EmbeddingRepository)
    .to(SqliteVecEmbeddingRepository).inSingletonScope();

  // Job Queue
  container.bind<JobQueue>(TYPES.JobQueue)
    .to(PrismaJobQueue).inSingletonScope();

  // Controllers
  container.bind(CONTROLLER_TYPES.ImageController).to(ImageController);
  // ...

  return container;
}
```

#### desktop-app/src/main/di/container.ts（新規作成）

```typescript
import { createCoreContainer } from '@picstash/core';
import { PrismaService } from '../infra/database/prisma-service.js';
import {
  PrismaImageRepository,
  // ...
} from '../infra/adapters/index.js';

export function createDesktopContainer(config: CoreConfig): Container {
  const container = createCoreContainer(config);

  // Database (SQLite)
  container.bind<PrismaService>(TYPES.PrismaService)
    .to(PrismaService).inSingletonScope();

  // Repositories (Prisma + SQLite)
  container.bind<ImageRepository>(TYPES.ImageRepository)
    .to(PrismaImageRepository).inSingletonScope();
  // ...

  return container;
}
```

## core/src/index.ts の変更

### 削除するエクスポート

```typescript
// 削除: Database 関連
export { PrismaService, Prisma } from './infra/database/prisma-service.js';
export { initializeDatabase, connectDatabase, disconnectDatabase } from './infra/database/prisma.js';

// 削除: Prisma Repository 実装
export * from './infra/adapters/index.js';  // → 残すアダプターのみ個別エクスポートに変更
```

### 変更後のアダプターエクスポート

```typescript
// DB 非依存のアダプターのみエクスポート
export { InMemoryArchiveSessionManager } from './infra/adapters/in-memory-archive-session-manager.js';
export { InMemoryUrlCrawlSessionManager } from './infra/adapters/in-memory-url-crawl-session-manager.js';
export { LocalFileStorage } from './infra/adapters/local-file-storage.js';
export { SharpImageProcessor } from './infra/adapters/sharp-image-processor.js';
export { ZipArchiveHandler } from './infra/adapters/zip-archive-handler.js';
export { RarArchiveHandler } from './infra/adapters/rar-archive-handler.js';
```

## package.json の変更

### core/package.json

```diff
  "dependencies": {
-   "@prisma/adapter-better-sqlite3": "^7.2.0",
-   "@prisma/client": "^7.2.0",
-   "better-sqlite3": "^12.5.0",
    // ... 他の依存は残す
  },
  "devDependencies": {
-   "prisma": "^7.2.0",
    // ...
  },
  "scripts": {
-   "db:generate": "prisma generate",
    // ...
  }
```

### server/package.json

```diff
  "dependencies": {
+   "@prisma/adapter-better-sqlite3": "^7.2.0",
+   "@prisma/client": "^7.2.0",
+   "better-sqlite3": "^12.5.0",
+   "sqlite-vec": "^0.1.7-alpha.2",
    // ...
  },
  "devDependencies": {
+   "prisma": "^7.2.0",
    // ...
  },
  "scripts": {
+   "db:generate": "prisma generate",
+   "db:migrate": "prisma migrate dev",
+   "db:migrate:deploy": "prisma migrate deploy",
    // ...
  }
```

### desktop-app/package.json

```diff
  "dependencies": {
+   "@prisma/adapter-better-sqlite3": "^7.2.0",
+   "@prisma/client": "^7.2.0",
    "better-sqlite3": "^12.5.0",  // 既存
+   "sqlite-vec": "^0.1.7-alpha.2",
    // ...
  },
  "devDependencies": {
+   "prisma": "^7.2.0",
    // ...
  },
  "scripts": {
+   "db:generate": "prisma generate",
    // ...
  }
```

## 移行手順

### Phase 1: server への移動

1. server に `prisma/` ディレクトリを作成
2. core の `schema.prisma` と `migrations/` をコピー
3. `prisma.config.ts` を作成（出力先設定）
4. `npm run db:generate -w @picstash/server` で Prisma Client 生成
5. core の `prisma-*.ts` を server にコピー
6. インポートパスを修正（`@~generated/prisma` → 相対パス等）
7. server の DI コンテナを修正
8. server のビルド・テスト

### Phase 2: desktop-app への移動

1. desktop-app に `prisma/` ディレクトリを作成
2. core の `schema.prisma` と `migrations/` をコピー
3. `prisma.config.ts` を作成
4. `npm run db:generate -w @picstash/desktop-app` で Prisma Client 生成
5. core の `prisma-*.ts` を desktop-app にコピー
6. インポートパスを修正
7. desktop-app の DI コンテナを作成
8. `core-manager.ts` を修正
9. desktop-app のビルド・テスト

### Phase 3: core のクリーンアップ

1. core から `prisma/`, `generated/` を削除
2. core から `infra/database/` を削除
3. core から `infra/adapters/prisma-*.ts`, `sqlite-vec-*.ts` を削除
4. `core-container.ts` から Repository bind を削除
5. `index.ts` のエクスポートを修正
6. `package.json` から Prisma 依存を削除
7. core のビルド・テスト

### Phase 4: 統合テスト

1. `npm run test` で全テスト実行
2. 失敗テストの修正
3. E2E テスト実行

## 注意事項

### sqlite-vec について

- sqlite-vec は SQLite 専用の拡張
- 将来 PostgreSQL に移行する場合は pgvector を使用
- EmbeddingRepository インターフェースは共通、実装が異なる

### migration-runner.ts について

現在 desktop-app の `migration-runner.ts` は core の `prisma/migrations` を参照している。
desktop-app にスキーマを移動後、このパスを修正する必要がある。

```typescript
// 変更前
const corePackageJsonPath = require.resolve('@picstash/core/package.json');
const migrationsDir = join(dirname(corePackageJsonPath), 'prisma', 'migrations');

// 変更後
const migrationsDir = join(__dirname, '../../prisma/migrations');
```

### Prisma Client の型共有について

各パッケージで Prisma Client を生成するため、型は共有されない。
ただし Repository インターフェースで抽象化しているため問題にならない。

## 将来の拡張性

### PostgreSQL 対応（将来）

server で PostgreSQL を使用する場合:

1. `schema.prisma` の provider を `postgresql` に変更
2. `PrismaService` のアダプターを変更
3. `EmbeddingRepository` を `PgVectorEmbeddingRepository` に差し替え
4. マイグレーションを再作成

DI コンテナで実装を差し替えるだけで対応可能な設計。

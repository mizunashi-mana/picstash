# タスク: DIコンテナのラッパー実装

## 目的・ゴール

DIコンテナ（inversify）の直接参照箇所を減らし、型安全で使いやすいラッパーを提供する。`container.get<Service>(TYPES.Service)` という冗長な記述を `container.getService()` のようなシンプルな形式に改善する。

## 提供価値

- DIコンテナの使用箇所でのボイラープレート削減
- 型安全性の向上（型パラメータの重複記述が不要に）
- サービス追加時の変更箇所の明確化
- テスト時のモック差し替えが容易に

## 現状分析

### 直接参照箇所（6ファイル、22箇所）

| ファイル | 参照数 |
|---------|--------|
| `infra/http/routes/images.ts` | 8 |
| `infra/http/routes/archives.ts` | 4 |
| `infra/http/routes/image-attributes.ts` | 3 |
| `infra/http/routes/labels.ts` | 1 |
| `cli/generate-embeddings.ts` | 4 |
| `cli/generate-label-embeddings.ts` | 2 |

### 登録サービス（10種類）

1. ImageRepository
2. LabelRepository
3. ImageAttributeRepository
4. FileStorage
5. ImageProcessor
6. ArchiveHandler（複数バインド）
7. ArchiveSessionManager
8. EmbeddingService
9. EmbeddingRepository
10. CaptionService

## 実装方針

### 技術アプローチ

inversify の Container をラップした `AppContainer` クラスを作成し、`buildAppContainer()` ファクトリ関数で生成。main からの依存性伝搬方式を採用（グローバル変数は使用しない）。

### 新しいAPI設計

```typescript
// Before
import { container, TYPES } from '@/infra/di/index.js';
const imageRepository = container.get<ImageRepository>(TYPES.ImageRepository);

// After (main)
import { buildAppContainer } from '@/infra/di/index.js';
const container = buildAppContainer();
const app = await buildApp(container);

// After (routes)
export function imageRoutes(app: FastifyInstance, container: AppContainer): void {
  const imageRepository = container.getImageRepository();
  // ...
}
```

### ファイル構成

```
packages/server/src/infra/di/
├── index.ts              # エクスポート（buildAppContainer, AppContainer）
├── container.ts          # createContainer() - inversify Container 設定
├── types.ts              # TYPES 定義（内部使用）
└── app-container.ts      # AppContainer クラス + buildAppContainer()
```

### AppContainer クラス設計

```typescript
export class AppContainer {
  private container: Container;

  constructor(container: Container) {
    this.container = container;
  }

  // Repositories
  getImageRepository(): ImageRepository { ... }
  getLabelRepository(): LabelRepository { ... }
  getImageAttributeRepository(): ImageAttributeRepository { ... }

  // Storage & Processing
  getFileStorage(): FileStorage { ... }
  getImageProcessor(): ImageProcessor { ... }

  // Archive
  getArchiveHandlers(): ArchiveHandler[] { ... }
  getArchiveSessionManager(): ArchiveSessionManager { ... }

  // AI/Embedding
  getEmbeddingService(): EmbeddingService { ... }
  getEmbeddingRepository(): EmbeddingRepository { ... }
  getCaptionService(): CaptionService { ... }
}
```

## 完了条件

- [x] AppContainer クラスを作成
- [x] 全サービスの getter メソッドを実装
- [x] 既存の直接参照箇所を AppContainer 経由に置き換え
- [x] TYPES と container の直接エクスポートを削除（後方互換性のため残す場合はdeprecatedコメント）
- [x] テストが通る
- [x] 型エラーがない

## 作業ログ

### 2026-01-17

1. **AppContainer クラス作成**
   - `packages/server/src/infra/di/app-container.ts` を新規作成
   - 10サービスの getter メソッドを実装

2. **グローバル変数廃止・依存性伝搬方式に変更**
   - `buildAppContainer()` ファクトリ関数を追加
   - `createContainer()` 関数を追加（inversify Container の設定）
   - グローバルな `appContainer` エクスポートを削除
   - 各コンポーネントに引数として AppContainer を伝搬

3. **main からの依存性伝搬**
   - `index.ts`: `buildAppContainer()` でコンテナ作成
   - `app.ts`: `buildApp(container)` で受け取り
   - `routes/index.ts`: `registerRoutes(app, container)` で受け取り
   - 各 routes: 引数で `container: AppContainer` を受け取り

4. **CLI の修正**
   - `generate-embeddings.ts`: `buildAppContainer()` を使用
   - `generate-label-embeddings.ts`: `buildAppContainer()` を使用

5. **動作確認**
   - TypeScript 型チェック: パス
   - 全129テスト: パス
   - グローバルな `appContainer` 参照: 0箇所

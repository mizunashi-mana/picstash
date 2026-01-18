# Copilot ガイドライン

このドキュメントは、GitHub Copilot がこのプロジェクトのコードをレビュー・生成する際の指針です。

## レビュー規約

* レビューコメントは日本語で行ってください
* 指摘は具体的かつ建設的に行い、可能であれば修正案を提示してください

## プロジェクト概要

Picstash は、イラストや画像作品を整理・管理するアプリケーションです。AI が画像を自動解析して属性や説明を付与します。

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| 言語 | TypeScript (ES2022, strict mode) |
| フロントエンド | React 19, Vite 7, Mantine 8, TanStack Query |
| バックエンド | Fastify 5, Inversify (DI) |
| ORM | Prisma 7 |
| データベース | SQLite (better-sqlite3), sqlite-vec (ベクトル検索) |
| AI/ML | Florence-2 (キャプション), CLIP (埋め込み), Ollama (LLM) |
| テスト | Vitest |
| リンター | ESLint 9 (Flat Config) |

## アーキテクチャ

クリーンアーキテクチャを採用しています：

```
packages/server/src/
├── application/       # ユースケース層
│   ├── ports/         # インターフェース定義（Repository, Service）
│   ├── archive/       # アーカイブ関連ユースケース
│   ├── embedding/     # 埋め込み生成
│   └── ...
├── domain/            # ドメイン層（エンティティ、値オブジェクト）
│   ├── image/
│   ├── label/
│   └── ...
├── infra/             # インフラ層
│   ├── adapters/      # Repository/Service の実装
│   ├── http/          # HTTP コントローラー
│   ├── di/            # 依存性注入コンテナ
│   └── ...
└── shared/            # 共有ユーティリティ
```

### 依存関係の方向

```
infra → application → domain
         ↓
       ports (interfaces)
```

* `domain` は他のレイヤーに依存しない
* `application` は `domain` と `ports` のみに依存
* `infra` は全レイヤーに依存可能（実装を提供）

## コーディング規約

### 命名規則

| 対象 | 規則 | 例 |
|------|------|-----|
| ファイル名 | kebab-case | `image-repository.ts` |
| クラス | PascalCase | `ImageController` |
| 関数・変数 | camelCase | `findById`, `imageId` |
| 定数 | UPPER_SNAKE_CASE | `EMBEDDING_DIMENSION` |
| インターフェース | PascalCase（I prefix なし） | `ImageRepository` |
| 型 | PascalCase | `CreateImageInput` |

### TypeScript

* `any` は禁止。必要な場合は `unknown` を使用し、型ガードで絞り込む
* 非 null アサーション (`!`) より型ガードを優先
* `as` による型アサーションは最小限に（テストコードでは許容）
* インポートは `type` 修飾子を積極的に使用: `import type { Foo } from './foo'`

### エラーハンドリング

* ユースケース関数はエラーを文字列リテラル型で返す:
  ```typescript
  type Result = ImageData | 'IMAGE_NOT_FOUND' | 'EMBEDDING_FAILED';
  ```
* 例外は予期しないエラーのみに使用

### テスト

* テストファイルは `tests/` ディレクトリに配置
* モックは `vi.fn()` と `vi.mock()` を使用
* 外部依存（fetch, fs など）は必ずモック化
* テストケースは日本語で記述可能

## 重要な設計パターン

### Repository パターン

```typescript
// ports/ でインターフェース定義
export interface ImageRepository {
  findById(id: string): Promise<Image | null>;
  create(input: CreateImageInput): Promise<Image>;
}

// infra/adapters/ で実装
@injectable()
export class PrismaImageRepository implements ImageRepository {
  // ...
}
```

### 依存性注入 (Inversify)

```typescript
// コンストラクタインジェクション
@injectable()
export class ImageController {
  constructor(
    @inject(TYPES.ImageRepository)
    private readonly imageRepository: ImageRepository,
  ) {}
}

// オプショナルな依存
constructor(
  @inject(TYPES.LlmService) @optional()
  private readonly llmService?: LlmService,
) {}
```

### 条件付きバインド

設定に基づいてサービスをバインドする場合：

```typescript
const config = getConfig();
if (config.ollama !== undefined) {
  container.bind<LlmService>(TYPES.LlmService).to(OllamaLlmService);
}
```

## よくある問題と対処法

### N+1 クエリ

```typescript
// NG: ループ内でクエリ
for (const id of ids) {
  const image = await repo.findById(id);
}

// OK: バッチフェッチ
const images = await repo.findByIds(ids);
const imageMap = new Map(images.map(img => [img.id, img]));
```

### 型安全性

```typescript
// NG: 型アサーション
const body = req.body as CreateImageInput;

// OK: Zod などでバリデーション
const body = createImageSchema.parse(req.body);
```

## リソース

### プロジェクトドキュメント

* [README.md](../README.md) - プロジェクト概要、セットアップ手順

### Steering ドキュメント（`.ai-agent/steering/`）

AI エージェント向けのプロジェクト指針ドキュメントです：

| ファイル | 内容 |
|---------|------|
| [product.md](../.ai-agent/steering/product.md) | プロダクト概要、機能一覧、ユースケース |
| [tech.md](../.ai-agent/steering/tech.md) | 技術スタック、開発コマンド、パッケージ構成 |
| [plan.md](../.ai-agent/steering/plan.md) | 実装計画、セグメント状態、優先順位 |
| [work.md](../.ai-agent/steering/work.md) | 作業の進め方、コーディング規約 |
| [idea.md](../.ai-agent/steering/idea.md) | 将来のアイデア、検討事項 |
| [structure.md](../.ai-agent/structure.md) | ディレクトリ構成、各ディレクトリの役割 |

### コード関連

* [Prisma Schema](../packages/server/prisma/schema.prisma) - データベーススキーマ
* [ESLint Config](../packages/eslint-config/) - 共通リンター設定パッケージ

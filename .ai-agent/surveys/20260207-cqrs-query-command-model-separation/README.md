# CQRS と Query/Command Model 分離

## 調査の問い
- CQRS（Command Query Responsibility Segregation）の思想とは何か
- Query Model と Command Model の分離はどのように行うべきか
- クリーンアーキテクチャとの併用はどのように行うか
- 本プロジェクト（Picstash）への適用方法

## 背景
- Issue #173「read model と command model (entity) を分離する」の実装検討
- 現在 `@picstash/core/domain` の entity（`Image`, `Collection`, `Label` など）は、クエリ（読み取り）とコマンド（書き込み）の両方で使用されている
- 責務を分離することで、クエリに最適化された read model を定義できる

## 調査方法
- Web 検索による CQRS の概念・パターン調査
- Microsoft Azure Architecture Center、Martin Fowler のブログ、技術記事の参照
- 既存コードベースの分析

---

## 調査結果

### 1. CQRS の基本概念

**CQRS（Command Query Responsibility Segregation）** は、データの読み取り操作と書き込み操作を異なるモデルに分離するデザインパターン。

#### 核心的な考え方
> 「情報を更新するために使うモデルと、情報を読み取るために使うモデルを分離できる」
> — Martin Fowler

| 概念 | 説明 |
|------|------|
| **Command（コマンド）** | データを変更する操作。ビジネスタスクを表現し、ドメインロジックを含む |
| **Query（クエリ）** | データを読み取る操作。副作用を持たず、表示に最適化された DTO を返す |

#### CQRS が解決する問題
- **データ形式の不一致**: 読み取りと書き込みで必要なデータ構造が異なる
- **ロック競合**: 並行操作による競合
- **パフォーマンス問題**: 単一モデルでは両方を最適化できない
- **セキュリティ課題**: 読み取り/書き込みで異なる権限管理が必要

### 2. 実装アプローチの段階

CQRS には複雑さに応じた複数の実装レベルがある：

#### レベル 1: 同一データストアでモデル分離（基本 CQRS）
```
┌─────────────────────────────────────┐
│            単一データベース           │
│  ┌─────────────┐  ┌─────────────┐   │
│  │ Write Model │  │ Read Model  │   │
│  │ (Entity)    │  │ (DTO)       │   │
│  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────┘
```
- **同一 DB** を使用するが、モデル（型定義）は分離
- 最もシンプルで導入しやすい
- **Picstash に推奨**

#### レベル 2: 異なるデータストアでモデル分離（高度 CQRS）
```
┌───────────────┐     ┌───────────────┐
│ Write Store   │     │ Read Store    │
│ (Relational)  │ ──▶ │ (Document)    │
└───────────────┘     └───────────────┘
        │                    ▲
        └───── Events ───────┘
```
- 書き込みストアと読み取りストアを物理的に分離
- 結果整合性（Eventual Consistency）が発生
- 大規模システム向け

#### レベル 3: Event Sourcing との組み合わせ
- イベントを唯一の真実のソース（Source of Truth）として保存
- Read Model はイベントから派生的に生成
- 最も複雑だが、監査ログ・履歴管理に強い

### 3. クリーンアーキテクチャとの統合

DDD、CQRS、クリーンアーキテクチャは相性が良く、組み合わせて使用されることが多い。

#### レイヤー構成

```
┌─────────────────────────────────────────────────────┐
│                    Presentation                      │
│              (HTTP Handlers / Controllers)           │
├─────────────────────────────────────────────────────┤
│                    Application                       │
│     ┌─────────────────┐  ┌─────────────────┐        │
│     │ Command Handlers │  │ Query Handlers  │        │
│     │ (Use Cases)      │  │ (Read Services) │        │
│     └─────────────────┘  └─────────────────┘        │
├─────────────────────────────────────────────────────┤
│                      Domain                          │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │   Entities   │  │ Read Models  │                 │
│  │ (Write Model)│  │   (DTOs)     │                 │
│  └──────────────┘  └──────────────┘                 │
├─────────────────────────────────────────────────────┤
│                  Infrastructure                      │
│  ┌──────────────────────────────────────────────┐   │
│  │              Repository Implementations        │   │
│  │    ┌────────────────┐  ┌────────────────┐    │   │
│  │    │ Write Methods  │  │ Read Methods   │    │   │
│  │    │ (save, delete) │  │ (find, search) │    │   │
│  │    └────────────────┘  └────────────────┘    │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

#### 各層の責務

| レイヤー | Command 側の責務 | Query 側の責務 |
|---------|-----------------|---------------|
| **Application** | コマンドハンドラ（ユースケース実行） | クエリハンドラ（データ取得） |
| **Domain** | Entity（ビジネスルール、状態遷移） | Read Model（表示用 DTO） |
| **Infrastructure** | save, update, delete | find, search, list |

### 4. Read Model と Write Model の設計指針

#### Write Model（Entity）の特徴
- **ビジネスルールを内包**: バリデーション、状態遷移ロジック
- **カプセル化**: private フィールド、behavior-driven メソッド
- **ドメイン語彙**: ビジネス用語に沿った命名

```typescript
// Write Model: ドメインロジックを持つ Entity
interface ImageEntity {
  id: string;
  path: string;
  title: string;
  description: string | null;
  // ... 必要最小限のフィールド

  // ドメインメソッド
  updateDescription(description: string): void;
  validate(): ValidationResult;
}
```

#### Read Model（DTO）の特徴
- **表示に最適化**: クライアントが必要とする形式
- **結合済みデータ**: 関連データを事前に含める
- **計算済みプロパティ**: 派生値を含められる
- **フラットな構造**: ネストを減らし取得を高速化

```typescript
// Read Model: 表示に最適化された DTO
interface ImageReadModel {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string;  // URL として構築済み

  // 結合データ（JOIN 結果を含む）
  labels: Array<{ id: string; name: string; color: string }>;
  collectionCount: number;  // 計算済み

  // 表示用メタデータ
  formattedSize: string;  // "2.5 MB"
  createdAtFormatted: string;  // "2024年1月15日"
}
```

### 5. Repository パターンでの分離方法

#### アプローチ A: 単一 Repository で戻り値の型を分ける

```typescript
interface ImageRepository {
  // Write 操作 → Entity を返す
  create(input: CreateImageInput): Promise<ImageEntity>;
  updateById(id: string, input: UpdateImageInput): Promise<ImageEntity>;
  deleteById(id: string): Promise<void>;

  // Read 操作 → Read Model を返す
  findById(id: string): Promise<ImageReadModel | null>;
  findAll(): Promise<ImageReadModel[]>;
  searchPaginated(query: string, options: PaginationOptions): Promise<PaginatedResult<ImageReadModel>>;
}
```

#### アプローチ B: Repository を Command/Query で分離

```typescript
// Command Repository
interface ImageCommandRepository {
  create(input: CreateImageInput): Promise<ImageEntity>;
  update(id: string, input: UpdateImageInput): Promise<ImageEntity>;
  delete(id: string): Promise<void>;
}

// Query Repository（または Read Service）
interface ImageQueryRepository {
  findById(id: string): Promise<ImageReadModel | null>;
  findAll(): Promise<ImageReadModel[]>;
  search(query: string): Promise<ImageReadModel[]>;
}
```

#### 推奨: アプローチ A（単一 Repository）
- シンプルさを維持
- 既存コードへの影響が小さい
- 必要に応じて後からアプローチ B に移行可能

### 6. 本プロジェクト（Picstash）への適用

#### 現状分析

**現在の構造:**
```
packages/core/src/domain/image/Image.ts
├── Image interface        ← Entity（Read/Write 兼用）
├── CreateImageInput      ← Command Input
└── UpdateImageInput      ← Command Input

packages/api/src/images.ts
└── Image interface        ← API レスポンス型（Read Model 相当）
```

**問題点:**
- `@picstash/core` の `Image` と `@picstash/api` の `Image` が重複定義
- Repository の `find` 系メソッドが `Image` Entity を返している
- クエリ結果に関連データ（labels, collections）を含めるには追加クエリが必要

#### 推奨する変更

**1. 型定義の整理**

```
packages/core/src/domain/
├── image/
│   ├── Image.ts              ← Entity（Command 用、シンプルに）
│   └── ImageReadModel.ts     ← Read Model（Query 用、表示最適化）
```

**2. Repository インターフェースの更新**

```typescript
// packages/core/src/application/ports/image-repository.ts

export interface ImageRepository {
  // Command 操作 → Entity を返す
  create(input: CreateImageInput): Promise<Image>;
  updateById(id: string, input: UpdateImageInput): Promise<Image>;
  deleteById(id: string): Promise<void>;

  // Query 操作 → Read Model を返す
  findById(id: string): Promise<ImageReadModel | null>;
  findAllPaginated(options: PaginationOptions): Promise<PaginatedResult<ImageReadModel>>;
  searchPaginated(query: string, options: PaginationOptions): Promise<PaginatedResult<ImageReadModel>>;
}
```

**3. Read Model の設計例**

```typescript
// packages/core/src/domain/image/ImageReadModel.ts

export interface ImageReadModel {
  id: string;
  title: string;
  description: string | null;
  thumbnailPath: string | null;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: Date;
  updatedAt: Date;

  // 関連データ（JOIN で取得）
  attributes?: Array<{
    id: string;
    labelId: string;
    labelName: string;
    labelColor: string | null;
    keywords: string | null;
  }>;
}
```

**4. @picstash/api との統合**

```typescript
// @picstash/api は Read Model の JSON シリアライズ版として位置づけ
// Date → string 変換のみ

export interface Image {
  // ImageReadModel と同じ構造、Date が string になる
}
```

### 7. CQRS を使うべき場面・使わないべき場面

#### 使うべき場面
- ✅ 読み取りと書き込みの負荷が大きく異なる（読み取り 80-95%）
- ✅ 表示に必要なデータと保存データの構造が異なる
- ✅ 複数の結合が必要なクエリが多い
- ✅ チーム分離が必要（ドメイン担当 / UI 担当）

#### 使わないべき場面
- ❌ シンプルな CRUD アプリケーション
- ❌ 読み取りと書き込みの構造がほぼ同じ
- ❌ 小規模なシステム（過剰な複雑さになる）

#### Picstash の場合
- 画像一覧表示では関連データ（ラベル、コレクション）が必要 → **Read Model が有効**
- 画像の更新はシンプル（タイトル、説明文のみ） → 複雑な Entity は不要
- **レベル 1（同一 DB でモデル分離）** が適切

---

## 結論

### 推奨アプローチ

1. **段階的に導入**: まず `Image` から始め、成功パターンを他の Entity に展開
2. **同一 DB + モデル分離**: 複雑な Event Sourcing は不要
3. **単一 Repository**: Command/Query で戻り値の型を変える（Repository 分離はしない）
4. **Read Model は Domain 層に配置**: `domain/image/ImageReadModel.ts`

### 実装優先度

| 優先度 | Entity | 理由 |
|--------|--------|------|
| 高 | Image | 最も使用頻度が高く、関連データ（ラベル、コレクション）が多い |
| 中 | Collection | 画像一覧を含む Read Model が有効 |
| 低 | Label | 構造がシンプルで、現状で問題なし |

### 注意点

- Read Model は「表示に必要なもの」に絞る（過剰な結合は避ける）
- 既存 API の互換性を維持しながら段階的に移行
- テストは Read/Write それぞれで作成

---

## 参考リンク

- [CQRS Pattern - Azure Architecture Center | Microsoft Learn](https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs)
- [bliki: CQRS - Martin Fowler](https://www.martinfowler.com/bliki/CQRS.html)
- [Combining DDD, CQRS, and Clean Architecture in Go | Three Dots Labs](https://threedots.tech/post/ddd-cqrs-clean-architecture-combined/)
- [CQRS Explained - RisingStack Engineering](https://blog.risingstack.com/cqrs-explained-node-js-at-scale/)
- [Microservices Pattern: CQRS](https://microservices.io/patterns/data/cqrs.html)
- [A Brief Intro to Clean Architecture, Clean DDD, and CQRS | Medium](https://medium.com/software-alchemy/a-brief-intro-to-clean-architecture-clean-ddd-and-cqrs-23243c3f31b3)
- [CQRS | NestJS](https://docs.nestjs.com/recipes/cqrs)

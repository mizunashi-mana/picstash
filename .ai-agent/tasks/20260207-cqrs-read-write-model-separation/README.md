# CQRS Read/Write Model 分離

## 関連
- Issue: #173

## 目的・ゴール
`@picstash/core` パッケージで Read Model と Command Model（Entity）を分離し、CQRS パターンに沿った設計にする。

## 背景
- 現在 `@picstash/core/domain` の entity は読み取り/書き込みの両方で使用されている
- Read Model を分離することで、クエリに最適化された型を定義できる
- 先行調査: `.ai-agent/surveys/20260207-cqrs-query-command-model-separation/README.md`

## 実装方針

### アプローチ
調査結果に基づき、**レベル 1（同一 DB でモデル分離）** を採用：
- 単一 Repository で戻り値の型を分ける（Command → Entity、Query → Read Model）
- Image から段階的に導入

### 命名規則

| モデル種別 | 命名パターン | 例 |
|-----------|-------------|-----|
| **Command Model** | `{Name}Entity` | `ImageEntity`, `CollectionEntity`, `LabelEntity` |
| **Read Model** | 用途がわかる名前 | `ImageListItem`, `ImageDetail`, `CollectionDetail` |

### 対象と Read Model

**Image**:
- `ImageEntity` - 作成・更新・削除用
- `ImageListItem` - 一覧表示用（サムネイル、タイトル、description 等）
- `ImageDetail` - 詳細表示用（path を含む完全な情報）

**Collection**:
- `CollectionEntity` - 作成・更新・削除用
- `CollectionListItem` - 一覧表示用（画像数を含む、既存 CollectionWithCount を改名）
- `CollectionDetail` - 詳細表示用（画像一覧を含む、既存 CollectionWithImages を改名）

**Label**:
- `LabelEntity` - 作成・更新・削除用
- Read Model は不要（シンプルなので Entity をそのまま返す）

### ファイル構成

```
packages/core/src/domain/
├── image/
│   ├── ImageEntity.ts        ← Entity（Command 用、既存 Image.ts をリネーム）
│   ├── ImageListItem.ts      ← Read Model（一覧用、新規）
│   ├── ImageDetail.ts        ← Read Model（詳細用、新規）
│   └── index.ts
├── collection/
│   ├── CollectionEntity.ts   ← Entity（既存 Collection.ts をリネーム）
│   ├── CollectionListItem.ts ← Read Model（既存 CollectionWithCount を改名）
│   ├── CollectionDetail.ts   ← Read Model（既存 CollectionWithImages を改名）
│   └── index.ts
└── label/
    ├── LabelEntity.ts        ← Entity（既存 Label.ts をリネーム）
    └── index.ts
```

### Repository の変更

```typescript
// Command 操作 → Entity を返す
create(input: CreateImageInput): Promise<ImageEntity>;
updateById(id: string, input: UpdateImageInput): Promise<ImageEntity>;
deleteById(id: string): Promise<ImageEntity>;

// Query 操作 → Read Model を返す
findById(id: string): Promise<ImageDetail | null>;
findAllPaginated(options): Promise<PaginatedResult<ImageListItem>>;
```

## 完了条件
- [x] Image: Entity と Read Model を分離
  - [x] Image → ImageEntity にリネーム
  - [x] ImageListItem, ImageDetail を定義
  - [x] ImageRepository の戻り値を更新
- [x] Collection: Entity と Read Model を分離
  - [x] Collection → CollectionEntity にリネーム
  - [x] CollectionWithCount → CollectionListItem にリネーム
  - [x] CollectionWithImages → CollectionDetail にリネーム
  - [x] CollectionRepository の戻り値を更新
- [x] Label: Entity のみリネーム
  - [x] Label → LabelEntity にリネーム
  - [x] LabelRepository の戻り値を更新
- [x] 後方互換エイリアスを削除し、既存コードを新しい型名に移行
- [x] 型チェック・lint・テスト通過

## 作業ログ

### 2026-02-07
- Image ドメインの分離を実装
  - `ImageEntity.ts` 作成（Command Model）
  - `ImageListItem.ts` 作成（一覧表示用 Read Model）
  - `ImageDetail.ts` 作成（詳細表示用 Read Model）
  - `image-repository.ts` の戻り値の型を更新

- Collection ドメインの分離を実装
  - `CollectionEntity.ts` 作成（Command Model）
  - `CollectionListItem.ts` 作成（一覧表示用 Read Model）
  - `CollectionDetail.ts` 作成（詳細表示用 Read Model、CollectionImageInfo を含む）
  - `collection-repository.ts` の戻り値の型を更新

- Label ドメインの分離を実装
  - `LabelEntity.ts` 作成（Command Model）
  - `label-repository.ts` の戻り値の型を更新

- `ImageAttribute.ts` の import を `LabelEntity` に更新

- 後方互換エイリアスを削除
  - 既存コードをすべて新しい型名に更新
  - `Image` → `ImageEntity` / `ImageListItem` / `ImageDetail`
  - `Label` → `LabelEntity`
  - `Collection` → `CollectionEntity`
  - `CollectionWithCount` → `CollectionListItem`
  - `CollectionWithImages` → `CollectionDetail`

- Prisma Repository アダプターを更新
  - `prisma-image-repository.ts`
  - `prisma-collection-repository.ts`
  - `prisma-label-repository.ts`

- 全パッケージの型チェック・lint・テスト通過を確認

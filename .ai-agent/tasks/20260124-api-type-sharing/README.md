# client / server 間で API 型定義を共通化する

Issue: https://github.com/mizunashi-mana/picstash/issues/68

## 目的・ゴール

client パッケージと server パッケージで使用している API の型定義を共通化し、型安全性と開発効率を向上させる。

## 現状分析

### 型の重複状況

client と server で同じ型が別々に定義されている:

| API | client | server |
|-----|--------|--------|
| stats | `features/stats/api.ts` | `domain/stats/index.ts` |
| gallery | `features/gallery/api.ts` | `domain/image/index.ts` 等 |
| collections | `features/collections/api.ts` | `domain/collection/index.ts` |
| labels | `features/labels/api.ts` | `domain/label/index.ts` |
| 他多数... | | |

### 型の不整合例

- `PopularImage.lastViewedAt`: server は `Date | null`、client は `string | null`
- JSON シリアライズで Date は string になるため、client 側の型が正しい

## 実装方針

### 方針: @picstash/api パッケージに API 型定義を集約

1. **@picstash/api パッケージに API 型を定義**
   - `packages/api/src/` ディレクトリに各 API の型を定義
   - 各 API のリクエスト/レスポンス型を Zod スキーマで定義
   - JSON シリアライズ後の型（Date → string）を使用
   - エンドポイント URL を共有して URL 不整合を防止

2. **server 側の対応**
   - API レスポンス型は @picstash/api から import
   - エンドポイント URL は `statsEndpoints.routes` を使用
   - 適切な型変換（Date → ISO 文字列）

3. **client 側の対応**
   - API 型は @picstash/api から import
   - エンドポイント URL は `imageEndpoints` 等を使用
   - 重複定義を削除

### 段階的な移行

1. まず stats API から開始（型数が少なく、検証しやすい）
2. 成功したら他の API に展開

## 完了条件

- [x] @picstash/api パッケージに API 型定義を追加
- [x] stats API の型を共通化
- [x] client と server が @picstash/api の型を使用
- [x] 型チェックが通る
- [x] テストが通る

## 作業ログ

### 2026-01-24

1. `packages/shared` を `packages/api` (`@picstash/api`) にリネーム
2. 以下のエンドポイント定義と型を追加:
   - `images.ts`: `imageEndpoints` (サムネイル、ファイル、詳細等の URL)
   - `stats.ts`: `statsEndpoints` + Zod スキーマ (OverviewStats, DailyViewStats 等)
   - `labels.ts`: `labelsEndpoints` + Zod スキーマ
   - `image-attributes.ts`: `imageAttributeEndpoints` + Zod スキーマ

3. **client 側の対応**:
   - ハードコードされた `/api/images/...` URL を `imageEndpoints` に置き換え
   - stats/labels の型を `@picstash/api` から import

4. **server 側の対応**:
   - `stats-controller.ts`: `statsEndpoints.routes` を使用
   - `domain/stats/index.ts`: `@picstash/api` から型を re-export
   - `stats-repository.ts`: `@picstash/api` から型を import
   - `prisma-stats-repository.ts`: `lastViewedAt` を ISO 文字列に変換

5. 検証:
   - Typecheck: 全パッケージ合格
   - Unit Tests: 265 テスト合格
   - E2E Tests: 10 テスト合格

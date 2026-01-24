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

### 方針: shared パッケージに API 型定義を集約

1. **shared パッケージに API 型を定義**
   - `packages/shared/src/api/` ディレクトリを作成
   - 各 API のリクエスト/レスポンス型を定義
   - JSON シリアライズ後の型（Date → string）を使用

2. **server 側の対応**
   - ドメイン型（Date を使用）はそのまま維持
   - API レスポンス型は shared から import
   - シリアライズ時に型変換

3. **client 側の対応**
   - API 型は shared から import
   - 重複定義を削除

### 段階的な移行

1. まず stats API から開始（型数が少なく、検証しやすい）
2. 成功したら他の API に展開

## 完了条件

- [ ] shared パッケージに API 型定義を追加
- [ ] stats API の型を共通化
- [ ] client と server が shared の型を使用
- [ ] 型チェックが通る
- [ ] テストが通る

## 作業ログ

（作業中に記録）

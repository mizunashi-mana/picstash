# 7-2: 複数条件検索

## 目的・ゴール

AND/OR で複数の検索ワードを組み合わせて画像を検索できるようにする。

ユーザーが以下を体験できるようにする：
- スペース区切りで AND 検索（例: `風景 海` → 風景 AND 海）
- `|` で OR 検索（例: `風景 | 山` → 風景 OR 山）
- 組み合わせ検索（例: `風景 海 | 山 川` → (風景 AND 海) OR (山 AND 川)）

## 実装方針

### バックエンド

1. **検索クエリパーサーの実装**
   - `packages/server/src/application/search/query-parser.ts`
   - クエリ文字列を解析して構造化された条件に変換
   - 構文:
     - スペース区切り = AND
     - `|` = OR
     - OR で区切った各グループ内はスペースで AND

2. **検索条件の型定義**
   ```typescript
   type SearchTerm = string;
   type AndGroup = SearchTerm[];  // AND で結合
   type SearchQuery = AndGroup[]; // OR で結合
   ```

3. **ImageRepository.search の拡張**
   - パーサーから得た条件を Prisma の WHERE 句に変換
   - OR 条件の各グループを AND でマッチし、グループ間は OR

### フロントエンド

1. **SearchBar の入力サポート**
   - 既存の Autocomplete はそのまま使用
   - 補完候補選択時は既存の検索語に追加

2. **UI 改善（オプション）**
   - 検索構文のヘルプを表示
   - 検索タグのビジュアル化

## 完了条件

- [x] クエリパーサーが AND/OR を正しく解析する
- [x] 複数条件検索 API が動作する（curl で確認）
- [x] フロントエンドから複数条件検索が使える
- [x] ESLint エラーがない
- [x] TypeScript 型エラーがない

## 作業ログ

### 2026-01-17

1. **クエリパーサーの実装**
   - `packages/server/src/application/search/query-parser.ts` を作成
   - スペース区切り = AND、`|` = OR の構文をサポート
   - 例: `風景 海 | 山 川` → (風景 AND 海) OR (山 AND 川)

2. **ImageRepository.search の拡張**
   - `PrismaImageRepository.search` を複数条件対応に更新
   - パーサーから得た条件を Prisma の WHERE 句に変換
   - filename, description, keywords, label.name を検索対象

3. **動作確認**
   - curl で AND/OR 検索の動作確認 OK
   - フロントエンド（ブラウザ）での動作確認 OK
   - ESLint チェック OK
   - TypeScript 型チェック OK

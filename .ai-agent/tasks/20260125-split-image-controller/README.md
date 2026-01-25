# ImageController 分解

## 関連 Issue

- https://github.com/mizunashi-mana/picstash/issues/113

## 目的・ゴール

ImageController（469行）が肥大化しているため、責務を分離して複数のコントローラーに分解する。
認知負荷を削減し、保守性を向上させる。

## 現状分析

ImageController には以下の 11 エンドポイントが含まれている：

| # | エンドポイント | 責務 |
|---|---------------|------|
| 1 | `POST /api/images` | 画像アップロード |
| 2 | `GET /api/images` | 画像一覧/検索 |
| 3 | `GET /api/images/:id` | 画像詳細取得 |
| 4 | `GET /api/images/:id/file` | 画像ファイル取得 |
| 5 | `GET /api/images/:id/thumbnail` | サムネイル取得 |
| 6 | `PATCH /api/images/:id` | 画像更新 |
| 7 | `GET /api/images/:id/suggested-attributes` | 属性推薦取得 |
| 8 | `POST /api/images/:id/generate-description` | 説明文生成 |
| 9 | `GET /api/images/duplicates` | 重複検出 |
| 10 | `GET /api/images/:id/similar` | 類似画像検索 |
| 11 | `DELETE /api/images/:id` | 画像削除 |

## 実装方針

責務に基づき、以下の 3 つのコントローラーに分解する：

### 1. ImageController（コア CRUD）
基本的な画像管理機能を担当：
- `POST /api/images` - アップロード
- `GET /api/images` - 一覧/検索
- `GET /api/images/:id` - 詳細取得
- `GET /api/images/:id/file` - ファイル取得
- `GET /api/images/:id/thumbnail` - サムネイル取得
- `PATCH /api/images/:id` - 更新
- `DELETE /api/images/:id` - 削除

### 2. ImageSuggestionController（AI 推薦）
AI ベースの推薦機能を担当：
- `GET /api/images/:id/suggested-attributes` - 属性推薦
- `POST /api/images/:id/generate-description` - 説明文生成

### 3. ImageSimilarityController（類似画像）
画像の類似性・重複検出を担当：
- `GET /api/images/duplicates` - 重複検出
- `GET /api/images/:id/similar` - 類似画像検索

## 完了条件

- [x] ImageSuggestionController を作成
- [x] ImageSimilarityController を作成
- [x] ImageController から対応するエンドポイントを移動
- [x] DI コンテナに新しいコントローラーを登録
- [x] 既存のテストがパスする
- [x] 型チェック・lint がパスする

## 作業ログ

### 2026-01-25

**実装完了**

1. `ImageSuggestionController` を作成（120行）
   - `/api/images/:id/suggested-attributes` - 属性推薦
   - `/api/images/:id/generate-description` - 説明文生成

2. `ImageSimilarityController` を作成（133行）
   - `/api/images/duplicates` - 重複検出
   - `/api/images/:id/similar` - 類似画像検索

3. `ImageController` を整理（249行、元は469行）
   - 基本的な CRUD 操作のみに集中
   - 不要な依存関係を削除（LabelRepository, ImageAttributeRepository, JobQueue）

4. DI コンテナに新しいコントローラーを登録
   - `types.ts`: TYPES に追加
   - `container.ts`: バインディング追加
   - `app-container.ts`: getter メソッド追加
   - `routes/index.ts`: ルート登録追加

5. `index.ts` に新しいコントローラーをエクスポート

**結果**
- 型チェック: パス
- lint: パス
- テスト: 全242テストパス

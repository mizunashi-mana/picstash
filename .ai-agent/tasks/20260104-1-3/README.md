# タスク 1-3: サムネイル生成

## 目的・ゴール

ギャラリー表示を高速化するため、画像のサムネイルを生成する。オリジナル画像ではなくサムネイルを表示することで、ページ読み込み速度を向上させる。

## 現状

- **ストレージ**: `storage/originals/` にオリジナル画像を保存
- **DB スキーマ**: Image モデルに width/height フィールドあり（未使用）
- **ギャラリー**: オリジナル画像を直接表示中

## 実装方針

### 1. 画像処理ライブラリの追加
- `sharp` を使用（高速・軽量な画像処理ライブラリ）
- サムネイルサイズ: 300x300（アスペクト比維持、cover で切り抜き）

### 2. DB スキーマ更新
- Image モデルに `thumbnailPath` フィールドを追加

### 3. サムネイル生成ロジック
- アップロード時にサムネイルを自動生成
- `storage/thumbnails/` に保存
- オリジナル画像の width/height も取得して保存

### 4. サムネイル配信 API
- `GET /api/images/:id/thumbnail` を追加

### 5. ギャラリー更新
- ギャラリーでサムネイル URL を使用するように変更

## 完了条件

- [x] アップロード時にサムネイルが自動生成される
- [x] サムネイルが `storage/thumbnails/` に保存される
- [x] サムネイル配信 API が動作する
- [x] ギャラリーがサムネイルを表示する
- [x] オリジナル画像の width/height が DB に保存される
- [x] lint・typecheck がパスする

## 作業ログ

### 2026-01-04

1. **sharp ライブラリをインストール**
   - `npm install sharp -w @picstash/server`

2. **DB スキーマ更新**
   - `thumbnailPath` フィールドを Image モデルに追加
   - マイグレーション実行 (`add_thumbnail_path`)

3. **サムネイル生成ロジック実装**
   - `packages/server/src/infra/storage/image-processor.ts` を作成
   - `getImageMetadata()` - 画像の width/height を取得
   - `generateThumbnail()` - 300x300 の JPEG サムネイルを生成

4. **アップロード処理更新**
   - `images.ts` にサムネイル生成を統合
   - アップロード時に自動でサムネイル生成・メタデータ取得

5. **サムネイル配信 API 追加**
   - `GET /api/images/:id/thumbnail` を実装
   - サムネイルがない場合はオリジナルにフォールバック

6. **ギャラリー更新**
   - `getThumbnailUrl()` 関数を追加
   - ギャラリーでサムネイル URL を使用

7. **動作確認**
   - 新規アップロードでサムネイル生成を確認
   - ギャラリーでサムネイル表示を確認
   - lint・typecheck パス

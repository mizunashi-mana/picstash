# タスク 4-4: 類似画像検出

## 目的・ゴール

画像の埋め込みベクトルを使用して類似画像を検出・表示する機能を実装する。ユーザーが特定の画像を見ているときに、似た画像を発見できるようにする。

## 提供価値

- 似た画像をまとめて見れる
- 関連コンテンツの発見が容易になる
- ライブラリ内の画像の関連性を把握できる

## 実装方針

### 技術アプローチ

既存の sqlite-vec による kNN 検索機能を活用。`EmbeddingRepository.findSimilar()` メソッドが既に実装済み。

### バックエンド

1. **API エンドポイント**
   - `GET /api/images/:id/similar` - 類似画像を取得
   - クエリパラメータ: `limit` (デフォルト: 10)
   - 現在の画像を結果から除外

2. **レスポンス形式**
   ```typescript
   {
     imageId: string;
     similarImages: {
       id: string;
       filename: string;
       thumbnailPath: string;
       distance: number;  // 0に近いほど類似
     }[];
   }
   ```

### フロントエンド

1. **画像詳細画面に「類似画像」セクション追加**
   - サムネイルグリッドで表示
   - クリックで詳細画面に遷移
   - 類似度スコア（距離）を表示

2. **UI コンポーネント**
   - `SimilarImagesSection` - 類似画像セクション
   - `SimilarImageGrid` - サムネイルグリッド

## 完了条件

- [x] 画像 ID を指定して類似画像リストを取得できる API がある
- [x] 埋め込みがない画像に対しては適切なエラーを返す
- [x] 画像詳細画面に類似画像セクションが表示される
- [x] 類似画像をクリックすると詳細画面に遷移できる
- [x] テストが通る

## 作業ログ

### 2026-01-16

1. **API エンドポイント実装**
   - `GET /api/images/:id/similar` を追加
   - 既存の `EmbeddingRepository.findSimilar()` を活用
   - `Uint8Array` から `Float32Array` への変換処理を実装

2. **フロントエンド実装**
   - `fetchSimilarImages` API クライアント追加
   - `SimilarImagesSection` / `SimilarImagesSectionView` コンポーネント作成
   - 類似度をパーセンテージで表示（距離からの変換）
   - 画像詳細画面に類似画像セクションを追加

3. **動作確認**
   - curl で API 動作確認
   - ブラウザで UI 動作確認
   - 類似画像クリックで詳細画面への遷移確認
   - 全 129 テストがパス

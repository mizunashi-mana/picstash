# タスク 4-2: 自動属性推薦

## 目的・ゴール

画像の内容に基づいて、適切な属性ラベルを自動推薦する機能を実装する。ユーザーが手動で属性を付ける手間を削減し、ライブラリの整理を効率化する。

## 提供価値

- 画像アップロード時に属性ラベルの候補が自動表示される
- 手動で属性を探す必要がなくなる
- 新しい画像に適切なラベルを素早く付けられる

## 実装方針

### 技術アプローチ

CLIP (Contrastive Language-Image Pre-Training) を使用して画像とテキストを同じベクトル空間に埋め込み、類似度計算で推薦を行う。

1. **テキスト埋め込み生成**
   - 既存の CLIP サービスにテキスト埋め込み機能を追加
   - CLIPTextModelWithProjection を使用
   - ラベル名とキーワードからテキストを構築

2. **推薦ロジック**
   - 画像の埋め込みベクトルと各ラベルのテキスト埋め込みのコサイン類似度を計算
   - 類似度が閾値以上のラベルを推薦候補として返す
   - 類似度スコアと共に返し、UI で確信度として表示

3. **ラベルテキスト埋め込みのキャッシュ**
   - ラベル作成/更新時にテキスト埋め込みを生成・保存
   - Label テーブルに embedding カラムを追加

### 実装範囲

1. **バックエンド**
   - CLIP テキスト埋め込み機能の追加
   - Label にテキスト埋め込み保存機能
   - 属性推薦 API エンドポイント（`GET /api/images/:id/suggested-attributes`）
   - 既存ラベルの埋め込み一括生成 CLI

2. **フロントエンド**
   - 画像詳細画面に「推薦属性」セクション追加
   - 推薦ラベルをクリックで簡単に追加できる UI

## 完了条件

- [ ] 画像 ID を指定して推薦ラベルを取得できる API がある
- [ ] 推薦結果に類似度スコアが含まれる
- [ ] フロントエンドで推薦ラベルが表示される
- [ ] 推薦ラベルをワンクリックで追加できる
- [ ] 既存ラベルの埋め込みを一括生成できる CLI がある
- [ ] テストが通る

## 技術調査メモ

### CLIP テキストモデル

```typescript
import { CLIPTextModelWithProjection, AutoTokenizer } from '@huggingface/transformers';

// テキストのトークナイズと埋め込み生成
const tokenizer = await AutoTokenizer.from_pretrained('Xenova/clip-vit-base-patch16');
const textModel = await CLIPTextModelWithProjection.from_pretrained('Xenova/clip-vit-base-patch16');

const inputs = tokenizer(text);
const output = await textModel(inputs);
// output.text_embeds.data が Float32Array で返る
```

### コサイン類似度

正規化済みベクトル同士の内積 = コサイン類似度

```typescript
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}
```

## 作業ログ

<!-- 作業の進捗をここに記録 -->


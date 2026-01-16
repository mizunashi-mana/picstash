# タスク 4-3: 自動説明生成

## 目的・ゴール

画像の内容を AI で解析し、自動的に説明文（キャプション）を生成する機能を実装する。ユーザーが手動で説明を書く手間を削減し、画像の内容把握を効率化する。

## 提供価値

- 画像の内容を自動でテキスト化できる
- 手動で説明を書く必要がなくなる
- 検索時に説明文でヒットするようになる

## 実装方針

### 技術アプローチ

Transformers.js の `image-to-text` パイプラインを使用して、画像からキャプションを生成する。

1. **モデル選定**
   - キャプション: `Xenova/vit-gpt2-image-captioning` (ViT + GPT-2)
   - 翻訳: `Xenova/nllb-200-distilled-600M` (英語→日本語)
   - Transformers.js で Node.js 上で実行可能

2. **サービス実装**
   - 既存の `EmbeddingService` と同様に `CaptionService` を実装
   - ONNX モデルをローカルで実行
   - モデルの遅延初期化（初回呼び出し時にロード）

3. **API エンドポイント**
   - `POST /api/images/:id/generate-description` - 説明を生成
   - 生成結果を返すが、自動保存はしない（ユーザーが確認後に保存）

4. **フロントエンド**
   - 画像詳細画面の説明セクションに「AI で生成」ボタンを追加
   - クリックで説明を生成し、編集フィールドにセット
   - ユーザーが確認・編集後に保存

### 実装範囲

1. **バックエンド**
   - `CaptionService` インターフェース（`application/ports/`）
   - `TransformersCaptionService` 実装（`infra/caption/`）
   - API エンドポイント追加

2. **フロントエンド**
   - 説明セクションに「AI で生成」ボタン追加
   - 生成中のローディング表示
   - 生成結果のプレビュー

## 完了条件

- [x] 画像 ID を指定して説明を生成できる API がある
- [x] 生成結果が日本語のキャプションとして返される（英語→日本語翻訳）
- [x] フロントエンドで「AI で生成」ボタンが表示される
- [x] ボタンクリックで説明が生成され、編集フィールドにセットされる
- [x] テストが通る

## 技術調査メモ

### Transformers.js image-to-text

```typescript
import { pipeline } from '@huggingface/transformers';

// パイプラインの初期化
const captioner = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning');

// 画像からキャプション生成
const result = await captioner(imageUrl);
// [{ generated_text: 'a cat sitting on a couch' }]
```

### 参考資料

- [Transformers.js Pipeline API](https://huggingface.co/docs/transformers.js/en/pipelines)
- [Xenova/vit-gpt2-image-captioning](https://huggingface.co/Xenova/vit-gpt2-image-captioning)

## 作業ログ

### 2026-01-16

1. **CaptionService 実装**
   - `application/ports/caption-service.ts` にインターフェース定義
   - `infra/caption/transformers-caption-service.ts` に実装
   - ViT-GPT2 で英語キャプション生成 → NLLB-200 で日本語翻訳

2. **API エンドポイント追加**
   - `POST /api/images/:id/generate-description`
   - 画像ファイルを読み込み、キャプション生成・翻訳して返却

3. **フロントエンド実装**
   - `ImageDescriptionSectionView` に「AI で生成」ボタン追加
   - `ImageDescriptionSection` に `generateMutation` 追加
   - Storybook ストーリー追加

4. **動作確認**
   - curl でAPI動作確認
   - ブラウザでUI動作確認
   - 日本語キャプション「赤と白の火水栓の赤と白の写真」が正常に生成


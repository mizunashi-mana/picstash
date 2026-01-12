# 画像埋め込みベクトル生成 技術選定レポート

## 概要

本レポートでは、画像埋め込みベクトル生成のための技術選択肢を調査・比較する。

---

## 1. JavaScript ランタイムでの埋め込み生成

### 1.1 Transformers.js (@huggingface/transformers)

**概要**
- HuggingFace の Transformers を JavaScript で実行できるライブラリ
- ONNX Runtime ベースで動作
- ブラウザ・Node.js・Deno・Bun で動作

**バージョン情報**
- v3 で `@huggingface/transformers` として公式リリース
- 旧 `@xenova/transformers` は v1/v2 用（非推奨）

**主な特徴**
- Python 不要で完結
- WebGPU サポート（v3）で高速化
- 多数の事前学習モデルが利用可能

**CLIP 使用例**
```javascript
import { AutoProcessor, CLIPVisionModelWithProjection, RawImage } from '@huggingface/transformers';

const processor = await AutoProcessor.from_pretrained('Xenova/clip-vit-base-patch16');
const model = await CLIPVisionModelWithProjection.from_pretrained('Xenova/clip-vit-base-patch16');

const image = await RawImage.read('image.jpg');
const inputs = await processor(image);
const { image_embeds } = await model(inputs);
// image_embeds: 512次元ベクトル
```

**メリット**
- 外部サービス不要、ローカルで完結
- MIT ライセンス
- 多くのモデル形式をサポート
- アクティブに開発中

**デメリット**
- 初回のモデルダウンロードに時間がかかる（数百MB）
- GPU なしでは推論が遅い
- メモリ使用量が大きい

**参考リンク**
- [GitHub: huggingface/transformers.js](https://github.com/huggingface/transformers.js)
- [NPM: @huggingface/transformers](https://www.npmjs.com/package/@huggingface/transformers)
- [Transformers.js v3 ブログ](https://huggingface.co/blog/transformersjs-v3)

---

### 1.2 openai-clip-js

**概要**
- OpenAI CLIP を ONNX Web Runtime で動作させるポート
- ブラウザ・Node.js 対応

**特徴**
- 量子化モデル対応（87MB vs 345MB）
- シンプルな API

**参考リンク**
- [GitHub: josephrocca/openai-clip-js](https://github.com/josephrocca/openai-clip-js)

---

## 2. 埋め込みモデルの比較

### 2.1 CLIP (Contrastive Language-Image Pre-Training)

| 項目 | 値 |
|------|-----|
| 開発元 | OpenAI |
| 次元数 | 512 (ViT-B/16) |
| 特徴 | テキストと画像を同一ベクトル空間に埋め込み |
| 用途 | 画像検索、ゼロショット分類、マルチモーダル検索 |

**強み**
- テキストとの類似度計算が可能（自動タグ推薦に最適）
- ゼロショット分類が可能
- 広く使われており実績豊富

**弱み**
- 細粒度の視覚的特徴の捉えは DINOv2 に劣る
- 複雑なシーンでは誤認識することがある

**精度目安**（分類タスク）
- Food-101: 88%
- 細粒度種分類（10,000クラス）: 15%

---

### 2.2 Jina CLIP v2

| 項目 | 値 |
|------|-----|
| 開発元 | Jina AI |
| 次元数 | 1024（64〜1024で調整可能） |
| 特徴 | 多言語対応（89言語）、高解像度入力（512x512） |
| ライセンス | CC BY-NC 4.0（商用は API 経由） |

**強み**
- CLIP v1 より 3% 性能向上
- Matryoshka Representations（次元数調整可能）
- 多言語テキストとの類似度計算

**弱み**
- 非商用ライセンス（商用は API 利用が必要）
- モデルサイズが大きい（865M パラメータ）

**Transformers.js での利用**
```javascript
// npm install xenova/transformers.js#v3 が必要
import { AutoModel, AutoProcessor } from '@huggingface/transformers';
const model = await AutoModel.from_pretrained('jinaai/jina-clip-v2');
```

**参考リンク**
- [HuggingFace: jinaai/jina-clip-v2](https://huggingface.co/jinaai/jina-clip-v2)
- [Jina CLIP v2 公式](https://jina.ai/models/jina-clip-v2/)

---

### 2.3 DINOv2

| 項目 | 値 |
|------|-----|
| 開発元 | Meta AI |
| 次元数 | 768 (ViT-B/14) |
| 特徴 | 自己教師あり学習、高い視覚的特徴抽出能力 |
| ライセンス | Apache 2.0 |

**強み**
- 細粒度分類で最高性能（70% vs CLIP 15%）
- ファインチューニング不要で高精度
- 視覚的に類似したカテゴリの識別に優れる

**弱み**
- テキストとの直接的な類似度計算ができない
- CLIP より計算コストが高い

**精度目安**（分類タスク）
- Food-101: 93%
- 細粒度種分類（10,000クラス）: 70%

**参考リンク**
- [voxel51: Finding the Best Embedding Model](https://voxel51.com/blog/finding-the-best-embedding-model-for-image-classification)

---

### 2.4 ResNet / EfficientNet

| モデル | 次元数 | 特徴 |
|--------|--------|------|
| ResNet-18 | 512 | 軽量・高速、リソース制約環境向け |
| EfficientNetV2 | 1280 | バランス良好、ファインチューニング効率的 |

**強み**
- 軽量で高速
- リソース制約環境に適している
- 広く使われており実績豊富

**弱み**
- 精度は CLIP/DINOv2 に劣る
- セマンティックな理解が弱い

**精度目安**
- Food-101: ResNet-18 65%, EfficientNet ~80%

---

## 3. 外部 API サービス

### 3.1 OpenAI Embeddings API

| 項目 | 値 |
|------|-----|
| モデル | text-embedding-3-small/large |
| 次元数 | 1536 / 3072 |
| 価格 | $0.02 / 1M tokens |

**注意**: 画像埋め込みは直接サポートされていない（テキストのみ）

### 3.2 Google Multimodal Embeddings

| 項目 | 値 |
|------|-----|
| 次元数 | 1408 |
| 特徴 | 画像・テキスト両対応 |

### 3.3 Cohere Embed v4

| 項目 | 値 |
|------|-----|
| 次元数 | 1536 |
| 特徴 | マルチモーダル（テキスト・画像・混合ドキュメント） |

### 3.4 Jina Embeddings API

| 項目 | 値 |
|------|-----|
| モデル | jina-clip-v2 |
| 次元数 | 1024 |
| 価格 | 無料枠あり |

**参考リンク**
- [Eden AI: Best Image Embeddings](https://www.edenai.co/post/best-image-embeddings)
- [Eden AI: Best Embedding APIs](https://www.edenai.co/post/best-embedding-apis)

---

## 4. ベクトルストレージ

### 4.1 sqlite-vec

**概要**
- SQLite 拡張としてベクトル検索を実現
- 純粋な C で実装、依存関係なし
- MIT/Apache-2.0 デュアルライセンス

**better-sqlite3 との統合**
```javascript
import * as sqliteVec from "sqlite-vec";
import Database from "better-sqlite3";

const db = new Database(":memory:");
sqliteVec.load(db);

// ベクトルテーブル作成
db.exec(`
  CREATE VIRTUAL TABLE vec_images USING vec0(
    image_id INTEGER PRIMARY KEY,
    embedding FLOAT[512]
  )
`);

// ベクトル挿入
const embedding = new Float32Array([0.1, 0.2, ...]);
db.prepare('INSERT INTO vec_images VALUES (?, ?)').run(1, embedding.buffer);

// 類似検索（kNN）
db.prepare(`
  SELECT image_id, distance
  FROM vec_images
  WHERE embedding MATCH ?
  ORDER BY distance
  LIMIT 10
`).all(queryEmbedding.buffer);
```

**特徴**
- ブルートフォース検索（小〜中規模データ向け）
- 数千〜数十万ベクトルで高速動作
- SQLite のトランザクション・バックアップと統合

**参考リンク**
- [GitHub: asg017/sqlite-vec](https://github.com/asg017/sqlite-vec)
- [sqlite-vec Node.js ドキュメント](https://alexgarcia.xyz/sqlite-vec/js.html)
- [DEV: Vector Database with SQLite in Node.js](https://dev.to/sfundomhlungu/how-to-build-a-vector-database-with-sqlite-in-nodejs-1epd)

---

## 5. 推奨構成

### Picstash 向け推奨

| 項目 | 推奨 | 理由 |
|------|------|------|
| 埋め込みモデル | **CLIP (via @huggingface/transformers)** | テキストとの類似度計算が可能、自動タグ推薦に最適 |
| モデル | `Xenova/clip-vit-base-patch16` | 512次元、バランス良好 |
| ベクトルストレージ | **sqlite-vec** | 既存 SQLite と統合、軽量 |

### 代替案

| シナリオ | 推奨 |
|----------|------|
| 高精度な類似画像検索が必要 | DINOv2 |
| 多言語対応が必要 | Jina CLIP v2 |
| リソース制約が厳しい | ResNet-18 |
| 運用負荷を下げたい | Jina Embeddings API |

---

## 6. 性能比較まとめ

| モデル | 次元数 | 精度（Food-101） | テキスト類似度 | JS対応 | ライセンス |
|--------|--------|------------------|----------------|--------|------------|
| CLIP ViT-B/16 | 512 | 88% | ✅ | ✅ | MIT |
| Jina CLIP v2 | 1024 | 90%+ | ✅ | ✅ | CC BY-NC |
| DINOv2 ViT-B/14 | 768 | 93% | ❌ | ✅ | Apache 2.0 |
| ResNet-18 | 512 | 65% | ❌ | ✅ | Apache 2.0 |
| EfficientNetV2 | 1280 | ~80% | ❌ | ✅ | Apache 2.0 |

---

## 7. 参考リンク

- [NPM: @huggingface/transformers](https://www.npmjs.com/package/@huggingface/transformers)
- [GitHub: huggingface/transformers.js](https://github.com/huggingface/transformers.js)
- [Transformers.js v3 Blog](https://huggingface.co/blog/transformersjs-v3)
- [GitHub: asg017/sqlite-vec](https://github.com/asg017/sqlite-vec)
- [HuggingFace: jinaai/jina-clip-v2](https://huggingface.co/jinaai/jina-clip-v2)
- [voxel51: Finding the Best Embedding Model](https://voxel51.com/blog/finding-the-best-embedding-model-for-image-classification)
- [Eden AI: Best Image Embeddings](https://www.edenai.co/post/best-image-embeddings)
- [TigerData: Image Search with CLIP](https://www.tigerdata.com/blog/how-to-build-an-image-search-application-with-openai-clip-postgresql-in-javascript)

# 説明文生成の精度を上げる

## 目的・ゴール

画像の説明文自動生成の精度を向上させる。現在は `vit-gpt2-image-captioning` + `nllb-200-distilled-600M` の組み合わせで実装されているが、より詳細な説明文を生成できるモデルに変更する。

## 背景

- 現在のモデル: `Xenova/vit-gpt2-image-captioning` → 一般写真向け、短い説明文
- 生成される説明が短く、詳細さに欠ける
- より詳細で正確な説明文が必要

## 実装方針

**Florence-2** モデルへの移行を選択:
- `onnx-community/Florence-2-base-ft` - Microsoft の高性能ビジョン言語モデル
- `<MORE_DETAILED_CAPTION>` タスクで詳細な説明文を生成
- NLLB-200 での日本語翻訳は継続使用

### 理由

1. Transformers.js で利用可能（ONNX 変換済み）
2. 詳細なキャプション生成が可能
3. MIT ライセンス
4. vit-gpt2 より高い表現力

## 完了条件

- [x] より詳細な説明文が生成される
- [x] 既存のAPIインターフェース（`POST /api/images/:id/generate-description`）と互換性を維持
- [x] 型チェック・リントが通る

## 作業ログ

### 2026-01-17

- タスク開始
- 現在の実装を確認
- 利用可能なモデルを調査:
  - Florence-2: Transformers.js 対応、詳細キャプション
  - JoyCaption: アニメ特化だが ONNX 未対応、17GB+ VRAM 必要
  - BLIP: ONNX 変換が必要
- Florence-2 を採用
- `TransformersCaptionService` を Florence-2 対応に更新
  - `onnx-community/Florence-2-base-ft` モデルを使用
  - `<MORE_DETAILED_CAPTION>` タスクで詳細説明文を生成
  - NLLB-200 翻訳は維持
- 動作確認完了
  - 初回: 約24秒（モデルロード込み）
  - 2回目以降: 約4秒（キャッシュ済み）
  - 生成例: 「図面は黒い境界を持つ四角形です. 四角形は小さな四角形で構成されています...」

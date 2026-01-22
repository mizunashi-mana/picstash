# OCR での読み取りにより、セリフ付き画像の説明文生成の精度を上げる

## 目的・ゴール

イラスト・漫画画像に含まれるセリフや吹き出しのテキストを OCR で読み取り、説明文生成の精度を向上させる。

## 現状の問題

- Florence-2 モデルによる画像キャプション生成は視覚的な要素の説明に優れているが、画像内のテキスト（セリフ、タイトル、説明文など）を正確に読み取れないことがある
- 特に日本語のセリフを含む漫画・イラストで、キャラクターの発言内容が説明文に反映されない

## 実装方針

### 方式選定

**採用: Tesseract.js**
- Node.js で動作する純粋な JavaScript OCR ライブラリ
- 日本語を含む 100+ 言語をサポート
- WebAssembly ベースで追加のバイナリインストール不要
- 成熟したライブラリで信頼性が高い

**検討したが不採用:**
- TrOCR (transformers.js): transformers.js での OCR サポートは限定的。Donut モデルは遅く品質も不十分
- GOT-OCR2: 2025年1月に追加された新しいモデルだが、transformers.js での対応状況が不明

### アーキテクチャ

```
画像入力
    ↓
┌──────────────────┐
│  Tesseract.js   │ ──→ OCR テキスト抽出
└──────────────────┘
    ↓
┌──────────────────┐
│   Florence-2    │ ──→ 画像キャプション生成
└──────────────────┘
    ↓
┌──────────────────┐
│  Ollama (LLM)   │ ──→ OCR テキスト + キャプション + 類似画像説明 を統合
└──────────────────┘
    ↓
最終説明文
```

### 変更対象

1. **新規: `OcrService` インターフェース** (`application/ports/ocr-service.ts`)
   - `extractText(imagePath: string): Promise<OcrResult>`

2. **新規: `TesseractOcrService`** (`infra/ocr/tesseract-ocr-service.ts`)
   - Tesseract.js を使用した OCR 実装
   - 日本語 + 英語の認識

3. **変更: `CaptionService`** (`application/ports/caption-service.ts`)
   - `CaptionContext` に `ocrText?: string` フィールドを追加

4. **変更: `TransformersCaptionService`**
   - OCR テキストを LLM プロンプトに含める
   - システムプロンプトを更新して OCR テキストの活用を指示

5. **変更: `caption-worker.ts`** (`infra/workers/caption-worker.ts`)
   - 説明文生成前に OCR を実行
   - OCR 結果を `CaptionContext` に渡す

6. **変更: DI コンテナ** (`infra/di/`)
   - `OcrService` の登録

## 完了条件

- [x] `tesseract.js` パッケージをインストール
- [x] `OcrService` インターフェースを作成
- [x] `TesseractOcrService` を実装（日本語 + 英語対応）
- [x] `CaptionContext` に `ocrText` を追加
- [x] `TransformersCaptionService` を更新して OCR テキストを活用
- [x] `caption-worker.ts` で OCR を実行
- [x] DI コンテナに `OcrService` を登録
- [x] 型チェック（`npm run typecheck`）がパス
- [x] リンターチェック（`npm run lint`）がパス
- [x] テキスト入り画像で動作確認

## 作業ログ

### 2026-01-22

1. `tesseract.js` パッケージを server にインストール
2. `OcrService` インターフェースを作成 (`application/ports/ocr-service.ts`)
   - `extractText()`, `extractTextFromBuffer()`, `isReady()`, `initialize()`, `terminate()` メソッド定義
3. `TesseractOcrService` を実装 (`infra/ocr/tesseract-ocr-service.ts`)
   - 日本語 + 英語 (`jpn+eng`) 対応
   - 低信頼度（30%未満）の結果をフィルタリング
   - テキストのクリーンアップ処理を実装
4. `CaptionContext` に `ocrText?: string` フィールドを追加
5. `TransformersCaptionService` を更新
   - システムプロンプトに OCR テキストの活用指示を追加
   - プロンプトに OCR テキストセクションを追加
   - OCR テキストのみでも LLM 処理を行うよう条件を変更
6. `caption-worker.ts` を更新
   - OCR 処理を追加（オプショナル、失敗時は続行）
   - `ocrText` を `CaptionContext` に渡す
   - 進捗バーの更新
7. DI コンテナを更新
   - `types.ts` に `OcrService` シンボルを追加
   - `container.ts` に `TesseractOcrService` をバインド
   - `app-container.ts` に `getOcrService()` を追加
   - `index.ts` で `createCaptionJobHandler` に `ocrService` を渡す
8. `structure.md` に `ocr/` ディレクトリを追加
9. 型チェック・リンターチェックがパス
10. 動作確認完了
    - テスト画像（日本語テキスト入り）をアップロード
    - OCR で日本語テキストを正確に抽出（信頼度 91%）
    - LLM が OCR テキストを活用して説明文を生成
    - 「天気」「散歩」などのキーワードが説明文に反映されることを確認

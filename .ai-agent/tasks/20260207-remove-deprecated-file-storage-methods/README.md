# FileStorage deprecated メソッド削除

## 目的

`FileStorage` インターフェースから deprecated メソッドを削除し、技術的負債を解消する。

## 対象メソッド

| メソッド | 代替 API | 使用箇所 |
|---------|---------|----------|
| `saveOriginalFromStream` | `saveFile` | テストコードのみ（mock 定義） |
| `getAbsolutePath` | `readFile` / `readFileAsStream` | `caption-worker.ts` + テストコードの mock |

## ゴール

1. `caption-worker.ts` で `getAbsolutePath` を使用せず、バッファ経由でファイルを読み込む
2. テストコードの mock から deprecated メソッドを削除
3. `FileStorage` インターフェースと実装から deprecated メソッドを完全削除

## 実装方針

### 1. caption-worker.ts の修正

現状:
```typescript
const absolutePath = fileStorage.getAbsolutePath(image.path);
await ocrService.extractText(absolutePath);
await captionService.generateWithContext(absolutePath, context);
```

変更後:
```typescript
const buffer = await fileStorage.readFile(image.path);
await ocrService.extractTextFromBuffer(buffer);
await captionService.generateFromBuffer(buffer); // with context
```

ただし、`CaptionService.generateWithContext` には `generateFromBuffer` ベースのオーバーロードがないため、新しいメソッド追加が必要:
- `generateWithContextFromBuffer(buffer: Buffer, context: CaptionContext): Promise<CaptionResult>`

### 2. CaptionService インターフェース拡張

```typescript
generateWithContextFromBuffer: (imageData: Buffer, context: CaptionContext) => Promise<CaptionResult>;
```

### 3. CaptionService 実装の修正

`packages/core/src/infra/caption/` 配下の実装を更新。

### 4. テストコードの mock 修正

9 ファイル（core: 6、server: 3）の mock から deprecated メソッドを削除。

### 5. FileStorage から deprecated メソッドを削除

インターフェースと `LocalFileStorage` 実装の両方から削除。

## 完了条件

- [x] `caption-worker.ts` が `readFile` + バッファベース API を使用
- [x] `CaptionService` に `generateWithContextFromBuffer` メソッドが追加されている
- [x] テストの mock が新 API のみを定義
- [x] `FileStorage` インターフェースから deprecated メソッドが削除されている
- [x] `LocalFileStorage` から deprecated メソッドが削除されている
- [x] 全テストが pass する
- [x] 型チェックが通る

## 作業ログ

### 2026-02-07

1. **CaptionService インターフェース拡張**
   - `generateWithContextFromBuffer` メソッドを追加
   - `TransformersCaptionService` に実装を追加

2. **caption-worker.ts の修正**
   - `getAbsolutePath` → `readFile` でバッファ取得
   - `ocrService.extractText` → `extractTextFromBuffer`
   - `captionService.generateWithContext` → `generateWithContextFromBuffer`

3. **テスト mock の修正（9 ファイル）**
   - `packages/core/tests/`: 6 ファイル
   - `packages/server/tests/`: 3 ファイル
   - `local-file-storage.test.ts` から deprecated メソッドのテストを削除

4. **FileStorage インターフェース・実装から削除**
   - `saveOriginalFromStream` を削除
   - `getAbsolutePath` を削除

5. **動作確認**
   - `npm run typecheck`: パス
   - `npm run test`: 全テストパス

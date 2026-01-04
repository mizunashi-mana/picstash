# ストリーム化によるメモリ使用量削減

## 目的・ゴール

画像アップロード処理をストリーム化し、大きなファイルでもメモリを効率的に使用できるようにする。

## 現状分析

### すでにストリーム化されている箇所
- `GET /api/images/:id/file` - `createReadStream()` 使用
- `GET /api/images/:id/thumbnail` - `createReadStream()` 使用

### ストリーム化が必要な箇所
1. **アップロードハンドラ** (`images.ts`)
   - `file.toBuffer()` で全データをメモリにロード

2. **ファイルストレージ** (`local-file-storage.ts`)
   - `writeFile(buffer)` でバッファ全体を書き込み

3. **画像プロセッサ** (`sharp-image-processor.ts`)
   - `sharp(buffer)` でバッファ全体をメモリに保持
   - サムネイル生成時にもバッファを使用

## 実装方針

### アプローチ: ストリーム→一時ファイル→処理

1. **アップロード時**: マルチパートストリームを一時ファイルに直接書き込み
2. **メタデータ取得**: 一時ファイルパスから Sharp で読み込み
3. **サムネイル生成**: 一時ファイルパスから Sharp で処理
4. **保存**: 一時ファイルを最終保存先にリネーム/移動

### インターフェース変更

```typescript
// Before
interface FileStorage {
  saveOriginal(buffer: Buffer, extension: string): Promise<SaveFileResult>;
}

interface ImageProcessor {
  getMetadata(buffer: Buffer): Promise<ImageMetadata>;
  generateThumbnail(buffer: Buffer, filename: string): Promise<ThumbnailResult>;
}

// After
interface FileStorage {
  saveOriginalFromStream(
    stream: Readable,
    extension: string,
  ): Promise<SaveFileResult>;
  deleteFile(relativePath: string): Promise<void>;
  getAbsolutePath(relativePath: string): string;
}

interface ImageProcessor {
  getMetadata(filePath: string): Promise<ImageMetadata>;
  generateThumbnail(filePath: string, outputFilename: string): Promise<ThumbnailResult>;
}
```

### 処理フロー

```
Multipart Stream
      │
      ▼
┌─────────────────┐
│ saveOriginalFromStream │ ← ストリームを直接ファイルに書き込み
└─────────────────┘
      │
      ▼ (保存されたファイルパス)
      │
      ├──────────────────┐
      ▼                  ▼
┌──────────┐     ┌──────────────┐
│ getMetadata │     │ generateThumbnail │
│ (ファイルパス) │     │ (ファイルパス)     │
└──────────┘     └──────────────┘
```

## 完了条件

- [x] アップロード時にバッファを使わずストリームで処理
- [x] ImageProcessor がファイルパスベースで動作
- [x] FileStorage がストリームを受け取って保存
- [x] 既存のテストが通る
- [ ] 50MB のファイルをアップロードしてもメモリ使用量が安定（手動確認推奨）

## 作業ログ

### 2026-01-04

#### 変更したファイル

1. **application/ports/file-storage.ts**
   - `saveOriginal(buffer)` → `saveOriginalFromStream(stream)` に変更

2. **application/ports/image-processor.ts**
   - `getMetadata(buffer)` → `getMetadata(filePath)` に変更
   - `generateThumbnail(buffer, filename)` → `generateThumbnail(inputFilePath, outputFilename)` に変更

3. **infra/adapters/local-file-storage.ts**
   - `pipeline()` と `createWriteStream()` を使ってストリームを直接ファイルに書き込み

4. **infra/adapters/sharp-image-processor.ts**
   - Sharp がファイルパスから直接読み込むように変更
   - `toFile()` を使って直接ファイルに出力（サムネイル生成時のバッファも削除）

5. **application/image/upload-image.ts**
   - `buffer` → `stream` に変更
   - ファイルサイズは保存後に `stat()` で取得

6. **infra/http/routes/images.ts**
   - `file.toBuffer()` → `file.file`（ストリーム）を直接渡すように変更

#### 動作確認

- typecheck: OK
- lint: OK
- テスト: OK
- curl によるアップロードテスト: OK

# T3: ストレージインターフェース定義

## 関連プロジェクト

[Desktop App プロジェクト](../../projects/20260125-desktop-app/README.md)

## 目的・ゴール

ローカル/クラウドストレージを抽象化するインターフェースを `@picstash/core` に定義し、デスクトップアプリでのローカルファイルシステム保存とサーバーでの既存保存を共通のインターフェースで扱えるようにする。

## 完了条件

- [x] `FileStorage` インターフェースにファイル読み取りメソッド (`readFile`, `readFileAsStream`, `getFileSize`, `fileExists`) を追加
- [x] `FileStorage` に汎用保存メソッド (`saveFile`, `saveFileFromBuffer`) を追加
- [x] `ImageProcessor` を Buffer ベースに変更し、ファイルシステム依存を除去
- [x] 全消費者（use case, worker, controller）を新インターフェースに移行
- [x] 旧メソッド (`saveOriginalFromStream`, `getAbsolutePath`) を `@deprecated` として残す
- [x] テスト更新・全テスト通過

## 実装方針

### FileStorage インターフェース

```typescript
export interface FileStorage {
  // 書き込み
  saveFile: (stream: Readable, options: SaveFileOptions) => Promise<SaveFileResult>;
  saveFileFromBuffer: (buffer: Buffer, options: SaveFileOptions) => Promise<SaveFileResult>;
  /** @deprecated saveFile を使用 */
  saveOriginalFromStream: (stream: Readable, extension: string) => Promise<SaveFileResult>;

  // 読み取り
  readFile: (relativePath: string) => Promise<Buffer>;
  readFileAsStream: (relativePath: string) => Promise<Readable>;
  getFileSize: (relativePath: string) => Promise<number>;
  fileExists: (relativePath: string) => Promise<boolean>;

  // 削除
  deleteFile: (relativePath: string) => Promise<void>;

  // レガシー
  /** @deprecated readFile/readFileAsStream を使用 */
  getAbsolutePath: (relativePath: string) => string;
}
```

### ImageProcessor インターフェース

```typescript
export interface ImageProcessor {
  getMetadata: (imageData: Buffer) => Promise<ImageMetadata>;
  generateThumbnail: (imageData: Buffer) => Promise<Buffer>;
}
```

### 移行パターン

消費者は以下のパターンで移行:

```typescript
// Before:
const saved = await fileStorage.saveOriginalFromStream(stream, extension);
const absolutePath = fileStorage.getAbsolutePath(saved.path);
metadata = await imageProcessor.getMetadata(absolutePath);
thumbnail = await imageProcessor.generateThumbnail(absolutePath, saved.filename);

// After:
const saved = await fileStorage.saveFile(stream, { category: 'originals', extension });
const imageData = await fileStorage.readFile(saved.path);
metadata = await imageProcessor.getMetadata(imageData);
const thumbnailBuffer = await imageProcessor.generateThumbnail(imageData);
await fileStorage.saveFileFromBuffer(thumbnailBuffer, { category: 'thumbnails', extension: '.jpg' });
```

### 変更ファイル

**インターフェース・実装:**
- `packages/core/src/application/ports/file-storage.ts` — FileStorage 拡張
- `packages/core/src/application/ports/image-processor.ts` — Buffer ベース化
- `packages/core/src/infra/adapters/local-file-storage.ts` — 新メソッド実装
- `packages/core/src/infra/adapters/sharp-image-processor.ts` — Buffer ベース化

**消費者 (core):**
- `packages/core/src/application/image/upload-image.ts`
- `packages/core/src/application/embedding/generate-embedding.ts`
- `packages/core/src/application/url-crawl/import-from-url-crawl.ts`
- `packages/core/src/infra/workers/archive-import-worker.ts`
- `packages/core/src/infra/workers/caption-worker.ts`

**消費者 (server):**
- `packages/server/src/infra/http/controllers/image-controller.ts`
- `packages/server/src/infra/http/controllers/image-suggestion-controller.ts`
- `packages/server/src/infra/http/controllers/url-crawl-controller.ts`
- `packages/server/src/infra/http/controllers/archive-controller.ts`

**テスト:**
- `packages/core/tests/infra/adapters/local-file-storage.test.ts`
- `packages/core/tests/application/image/upload-image.test.ts`
- `packages/core/tests/application/image/delete-image.test.ts`
- `packages/core/tests/embedding/generate-embedding.test.ts`
- `packages/core/tests/application/url-crawl/import-from-url-crawl.test.ts`
- `packages/core/tests/infra/workers/archive-import-worker.test.ts`
- `packages/server/tests/infra/http/controllers/image-controller.test.ts`
- `packages/server/tests/infra/http/controllers/image-suggestion-controller.test.ts`

**エクスポート:**
- `packages/core/src/index.ts` — `FileCategory`, `SaveFileOptions`, `SaveFileResult`, `ImageMetadata` を追加

## 作業ログ

- 2026-01-27: タスク開始、現状調査完了
- 2026-01-27: 計画承認、実装開始
- 2026-01-27: Step 1-5 完了（インターフェース定義、実装更新、全消費者の移行）
- 2026-01-27: Step 6 完了（全テスト更新）
- 2026-01-27: Step 7 完了（エクスポート更新）
- 2026-01-27: 検証完了（typecheck, lint, test 全パス） → タスク完了

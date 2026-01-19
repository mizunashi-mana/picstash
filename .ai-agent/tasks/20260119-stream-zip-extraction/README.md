# ZIP展開のストリーム化

## 目的・ゴール

現在のZIP展開処理は `adm-zip` ライブラリを使用しており、アーカイブ全体をメモリにロードしてから個別エントリを取得している。これにより、大きなZIPファイル（最大500MB）を処理する際にメモリ使用量が過大になる問題がある。

ストリームベースのZIP処理ライブラリに移行し、必要なエントリのみを効率的に展開できるようにする。

## 現状の問題点

1. **メモリ効率**: `AdmZip` は `new AdmZip(archivePath)` でファイル全体をメモリに展開
2. **展開方式**: `entry.getData()` でエントリごとにBufferを返却（ストリーム非対応）
3. **影響範囲**:
   - `listEntries()`: エントリ一覧取得
   - `extractEntry()`: 個別エントリ展開

## 実装方針

### ライブラリ変更

`adm-zip` から `yauzl`（Promise版: `yauzl-promise`）への移行を検討。

**yauzl の特徴:**
- ストリームベースのZIP読み込み
- メタデータのみの読み込みが可能
- 個別エントリのストリーム展開
- Node.js標準ストリームとの親和性

### 変更ファイル

1. `packages/server/src/infra/adapters/zip-archive-handler.ts`
   - `adm-zip` → `yauzl-promise` への移行
   - `listEntries()`: メタデータのみ読み込み
   - `extractEntry()`: ストリームからBufferへの変換

2. `packages/server/package.json`
   - 依存関係の更新

3. `packages/server/tests/zip-archive-handler.test.ts`
   - テストの更新（必要に応じて）

### インターフェース維持

`ArchiveHandler` インターフェースは変更しない:
```typescript
interface ArchiveHandler {
  archiveType: 'zip' | 'rar';
  canHandle(filePath: string, mimeType: string): boolean;
  listEntries(archivePath: string): Promise<ArchiveEntry[]>;
  extractEntry(archivePath: string, entryIndex: number): Promise<Buffer>;
}
```

内部実装のみをストリーム化し、呼び出し側への影響を最小化する。

## 完了条件

- [x] `yauzl-promise` への移行完了
- [x] `listEntries()` がストリームベースでメタデータを取得
- [x] `extractEntry()` がストリームベースでエントリを展開
- [x] 既存テストがすべてパス
- [x] 型チェック・lint エラーなし
- [x] 手動でのZIPアップロード・展開動作確認

## 作業ログ

### 2026-01-19

1. `yauzl-promise` と `@types/yauzl-promise` をインストール
2. `zip-archive-handler.ts` を `adm-zip` から `yauzl-promise` へ移行
   - `listEntries()`: `zipFile.readEntries()` でメタデータのみ取得
   - `extractEntry()`: `zipFile.openReadStream(entry)` でストリームベースの展開
3. ストリーム読み取り中に `close()` を呼べない問題に対応
   - `streamToBuffer()` 完了後に明示的に `close()` を呼ぶように修正
4. 全テストパス（9 tests）
5. 型チェック・lint 問題なし
6. curl でアーカイブアップロードAPI動作確認済み

### 変更点

**依存関係追加:**
- `yauzl-promise` - ストリームベースのZIP読み込みライブラリ
- `@types/yauzl-promise` - 型定義

**`adm-zip` は削除せず:**
- テストでのZIP作成用に残存（本番コードでは使用しない）

### 期待される改善

- ZIP64形式のサポート（4GB超、65535エントリ超）
- より仕様準拠のZIP解析
- 「Invalid or unsupported zip format. No END header found」エラーの解消可能性

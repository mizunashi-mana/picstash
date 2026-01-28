# T4: IPC によるファイルシステムアクセス

## 関連プロジェクト

[Desktop App プロジェクト](../../projects/20260125-desktop-app/README.md)

## 目的・ゴール

Electron デスクトップアプリにおいて、レンダラープロセス（React フロントエンド）からメインプロセス経由でファイルシステムにアクセスするための IPC 通信基盤を構築する。

## 背景

- T3 で `FileStorage`/`ImageProcessor` インターフェースが Buffer ベースに拡張された
- デスクトップアプリでは、これらのインターフェースを IPC 経由で実装する必要がある
- contextIsolation を有効にした安全な通信を確保する

## 完了条件

- [x] メインプロセスに IPC ハンドラが実装される
  - [x] ファイル読み取り（readFile）
  - [x] ファイル書き込み（saveFile）
  - [x] ファイル削除（deleteFile）
  - [x] ファイル存在確認（fileExists, getFileSize）
- [x] プリロードスクリプトで contextBridge API が公開される
- [x] レンダラーから `window.picstash.storage.*` で呼び出せる
- [x] TypeScript 型定義が整備される
- [x] セキュリティ（パストラバーサル対策）が確保される
- [x] E2E テストで Storage API の公開が確認される

## 実装方針

### IPC チャンネル設計

```typescript
// チャンネル名の規則: 'storage:操作名'
'storage:readFile'        // (relativePath) => Buffer
'storage:saveFile'        // (buffer, options) => SaveFileResult
'storage:deleteFile'      // (relativePath) => void
'storage:fileExists'      // (relativePath) => boolean
'storage:getFileSize'     // (relativePath) => number
```

### preload API 設計

```typescript
// window.picstash.storage
interface StorageAPI {
  // ファイル操作
  readFile: (relativePath: string) => Promise<ArrayBuffer>;
  saveFile: (data: ArrayBuffer, options: SaveFileOptions) => Promise<SaveFileResult>;
  deleteFile: (relativePath: string) => Promise<void>;
  fileExists: (relativePath: string) => Promise<boolean>;
  getFileSize: (relativePath: string) => Promise<number>;

  // ストレージパス管理
  getPath: () => Promise<string | null>;
  setPath: (path: string) => Promise<void>;
  selectPath: () => Promise<string | null>;  // フォルダ選択ダイアログ
  isInitialized: () => Promise<boolean>;
}
```

### セキュリティ考慮事項

- パストラバーサル攻撃を防ぐため、相対パスのバリデーションを行う
- 許可されたディレクトリ（storageBasePath）外へのアクセスを拒否
- contextIsolation: true を維持

## 変更ファイル

**メインプロセス:**
- `packages/desktop-app/src/main/ipc-handlers.ts` — IPC ハンドラ実装（新規）
- `packages/desktop-app/src/main/index.ts` — IPC ハンドラ登録

**プリロード:**
- `packages/desktop-app/src/preload/index.ts` — contextBridge API 公開

**型定義:**
- `packages/desktop-app/src/shared/types.ts` — 共通型定義（新規）

**テスト:**
- `packages/desktop-app/tests/app.spec.ts` — Storage API 公開テストを追加

## 作業ログ

- 2026-01-29: タスク開始
- 2026-01-29: 共通型定義を `src/shared/types.ts` に作成
- 2026-01-29: StorageManager クラスを `src/main/storage-manager.ts` に実装（ユーザー選択可能なストレージパス対応）
- 2026-01-29: IPC ハンドラを `src/main/ipc-handlers.ts` に実装
- 2026-01-29: preload スクリプトを更新し Storage API を公開
- 2026-01-29: ESLint 設定を調整（main/preload 用のルール緩和）
- 2026-01-29: E2E テストに Storage API 公開テストを追加
- 2026-01-29: 検証完了（typecheck, lint, test 全パス） → タスク完了

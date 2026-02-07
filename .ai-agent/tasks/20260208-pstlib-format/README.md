# ライブラリファイル形式（.pstlib）の導入

**GitHub Issue**: [#203](https://github.com/mizunashi-mana/picstash/issues/203)

## 目的・ゴール

デスクトップアプリのフォルダ選択機能を改善し、専用のライブラリディレクトリ形式（`.pstlib`）を導入する。

### 背景

現在のフォルダ選択では、選択したフォルダに直接 DB ファイルやストレージを展開している。これにより：

- ユーザーの既存フォルダ構造と混在してしまう
- ライブラリデータの識別・移動が困難
- 複数ライブラリの管理が不明瞭

### 解決策

`*.pstlib` という拡張子を持つディレクトリをライブラリとして扱う：

```
library.pstlib/
├── picstash.db          # SQLite データベース
├── storage/
│   ├── originals/       # オリジナル画像
│   └── thumbnails/      # サムネイル画像
└── (その他の設定ファイル)
```

## 実装方針

### フォルダ選択時の動作

1. **`*.pstlib` ディレクトリが選択された場合**:
   - そのディレクトリをデータディレクトリとして読み込み
   - 既存のライブラリを開く動作

2. **それ以外のディレクトリが選択された場合**:
   - 選択されたディレクトリ内に `library.pstlib` フォルダを作成
   - その中に DB ファイル / storage ディレクトリを展開
   - 新規ライブラリ作成の動作

### 変更対象ファイル

1. `packages/desktop-app/src/main/storage-manager.ts`
   - `selectPath()` メソッドの拡張
   - `.pstlib` ディレクトリの判定・作成ロジック追加

2. `packages/desktop-app/src/main/core-manager.ts`
   - storage パスから .pstlib 内部構造への対応確認

3. UI 側（レンダラー）
   - フォルダ選択画面での説明文更新（必要に応じて）

## 完了条件

- [x] `.pstlib` ディレクトリを選択すると、既存ライブラリとして開ける
- [x] 通常ディレクトリを選択すると、`library.pstlib` が自動作成される
- [x] DB ファイルと storage が `.pstlib` ディレクトリ内に配置される
- [x] ~~既存の動作（現行フォルダ構造）との後方互換性を維持~~ → 後方互換性は不要（ユーザー確認済み）

## 作業ログ

### 2026-02-08

- タスク開始
- 現行実装の確認完了
  - `storage-manager.ts`: ストレージパス管理、ファイル保存ロジック
  - `core-manager.ts`: DB パス生成 (`join(storagePath, 'picstash.db')`)
- 実装完了
  - `storage-manager.ts`:
    - `isLibraryDirectory()` ヘルパー関数追加（.pstlib 判定）
    - `initializeLibraryDirectory()` メソッド追加（サブディレクトリ作成）
    - `selectPath()` を拡張（.pstlib 判定と library.pstlib 自動作成）
    - `getCategoryPath()` を修正（storage/ サブディレクトリ経由）
    - `saveFile()` の戻り値パスを `storage/category/filename` 形式に変更
  - `core-manager.ts`:
    - `storage.path` を .pstlib ディレクトリに設定（パス形式の統一）
- 型チェック: 修正ファイルにエラーなし
- ユニットテスト追加: `tests/unit/storage-manager.test.ts`
  - `isLibraryDirectory()` のテスト（.pstlib 判定、大文字小文字区別なし）
  - `resolveLibraryPath()` のテスト（.pstlib → そのまま、通常 → library.pstlib 追加）
  - ディレクトリ構造のテスト（パス形式の確認）
- テスト結果: 8 テスト全てパス
- Electron アプリ起動確認: CDP 接続成功、初期画面表示確認

### 手動テスト推奨

Playwright では Electron のネイティブダイアログを操作できないため、以下の手動テストを推奨:

1. `npm run dev -w @picstash/desktop-app` でアプリ起動
2. 「フォルダを選択」ボタンをクリック
3. 通常のディレクトリを選択 → `library.pstlib` が作成されることを確認
4. 画像をインポートして、`.pstlib/storage/originals/` に保存されることを確認

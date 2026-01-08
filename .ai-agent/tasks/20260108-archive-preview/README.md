# タスク: アーカイブ解析・プレビュー (3-1)

## 目的・ゴール

ZIP/RAR アーカイブファイルを開いて、中身の画像ファイルをプレビュー表示できるようにする。
これにより、アーカイブを解凍せずに内容を確認し、次のセグメント (3-2) で選択的インポートを行う準備ができる。

## 提供価値

- アーカイブを解凍せずに中身の画像を確認できる
- インポート前にプレビューで内容を把握できる
- 大量の画像を含むアーカイブの効率的な確認が可能

## 実装方針

### バックエンド

1. **アーカイブ解析 API**
   - アーカイブファイルをアップロードして一時保存
   - アーカイブ内のファイル一覧を取得（ファイル名、サイズ、パス）
   - 画像ファイルのみをフィルタリング

2. **プレビュー画像取得 API**
   - 指定したアーカイブ内の特定画像をサムネイル/フルサイズで取得
   - ストリーミングでレスポンス

3. **ライブラリ選定**
   - ZIP: `adm-zip` (純粋 JS 実装、メモリ上で操作可能)
   - RAR: `node-unrar-js` (Emscripten でコンパイル、依存なし)

4. **API エンドポイント**
   - `POST /api/archives` - アーカイブをアップロード、セッション ID を返す
   - `GET /api/archives/:sessionId` - アーカイブ内の画像ファイル一覧を取得
   - `GET /api/archives/:sessionId/files/:fileIndex/thumbnail` - サムネイル取得
   - `GET /api/archives/:sessionId/files/:fileIndex/file` - フルサイズ画像取得
   - `DELETE /api/archives/:sessionId` - セッションと一時ファイルを削除

5. **一時ファイル管理**
   - `storage/temp/` に一時展開
   - セッション単位で管理

### フロントエンド

1. **アーカイブアップロード UI**
   - ドラッグ＆ドロップまたはファイル選択でアーカイブをアップロード

2. **プレビューギャラリー**
   - アーカイブ内の画像一覧をサムネイル表示
   - 画像クリックで拡大表示

3. **ファイル情報表示**
   - ファイル名、サイズ、フォルダ構造を表示

## 完了条件

- [x] ZIP ファイルをアップロードして中身の画像一覧を取得できる
- [x] RAR ファイルをアップロードして中身の画像一覧を取得できる
- [x] アーカイブ内の画像をサムネイルでプレビュー表示できる
- [x] アーカイブ内の画像を拡大表示できる
- [x] テストが通る
- [x] ESLint エラーがない

## スコープ外

- 7z 形式対応（将来のタスクで対応予定）
- ネストしたアーカイブの扱い
- 自動クリーンアップ（手動削除のみ）

## 作業ログ

### 2026-01-09

- タスク開始
- 7z 対応を後回しにし、ZIP/RAR のみ対応することに決定
- 依存パッケージ追加: `adm-zip`, `node-unrar-js`, `@types/adm-zip`
- バックエンド実装:
  - `ArchiveHandler` インターフェース（ポート）
  - `ZipArchiveHandler` アダプター
  - `RarArchiveHandler` アダプター
  - `ArchiveSessionManager` インターフェース（ポート）
  - `InMemoryArchiveSessionManager` アダプター
  - DI コンテナ設定
  - `/api/archives` API ルート
  - `ImageProcessor` に `generateThumbnailFromBuffer` メソッド追加
- フロントエンド実装:
  - `features/archive-import/` 機能モジュール
  - `ArchiveDropzone` コンポーネント
  - `ArchivePreviewGallery` コンポーネント
  - `ArchiveImportPage` ページ
  - ナビゲーションに Archive リンク追加
- テスト:
  - `ZipArchiveHandler` のユニットテスト
- API 動作確認（curl）: ZIP アップロード、セッション取得、サムネイル/フルサイズ取得、削除
- UI 動作確認: ページ表示、ナビゲーション
- 型チェック・Lint 通過
- PR #21 作成
- PR レビューコメント対応:
  - DELETE リクエストの JSON 解析エラー修正
  - パストラバーサル攻撃の検証追加
  - サーバー側ファイルサイズ制限（500MB）追加
  - getArchiveType の重複排除（handler.archiveType 使用）
  - ページアンマウント時のセッション削除追加
  - RarArchiveHandler のユニットテスト追加
  - InMemoryArchiveSessionManager のユニットテスト追加
  - ZipArchiveHandler のテスト改善


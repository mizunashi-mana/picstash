# 統一インポートページ

## 関連 Issue

- https://github.com/mizunashi-mana/picstash/issues/91

## 目的・ゴール

現在分散している 3 つの取り込み機能を統一された `/import` ページに統合し、ユーザーが直感的にデータを取り込めるようにする。

- `/archive-import` - アーカイブ（ZIP/RAR）からの取り込み
- `/url-crawl` - URL からの取り込み
- 画像直接アップロード（現在は ImageDropzone コンポーネントのみ存在）

## 実装方針

### UI 設計

1. **タブ UI による切り替え**: Mantine の Tabs コンポーネントを使用して 3 つの取り込み方法を切り替え可能にする
   - 「画像」タブ: 画像ファイルの直接アップロード
   - 「アーカイブ」タブ: ZIP/RAR ファイルからのインポート
   - 「URL」タブ: ウェブページからのクロール

2. **既存コンポーネントの再利用**: 各 feature の既存コンポーネントをそのまま活用
   - `upload/components/ImageDropzone`
   - `archive-import/components/ArchiveDropzone`, `ArchivePreviewGallery`
   - `url-crawl/components/UrlInputForm`, `CrawlPreviewGallery`

3. **新規 feature ディレクトリ作成**: `features/import/` を作成し、統合ページを配置

### ルーティング

- 新規ルート `/import` を追加
- 既存の `/archive-import` と `/url-crawl` は削除または `/import` へリダイレクト

### ナビゲーション更新

- サイドバーの既存リンクを `/import` に統合

## 完了条件

- [x] `/import` ページが作成され、3 つの取り込み方法がタブで切り替え可能
- [x] 各タブで既存の機能が正常に動作する
- [x] `/archive-import` と `/url-crawl` のルートが削除または `/import` にリダイレクト
- [x] サイドバーのナビゲーションが更新されている
- [x] 既存のテストが通る

## 作業ログ

### 2026-01-24

1. **import feature 作成**
   - `features/import/` ディレクトリを作成
   - `ImportPage.tsx` を作成（Mantine Tabs で 3 タブ構成）

2. **各タブコンポーネント実装**
   - `ImageUploadTab.tsx`: upload feature の `ImageDropzoneView` を利用
   - `ArchiveImportTab.tsx`: archive-import feature のロジックを流用
   - `UrlCrawlTab.tsx`: url-crawl feature のロジックを流用

3. **feature の public API 更新**
   - `archive-import/index.ts`: 必要なコンポーネントと API をエクスポート
   - `url-crawl/index.ts`: 必要なコンポーネントと API をエクスポート
   - `upload/index.ts`: `ImageDropzoneView` と `uploadImage` をエクスポート

4. **ルーティング更新**
   - `/import` ルートを追加
   - `/archive-import` と `/url-crawl` ルートを削除

5. **ナビゲーション更新**
   - サイドバーの「アーカイブ」「URLから取り込み」を「インポート」に統合
   - アイコンを `IconDownload` に変更

6. **動作確認**
   - ESLint: 全て通過
   - 型チェック: 全て通過
   - テスト: 全て通過（server: 493 tests, web-client: 35 tests）
   - ブラウザ確認: 3 タブ全て正常動作

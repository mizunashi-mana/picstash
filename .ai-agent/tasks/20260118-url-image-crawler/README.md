# URLからの画像クロール取り込み機能

## 目的・ゴール

URLを指定して、そのページに含まれる画像をクロール・プレビューし、選択した画像をライブラリに取り込める機能を実装する。

## 実装方針

アーカイブインポート機能（3-1, 3-2）と同様のパターンで実装する：

### バックエンド

1. **URL解析・画像抽出**
   - URL を受け取り、HTML をフェッチ
   - HTML から画像URL（`<img src>`, `<a href>` 等）を抽出
   - 相対パスを絶対パスに変換
   - 画像URLの重複排除

2. **クロールセッション管理**
   - セッションIDを発行し、抽出した画像URL一覧を保持
   - インメモリセッション管理（アーカイブと同様）

3. **API エンドポイント**
   - `POST /api/url-crawl` - URLを指定してセッション作成
   - `GET /api/url-crawl/:sessionId` - セッション情報取得
   - `GET /api/url-crawl/:sessionId/images/:imageIndex/thumbnail` - サムネイル取得（プロキシ）
   - `GET /api/url-crawl/:sessionId/images/:imageIndex/file` - フルサイズ画像取得（プロキシ）
   - `POST /api/url-crawl/:sessionId/import` - 選択画像をインポート
   - `DELETE /api/url-crawl/:sessionId` - セッション削除

4. **画像のダウンロード・インポート**
   - 選択された画像URLからダウンロード
   - ファイルストレージに保存
   - サムネイル生成
   - DBに画像レコード作成

### フロントエンド

1. **URLクロールページ**
   - URL入力フォーム
   - クロール実行ボタン

2. **画像プレビュー・選択UI**
   - アーカイブインポートと同様のグリッド表示
   - チェックボックスで選択
   - サムネイルクリックでプレビュー

3. **インポート実行**
   - 選択した画像をインポート
   - 結果表示（成功/失敗）

### 技術的考慮事項

- **CORS**: 外部画像はサーバー側でプロキシして返す
- **User-Agent**: 適切なUser-Agentを設定
- **レートリミット**: 外部サイトへのリクエスト頻度を制限
- **タイムアウト**: フェッチのタイムアウト設定
- **エラーハンドリング**: 取得失敗した画像のハンドリング

## 完了条件

- [x] URL を入力して画像一覧をプレビューできる
- [x] 画像を選択してライブラリにインポートできる
- [x] インポート成功/失敗の結果が表示される
- [x] セッションのクリーンアップが正しく動作する
- [x] 型チェック・lint が通る

## 作業ログ

### 2026-01-18

- タスク開始
- 実装完了

## 実装詳細

### 作成したファイル

**サーバー側（packages/server/src）**
- `domain/url-crawl/CrawledImageEntry.ts` - クロール画像エントリーの型定義
- `domain/url-crawl/UrlCrawlSession.ts` - クロールセッションの型定義
- `domain/url-crawl/UrlCrawlConfig.ts` - 設定定数（タイムアウト、User-Agent、対応拡張子）
- `domain/url-crawl/HtmlImageExtractor.ts` - HTML解析による画像URL抽出
- `domain/url-crawl/index.ts` - エクスポート
- `application/ports/url-crawl-session-manager.ts` - セッション管理のポートインターフェース
- `application/url-crawl/import-from-url-crawl.ts` - インポートユースケース
- `application/url-crawl/index.ts` - エクスポート
- `infra/adapters/in-memory-url-crawl-session-manager.ts` - インメモリセッション管理実装
- `infra/http/controllers/url-crawl-controller.ts` - HTTPコントローラー

**クライアント側（packages/client/src）**
- `features/url-crawl/api.ts` - API関数
- `features/url-crawl/components/UrlInputForm.tsx` - URL入力フォームコンポーネント
- `features/url-crawl/components/CrawlPreviewGallery.tsx` - 画像プレビューギャラリー
- `features/url-crawl/pages/UrlCrawlPage.tsx` - URLクロールページ
- `features/url-crawl/index.ts` - エクスポート

**修正したファイル**
- `packages/server/src/infra/di/types.ts` - DI型定義追加
- `packages/server/src/infra/di/container.ts` - DI登録追加
- `packages/server/src/infra/di/app-container.ts` - アクセサ追加
- `packages/server/src/infra/http/routes/index.ts` - ルート登録
- `packages/client/src/routes/index.tsx` - ルート追加
- `packages/client/src/shared/components/AppLayout.tsx` - ナビゲーション追加

### 機能概要

1. URLを入力するとHTMLをフェッチし、`<img>`, `<a>`, `srcset`, `data-src`, CSS `background-image` から画像URLを抽出
2. サーバー側でプロキシして画像サムネイルを表示（CORS回避）
3. チェックボックスで画像を選択し、インポート実行
4. インポート結果（成功/失敗）を表示
5. ページ離脱時にセッションを自動クリーンアップ

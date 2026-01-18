# E2Eテスト追加

## 目的・ゴール

アプリケーション全体（サーバー + クライアント）を通したEnd-to-Endテストを追加し、主要なユーザーフローが正常に動作することを保証する。

## 現状

- ユニットテスト: Vitest で実装済み（server, client）
- Storybookテスト: Playwright ブラウザモードで実装済み
- E2Eテスト: **未実装**

## 実装方針

### テストフレームワーク

**Playwright Test** を採用（理由）:
- 実際のサーバー + クライアントを起動してテスト可能
- 公式の `webServer` 設定でサーバー起動を自動化
- スクリーンショット・動画・トレースなどデバッグ機能が充実
- 既にclientパッケージにPlaywrightがインストール済み

### テスト対象（優先度順）

1. **基本フロー**
   - ギャラリー表示
   - 画像アップロード
   - 画像詳細表示
   - 画像削除

2. **検索・整理**
   - 検索機能
   - 属性ラベル管理

3. **その他**
   - アーカイブインポート
   - コレクション機能

### 構成

```
packages/
├── e2e/                    # 新規パッケージ
│   ├── package.json
│   ├── playwright.config.ts
│   └── tests/
│       ├── gallery.spec.ts
│       ├── upload.spec.ts
│       └── ...
```

## 完了条件

- [x] E2Eテスト用パッケージの作成
- [x] Playwright設定ファイルの作成
- [x] 基本フローのテスト実装（ギャラリー、アップロード、詳細、削除）
- [x] CI/ローカルで実行可能
- [x] npm run test:e2e でルートから実行可能

## 作業ログ

### 2026/01/18
- E2Eテストパッケージ（packages/e2e-test）を作成
- Playwright設定ファイル（playwright.config.ts）を作成
- 基本フローのテストを実装:
  - gallery.spec.ts: ホームページ表示、検索バー、サイドバーナビゲーション
  - upload.spec.ts: ドロップゾーンからのアップロード、ギャラリー表示
  - image-detail.spec.ts: 詳細ページ表示、ギャラリーへ戻る、フォーマット情報
  - image-delete.spec.ts: 画像削除、キャンセル動作

### 修正内容
- Rate Limit問題の解決: E2Eテスト時に`DISABLE_RATE_LIMIT=true`環境変数でRate Limitを無効化
- DELETEリクエストのContent-Type問題修正: ボディがない場合にContent-Typeヘッダーを設定しないよう`apiClient`を修正
- ESLintエラーの修正: Playwright用ESLint設定を適用、条件文を排除

### テスト結果
- 10テストすべてパス（約9秒）

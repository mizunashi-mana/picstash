# リリース・証明書発行手順ドキュメント化

## 目的・ゴール

Issue #195 に関連して、以下のドキュメントを作成する:

1. **Apple Developer 証明書発行手順** - macOS 向け pkg ファイルを署名するために必要な証明書の取得方法
2. **リリース手順** - Picstash のリリースワークフローの使い方と、開発者が知っておくべき手順

## 実装方針

- `docs/` ディレクトリを新規作成し、開発者向けドキュメントを配置
- 日本語でドキュメントを作成（プロジェクトの他のドキュメントに合わせる）

### 作成するドキュメント

1. **`docs/release.md`** - リリース手順
   - GitHub Actions ワークフローの実行方法
   - バージョン番号の決め方（セマンティックバージョニング）
   - リリース前のチェックリスト
   - 成果物（アーティファクト）の説明

2. **`docs/code-signing.md`** - コード署名手順
   - Apple Developer Program への登録方法
   - Developer ID Installer 証明書の取得手順
   - GitHub Secrets への証明書登録方法
   - electron-builder の署名設定
   - 公証（Notarization）の設定（将来対応用）

## 完了条件

- [x] `docs/release.md` が作成されている
- [x] `docs/code-signing.md` が作成されている
- [x] ドキュメントの内容が正確で、手順に従って作業できる

## 作業ログ

### 2026-02-08

1. `docs/` ディレクトリを作成
2. `docs/release.md` を作成
   - GitHub Actions ワークフローの実行方法
   - セマンティックバージョニングの説明
   - リリース前チェックリスト
   - 成果物の一覧
   - トラブルシューティング
3. `docs/code-signing.md` を作成
   - Apple Developer Program への登録手順
   - Developer ID Installer 証明書の取得手順（CSR 作成含む）
   - 証明書のエクスポート（.p12）
   - GitHub Secrets の設定方法
   - electron-builder の署名設定
   - 公証（Notarization）の設定方法
   - Windows 署名の参考情報
   - トラブルシューティング

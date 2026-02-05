---
description: Review a GitHub pull request
allowed-tools: Read, Glob, Grep, mcp__github__pull_request_read, mcp__github__pull_request_review_write, mcp__github__add_comment_to_pending_review, mcp__github__get_file_contents
---

# PR レビュー

PR「$ARGUMENTS」のコードをレビューし、GitHub の Review 機能でコメントを投稿します。

## 手順

1. **PR 情報の取得**:
   - `mcp__github__pull_request_read` で PR の基本情報を取得（method: `get`）
   - タイトル、説明、ベースブランチを確認

2. **変更ファイルの取得**:
   - `mcp__github__pull_request_read` で変更ファイル一覧を取得（method: `get_files`）
   - `mcp__github__pull_request_read` で差分を取得（method: `get_diff`）

3. **コードレビュー実施**:
   - 各変更ファイルを確認
   - 以下の観点でレビュー:
     - バグ・ロジックエラー
     - セキュリティ問題（インジェクション、認証、認可）
     - パフォーマンス問題
     - 可読性・保守性
     - 命名規則・コーディング規約
     - エラーハンドリング
     - テストの妥当性

4. **レビュー結果をユーザーに提示**:
   - 問題点と改善提案を一覧化
   - 深刻度（Critical/Warning/Info）を付与
   - ユーザーの確認を得る

5. **Pending Review の作成**:
   - `mcp__github__pull_request_review_write` で pending review を作成（method: `create`）
   - event は指定せず、まず pending 状態で作成

6. **行コメントの追加**:
   - `mcp__github__add_comment_to_pending_review` で各コメントを追加
   - 適切な行番号と side (LEFT/RIGHT) を指定
   - subjectType: LINE で行レベルのコメント

7. **ユーザー確認後に Submit**:
   - レビュー結果（APPROVE / REQUEST_CHANGES / COMMENT）を選択
   - `mcp__github__pull_request_review_write` で submit（method: `submit_pending`）

## レビュー観点

### Critical（修正必須）
- セキュリティ脆弱性（XSS、SQLi、コマンドインジェクション等）
- データ損失のリスク
- 明らかなバグ・クラッシュの原因

### Warning（修正推奨）
- パフォーマンス問題
- エラーハンドリングの不足
- 将来の保守性に影響する設計

### Info（提案）
- コードスタイル・可読性の改善
- より良い実装パターンの提案
- ドキュメント・コメントの追加

## 出力フォーマット

```
## レビュー結果

### Critical (X件)

**1. ファイル名:行番号**
> コードスニペット

問題: 具体的な問題の説明
修正案: 改善提案

---

### Warning (Y件)
...

### Info (Z件)
...

---

**総評**: 全体的な評価と次のステップ
**推奨アクション**: APPROVE / REQUEST_CHANGES / COMMENT
```

## 注意事項

- ローカルにチェックアウトされていないファイルは `mcp__github__get_file_contents` で取得
- 大きな PR の場合はファイルごとに段階的にレビュー
- 技術的に正確な指摘を心がける
- 主観的な好みではなく、客観的な問題点を指摘
- 良い点も適切に褒める

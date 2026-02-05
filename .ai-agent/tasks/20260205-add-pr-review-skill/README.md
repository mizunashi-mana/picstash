# タスク: GitHub PR Review スキルの追加

## 目的・ゴール

GitHub PR に対してコードレビューを実施するスキルを追加する。Claude がコードを読んでレビューを行い、GitHub の PR Review 機能を使ってコメントを投稿できるようにする。

## 実装方針

1. `.claude/skills/autodev-review-pr/SKILL.md` を作成
2. GitHub MCP の以下のツールを使用:
   - `pull_request_read` (method: get, get_diff, get_files) - PR 情報と差分の取得
   - `pull_request_review_write` (method: create) - pending review の作成
   - `add_comment_to_pending_review` - 行コメントの追加
   - `pull_request_review_write` (method: submit_pending) - レビューの submit

3. レビュー観点:
   - バグ・ロジックエラー
   - セキュリティ問題
   - パフォーマンス問題
   - 可読性・保守性
   - ベストプラクティス違反

4. ワークフロー:
   - PR 差分を取得して分析
   - 問題点をリストアップ
   - ユーザー確認後に pending review を作成
   - コメントを追加して submit

## 完了条件

- [x] `autodev-review-pr` スキルが追加される
- [x] `/autodev-review-pr <PR番号>` でレビューを実行できる
- [ ] GitHub に Review コメントが投稿される（実際の使用時に確認）

## 作業ログ

### 2026-02-05

- タスク開始
- `.claude/skills/autodev-review-pr/SKILL.md` を作成
  - GitHub MCP ツールを使用したワークフローを定義
  - レビュー観点（Critical/Warning/Info）を定義
  - 出力フォーマットを定義
- スキルが正常に認識されることを確認
- タスク完了

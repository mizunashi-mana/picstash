# GitHub Issues 移行基盤の整備

## 目的・ゴール

1. GitHub Issues で不具合・機能要望を管理できるようにする
2. `plan.md` から完了済みセグメントを整理し、今後のロードマップを明確化する
3. `/autodev:create-issue` コマンドで簡単に Issue を作成できるようにする

## 実装方針

### 1. GitHub Issues 基盤の整備（方針変更）

当初は idea.md の各項目を直接 GitHub Issues に登録する予定だったが、ユーザーの要望により以下に変更:

- Issue テンプレート（Bug Report / Feature Request / Problem）を作成
- 優先度ラベル（high / medium / low）を追加
- 課題用ラベル（problem）を追加
- `/autodev:create-issue` コマンドを作成して随時 Issue 化できるようにする

### 2. plan.md の更新

- 完了済みセグメント一覧は折りたたみで残す（履歴として）
- 今後のロードマップを明確化（未着手8セグメント）
- 実装順序の図を未着手分のみに簡略化

### 3. idea.md の整理

- GitHub Issues への移行手順を記載
- 未整理メモとして既存アイデアを保持
- Issue 化したらテーブルから削除するフローを明記

## 完了条件

- [x] GitHub Issue テンプレートが作成されている（Bug / Feature / Problem）
- [x] 優先度ラベルが追加されている（priority: high / medium / low）
- [x] `/autodev:create-issue` コマンドが作成されている
- [x] plan.md が今後のロードマップとして更新されている
- [x] idea.md が整理されている（Issue 化フロー追記）
- [x] client パッケージ改名は完了済みなので削除

## 作業ログ

### 2026-01-24

1. GitHub Issue テンプレートを作成
   - `.github/ISSUE_TEMPLATE/bug_report.yml`
   - `.github/ISSUE_TEMPLATE/feature_request.yml`
   - `.github/ISSUE_TEMPLATE/problem.yml`
   - `.github/ISSUE_TEMPLATE/config.yml`

2. ラベルを追加
   - `priority: high` (赤)
   - `priority: medium` (黄)
   - `priority: low` (緑)
   - `problem` (水色)

3. Claude Code サブコマンドを作成
   - `.claude/commands/autodev/create-issue.md`

4. plan.md を更新
   - 完了済み29セグメントを折りたたみに
   - 未着手8セグメントをロードマップとして明記
   - 実装順序を未着手分のみに簡略化

5. idea.md を更新
   - GitHub Issues への移行説明を追記
   - 未整理メモテーブルとして既存アイデアを保持
   - Issue 化手順を追記

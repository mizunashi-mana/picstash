---
description: Start new task
allowed-tools: Bash, Read, Write, Edit, MultiEdit, Update, WebSearch, WebFetch
---

# 新規タスク開始

新しいタスク「$ARGUMENTS」を開始します。

## 手順

1. **タスクディレクトリ作成**: `.ai-agent/tasks/YYYYMMDD-$ARGUMENTS/README.md` を作成（YYYYMMDD は今日の日付）

2. **README.md に以下を記載**:
   - 目的・ゴール
   - 実装方針
   - 完了条件
   - 作業ログ（空欄で開始）

3. **関連ドキュメント確認**:
   - `.ai-agent/steering/plan.md` で該当セグメントを確認
   - `.ai-agent/steering/tech.md` で技術スタックを確認
   - `.ai-agent/structure.md` でディレクトリ構成を確認

4. **ユーザーに方針を提示して確認を取る**

5. **TodoWrite でタスクを細分化**

6. **実装開始**（ユーザー確認後）

## 実装中の注意

- 各ステップで動作確認を行う
- API 実装後は curl で動作確認
- UI 実装後は Playwright MCP でブラウザ動作確認
- 必要に応じてユーザーにフィードバックをもらう

## 完了時

- 完了条件をチェック
- 作業ログに結果を記載
- ユーザーに完了報告

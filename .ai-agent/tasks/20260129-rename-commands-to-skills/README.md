# .claude/commands を .claude/skills に移す

## 目的・ゴール

Claude Code の新しい命名規則に従い、`.claude/commands` ディレクトリを `.claude/skills` にリネームする。

## 背景

Claude Code ではカスタムコマンドの格納場所が `commands` から `skills` に変更された。プロジェクト内のコマンド定義を新しいディレクトリ構造に移行する。

## 実装方針

1. `.claude/skills/autodev/` ディレクトリを作成
2. `.claude/commands/autodev/` 内の全ファイルを `.claude/skills/autodev/` に移動
3. `.claude/commands/` ディレクトリを削除
4. 動作確認（スキルが正しく認識されることを確認）

## 対象ファイル

- `create-issue.md`
- `create-pr.md`
- `import-review-suggestions.md`
- `start-new-task.md`
- `steering.md`
- `start-new-project.md`

## 完了条件

- [x] `.claude/skills/` に全スキルディレクトリが存在する
- [x] `.claude/commands/` が削除されている
- [ ] スキルが正しく認識される

## 作業ログ

### 2026-01-29

- `.claude/skills/` に以下のスキルディレクトリを作成:
  - `autodev-create-issue/SKILL.md`
  - `autodev-create-pr/SKILL.md`
  - `autodev-import-review-suggestions/SKILL.md`
  - `autodev-start-new-task/SKILL.md`
  - `autodev-steering/SKILL.md`
  - `autodev-start-new-project/SKILL.md`
- 各 SKILL.md に `name: autodev:xxx` を frontmatter に追加して現在と同じ名前で呼び出せるように設定
- `.claude/commands/` ディレクトリを削除

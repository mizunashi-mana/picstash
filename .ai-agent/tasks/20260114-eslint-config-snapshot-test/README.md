# ESLint 設定スナップショットテスト

## 目的

`@picstash/eslint-config` パッケージの `buildConfig()` 関数が生成する ESLint 設定をスナップショットテストで検証し、意図しない設定変更を防ぐ。

## ゴール

- 各 ruleSet 組み合わせで生成される設定のスナップショットテストを作成
- CI で設定変更を検知可能にする

## 実装方針

1. Vitest をテストランナーとして使用（他パッケージと統一）
2. 以下の設定パターンをテスト:
   - `common` のみ
   - `common` + `react` + `storybook`
3. スナップショットは `tests/__snapshots__/` に保存

## 完了条件

- [x] テストが正常に実行される
- [x] 各 ruleSet の組み合わせがスナップショット化されている
- [x] `npm run test` で実行可能
- [x] typecheck が通る

## 作業ログ

- 2026-01-14: タスク開始
- 2026-01-14: タスク完了 - 2つのテストパターン (common, common+react+storybook) のスナップショットを作成

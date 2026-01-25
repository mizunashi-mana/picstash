# Issue テンプレート修正

## 目的・ゴール

GitHub Issue テンプレートが表示されない問題を修正する。

## 原因

YAML ファイル内の `placeholder` フィールドの値にコロン (`:`) が含まれており、
YAML パーサーがこれをキーと値の区切りと解釈してしまうため、構文エラーが発生している。

## 修正方針

問題のある `placeholder` 値をクォートで囲む。

対象ファイル:
- `.github/ISSUE_TEMPLATE/bug_report.yml`
- `.github/ISSUE_TEMPLATE/feature_request.yml`
- `.github/ISSUE_TEMPLATE/problem.yml`

## 完了条件

- [ ] 3つのテンプレートファイルの YAML 構文エラーを修正
- [ ] `npx js-yaml` で全ファイルがパース可能であることを確認
- [ ] GitHub にプッシュ後、テンプレート選択画面が表示されることを確認

## 作業ログ

- 2026-01-25: 原因特定完了。placeholder の値にコロンが含まれている。

---
description: Update steering documents to reflect current project state
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Glob, Grep
---

# Steering ドキュメント更新

プロジェクトの現状を確認し、steering ドキュメントを最新化します。

## 対象ドキュメント

| ファイル | 内容 |
|---------|------|
| `README.md` | プロジェクト概要、技術スタック、セットアップ手順 |
| `.ai-agent/steering/product.md` | プロダクト概要、機能一覧 |
| `.ai-agent/steering/tech.md` | 技術スタック、開発コマンド |
| `.ai-agent/steering/plan.md` | 実装計画、セグメント状態 |
| `.ai-agent/steering/work.md` | 作業の進め方 |
| `.ai-agent/structure.md` | ディレクトリ構成 |

## 手順

### 1. 現状把握

プロジェクトの実態を確認:

```bash
# パッケージ構成
ls packages/

# 各パッケージの src 構成
ls packages/*/src/

# 実装済み機能
ls packages/client/src/features/
ls packages/server/src/

# package.json のスクリプト
cat package.json | jq '.scripts'
```

### 2. ドキュメント読み込み

各ドキュメントを読み込み、現状と比較:
- 未作成と書かれているが作成済みのもの
- 存在すると書かれているが実際にないもの
- 完了状態が実態と異なるもの
- コマンドが存在しない/変更されているもの

### 3. 陳腐化箇所の特定

ユーザーに以下の形式で報告:

```
## 陳腐化箇所

| ファイル | 箇所 | 現状 | ドキュメント記載 |
|---------|------|------|-----------------|
| tech.md | shared パッケージ | 作成済み | 「未作成」 |
| structure.md | client/shared/ | 存在しない | 記載あり |
```

### 4. ユーザー確認

修正内容を提示し、承認を得る:
- 修正する項目一覧
- 修正しない項目があればその理由

### 5. 修正実行

承認後、各ファイルを編集:
- 事実に基づく修正のみ行う
- 推測で情報を追加しない
- 将来の予定は現状のままにする

### 6. コミット

```bash
git add README.md .ai-agent/
git commit -m "Update steering documents to reflect current project state"
```

## 確認ポイント

### README.md
- 技術スタックが最新か
- セットアップ手順が動作するか
- 主な機能が現状を反映しているか

### tech.md
- パッケージ状態（セットアップ済み/未作成）
- 開発コマンドが存在するか
- バージョン情報が正しいか

### plan.md
- セグメントの状態（完了/進行中/未着手）
- 実装順序が現状を反映しているか

### structure.md
- ディレクトリ構成が実態と一致するか
- 各ディレクトリの説明が正確か

## 注意事項

- product.md は機能仕様なので、実装状態ではなく設計意図として扱う
- work.md は作業フローなので、変更は慎重に
- 将来実装予定の記載は削除しない（plan.md で状態管理）

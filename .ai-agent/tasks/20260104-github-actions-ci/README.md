# GitHub Actions による CI 整備

## 目的・ゴール

Pull Request 時に自動でコード品質チェック・テストを実行し、品質を維持する。

## 実装方針

### ワークフロー構成

1. **CI ワークフロー** (`.github/workflows/ci.yml`)
   - トリガー: Pull Request、main ブランチへの push
   - 実行内容:
     - lint チェック（ESLint + dependency-cruiser）
     - 型チェック（TypeScript）
     - テスト実行（Vitest）
     - ビルド確認

### 設計方針

- **Node.js バージョン**: 20.x（tech.md の要件）
- **依存関係キャッシュ**: npm cache を利用して高速化
- **並列実行**: lint, typecheck, test, build を並列で実行

### ワークフロー詳細

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    # ESLint + dependency-cruiser

  typecheck:
    # TypeScript 型チェック

  test:
    # Vitest テスト実行

  build:
    # ビルド確認
```

## 完了条件

- [x] `.github/workflows/ci.yml` を作成
- [ ] PR 作成時に CI が自動実行される（要検証）
- [x] lint, typecheck, test, build が全て通る

## 作業ログ

### 2026-01-04

- タスク開始
- 参考リポジトリ (mizunashi-mana/github-contribute-summary) を確認
- CI 用スクリプト `lint:ci` をルート package.json に追加
- `.github/actions/setup-node/action.yml` を作成（composite action）
- `.github/workflows/ci.yml` を作成
  - 各パッケージごとにステップを分離して実行時間分析を容易に
  - lint, typecheck, test, build の 4 ジョブを並列実行
- `.github/dependabot.yml` を作成（monthly 更新）
- ローカルで全コマンドの動作確認完了

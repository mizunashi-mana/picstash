# リリースワークフロー整備

## 目的・ゴール

GitHub Actions の手動実行（workflow_dispatch）でリリースを行えるようにする。

### やりたいこと

1. 手動トリガーでリリースバージョンを指定
2. リリースタグを作成
3. マルチプラットフォームでインストーラをビルド
4. GitHub Release を作成し、インストーラを添付

## 現状

- `cd-desktop-release.yml` が存在
  - workflow_dispatch で手動実行可能
  - macOS / Windows / Linux でビルド
  - アーティファクトとしてアップロード（30日保持）
  - **未実装**: タグ作成、Release 作成、アセット添付

## 実装方針

1. 既存の `cd-desktop-release.yml` を拡張
2. workflow_dispatch の inputs でバージョンを入力
3. バージョン入力に基づいてタグを作成（`v{version}`）
4. 全プラットフォームのビルド完了後、GitHub Release を作成
5. アーティファクトを Release アセットとして添付

### ワークフロー構成

```yaml
on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Release version (e.g., 0.1.0)'
        required: true
        type: string

jobs:
  build:
    # 既存のビルドジョブ（マトリックス）

  release:
    needs: build
    # タグ作成 + Release 作成 + アセット添付
```

## 完了条件

- [x] workflow_dispatch でバージョン入力が可能
- [x] 指定バージョンでタグが作成される
- [x] GitHub Release が作成される
- [x] 各プラットフォームのインストーラが Release に添付される
- [x] package.json のバージョンも更新される

## 作業ログ

### 2026-02-07

- `cd-desktop-release.yml` を拡張
  - `workflow_dispatch.inputs.version` を追加
  - `version-update` ジョブを追加（package.json 更新、タグ作成・push）
  - `build` ジョブが `version-update` に依存するよう変更
  - `release` ジョブを追加（アーティファクトダウンロード、GitHub Release 作成）
- YAML 構文チェック OK

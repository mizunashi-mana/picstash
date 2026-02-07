# desktop-app のインストーラー CD ワークフロー作成

## 目的・ゴール

GitHub Actions で desktop-app のインストーラー（dmg / exe / AppImage / deb）をビルドし、artifact として保存する CD ワークフローを作成する。

## 現状分析

### 既存のワークフロー
- `ci-test.yml`: テスト・E2E 実行
- `ci-lint.yml`: リント・型チェック

### desktop-app のビルド設定
- `electron-builder.json` で各プラットフォーム用のビルド設定が既に存在
  - **macOS**: dmg (x64, arm64)
  - **Windows**: nsis (x64)
  - **Linux**: AppImage (x64), deb (x64)
- `npm run package` で `electron-builder` が実行される

## 実装方針

### 1. 新規ワークフローファイル作成
`.github/workflows/cd-desktop-release.yml` を作成

### 2. トリガー条件
- **手動実行**: `workflow_dispatch` で任意のタイミングでビルド可能

### 3. ビルド対象プラットフォーム
マトリックス戦略を使用して各 OS でビルド:
- **macOS** (macos-latest): dmg (x64, arm64)
- **Windows** (windows-latest): nsis installer (x64)
- **Linux** (ubuntu-latest): AppImage, deb (x64)

### 4. アーティファクト保存
各プラットフォームのインストーラーを GitHub Artifacts として保存

## 完了条件

- [ ] CD ワークフローが正常に動作する
- [ ] 各プラットフォーム（macOS / Windows / Linux）でビルドが成功する
- [ ] 生成されたインストーラーが artifact として保存される
- [ ] 手動実行でトリガーできる

## 作業ログ

### 2026-02-07
- `.github/workflows/cd-desktop-release.yml` を作成
  - `workflow_dispatch` による手動実行のみ
  - マトリックス戦略で macOS / Windows / Linux を並列ビルド
  - 各プラットフォームのインストーラーを artifact として保存（30日間保持）

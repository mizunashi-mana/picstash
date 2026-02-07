# e2e-test パッケージを web-client パッケージに統合

## 関連 Issue

https://github.com/mizunashi-mana/picstash/issues/186

## 目的・ゴール

e2e-test パッケージの内容を web-client パッケージに移動し、パッケージ構成を簡素化する。
desktop-app と同様に `tests/e2e/` ディレクトリ内に e2e テストを配置する構成に統一する。

## 背景

- 現在 e2e-test は独立したパッケージとして存在している
- web-client のテストとして統合することで、パッケージ管理がシンプルになる
- desktop-app では既に tests/e2e/ ディレクトリ内に e2e テストが含まれており、同様の構成に統一できる

## 現状

### e2e-test パッケージ構成

```
packages/e2e-test/
├── tests/
│   ├── gallery.spec.ts
│   ├── image-delete.spec.ts
│   ├── image-detail.spec.ts
│   └── upload.spec.ts
├── fixtures/
│   ├── test-image-blue.png
│   └── test-image-red.png
├── playwright.config.ts
├── config.yaml              # E2E テスト用サーバー設定
├── package.json
├── tsconfig.json
└── eslint.config.mjs
```

### desktop-app の e2e テスト構成（参考）

```
packages/desktop-app/
├── tests/
│   ├── e2e/
│   │   └── app.spec.ts
│   └── unit/
│       └── ...
├── playwright.config.ts
└── ...
```

## 実装方針

### Step 1: 既存ユニットテストを tests/unit に移動
1. tests/ 直下のテストファイル・ディレクトリを tests/unit/ に移動
2. tests/setup.ts はルートに残す（unit/e2e 共通で使用可能）
3. vitest.config.ts の include パスを `tests/unit/**/*.test.{ts,tsx}` に変更

### Step 2: e2e-test パッケージを統合
4. e2e-test パッケージの内容を web-client/tests/e2e/ に移動
5. fixtures を web-client/tests/e2e/fixtures/ に移動
6. playwright.config.ts を web-client に配置（既存の vitest.config と共存）
7. config.yaml を web-client/tests/e2e/config.yaml に移動
8. e2e-test パッケージの依存関係を web-client に追加
9. web-client の package.json に e2e テスト用スクリプトを追加
10. e2e-test パッケージを削除
11. CI ワークフローを更新
12. root package.json の test:e2e スクリプトを更新

## 完了条件

- [x] e2e テストファイルが web-client/tests/e2e/ に移動されている
- [x] fixtures が web-client/tests/e2e/fixtures/ に移動されている
- [x] playwright.config.ts が web-client に配置されている
- [x] e2e テスト用 config.yaml が web-client/tests/e2e/ に配置されている
- [x] web-client package.json に e2e テスト用スクリプトが追加されている
- [x] e2e-test パッケージが削除されている
- [x] CI ワークフローが更新されている
- [x] root package.json の test:e2e が更新されている
- [ ] `npm run test:e2e` で e2e テストが実行できる（ローカルで確認予定）

## 作業ログ

### 2026-02-07

1. **Step 1: 既存ユニットテストを tests/unit に移動**
   - `packages/web-client/tests/` 直下のディレクトリを `tests/unit/` に移動
   - `vitest.config.ts` の include パスを `tests/unit/**/*.test.{ts,tsx}` に変更
   - ユニットテスト実行確認: 23 files, 192 tests passed

2. **Step 2: e2e-test パッケージを web-client に統合**
   - テストファイル 4 件を `tests/e2e/` に移動
   - fixtures を `tests/e2e/fixtures/` に移動
   - `playwright.config.ts` を web-client に作成
   - `config.yaml` を `tests/e2e/config.yaml` に移動
   - `@playwright/test` を devDependencies に追加
   - `test:e2e` スクリプトを追加
   - `.gitignore` に playwright-report と test-results を追加

3. **Step 3: e2e-test パッケージ削除と CI 更新**
   - `packages/e2e-test` ディレクトリを削除
   - `.github/workflows/ci-test.yml` の test-e2e ジョブを更新
   - root `package.json` の `test:e2e` スクリプトを更新
   - `npm install` で依存関係を更新

4. **ドキュメント更新**
   - `.ai-agent/structure.md` を更新
   - `.ai-agent/steering/tech.md` を更新
